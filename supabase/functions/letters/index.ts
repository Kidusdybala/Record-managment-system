import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const method = req.method;
    
    console.log(`Letters API - ${method} request to ${url.pathname}`);

    // GET /letters - Fetch letters based on user role
    if (method === 'GET') {
      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('role, department_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let query = supabaseClient
        .from('letters')
        .select(`
          *,
          sender:profiles!letters_sender_id_fkey(full_name, role),
          sender_department:departments!letters_sender_department_id_fkey(name, code),
          recipient_department:departments!letters_recipient_department_id_fkey(name, code)
        `)
        .order('created_at', { ascending: false });

      // Apply filters based on user role
      if (profile.role === 'minister') {
        query = query.or('requires_minister_approval.eq.true,status.eq.pending_minister_approval');
      } else if (profile.role !== 'record_office') {
        // Department users see their own letters and letters sent to their department
        query = query.or(`sender_id.eq.${user.id},recipient_department_id.eq.${profile.department_id}`);
      }

      const { data: letters, error: lettersError } = await query;

      if (lettersError) {
        console.error('Letters fetch error:', lettersError);
        return new Response(JSON.stringify({ error: 'Failed to fetch letters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ letters }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /letters - Create new letter
    if (method === 'POST') {
      const { subject, content, recipient_department_id, priority, requires_minister_approval } = await req.json();

      if (!subject || !content || !recipient_department_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get user's department
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('department_id')
        .eq('id', user.id)
        .single();

      // Generate reference number
      const { data: refNumber, error: refError } = await supabaseClient.rpc('generate_reference_number');
      
      if (refError) {
        console.error('Reference number generation error:', refError);
        return new Response(JSON.stringify({ error: 'Failed to generate reference number' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: letter, error: letterError } = await supabaseClient
        .from('letters')
        .insert({
          reference_number: refNumber,
          subject,
          content,
          sender_id: user.id,
          sender_department_id: profile?.department_id,
          recipient_department_id,
          priority: priority || 'normal',
          requires_minister_approval: requires_minister_approval || false,
          status: 'submitted'
        })
        .select()
        .single();

      if (letterError) {
        console.error('Letter creation error:', letterError);
        return new Response(JSON.stringify({ error: 'Failed to create letter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create tracking entry
      await supabaseClient
        .from('letter_tracking')
        .insert({
          letter_id: letter.id,
          action: 'Letter submitted',
          performed_by: user.id,
          comments: 'Letter submitted for processing'
        });

      // Create admin approval entry
      await supabaseClient
        .from('letter_approvals')
        .insert({
          letter_id: letter.id,
          approver_id: user.id, // This will be updated when admin processes
          approval_type: 'admin_review',
          status: 'pending'
        });

      console.log('Letter created successfully:', letter.id);
      return new Response(JSON.stringify({ letter }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /letters/:id - Update letter status
    if (method === 'PUT') {
      const letterId = url.pathname.split('/').pop();
      const { status, comments, approval_type } = await req.json();

      if (!letterId || !status) {
        return new Response(JSON.stringify({ error: 'Missing letter ID or status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update letter status
      const { data: letter, error: updateError } = await supabaseClient
        .from('letters')
        .update({ status })
        .eq('id', letterId)
        .select()
        .single();

      if (updateError) {
        console.error('Letter update error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update letter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update approval record if provided
      if (approval_type) {
        await supabaseClient
          .from('letter_approvals')
          .update({
            status: status === 'approved' ? 'approved' : 'rejected',
            comments,
            approved_at: new Date().toISOString(),
            approver_id: user.id
          })
          .eq('letter_id', letterId)
          .eq('approval_type', approval_type);
      }

      // Create tracking entry
      await supabaseClient
        .from('letter_tracking')
        .insert({
          letter_id: letterId,
          action: `Letter ${status}`,
          performed_by: user.id,
          comments: comments || `Letter status changed to ${status}`
        });

      console.log('Letter updated successfully:', letterId);
      return new Response(JSON.stringify({ letter }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Letters function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});