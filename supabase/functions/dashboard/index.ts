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

    const method = req.method;
    console.log(`Dashboard API - ${method} request`);

    // GET /dashboard - Get dashboard statistics
    if (method === 'GET') {
      // Get user profile to determine role
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role, department_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const stats: any = {};

      // Get letter statistics based on user role
      if (profile.role === 'record_office') {
        // Admin sees all statistics
        const { data: totalLetters } = await supabaseClient
          .from('letters')
          .select('id', { count: 'exact' });

        const { data: pendingLetters } = await supabaseClient
          .from('letters')
          .select('id', { count: 'exact' })
          .in('status', ['submitted', 'pending_admin_approval', 'pending_minister_approval']);

        const { data: approvedLetters } = await supabaseClient
          .from('letters')
          .select('id', { count: 'exact' })
          .eq('status', 'approved');

        const { data: rejectedLetters } = await supabaseClient
          .from('letters')
          .select('id', { count: 'exact' })
          .eq('status', 'rejected');

        const { data: totalUsers } = await supabaseClient
          .from('profiles')
          .select('id', { count: 'exact' });

        stats.totalLetters = totalLetters?.length || 0;
        stats.pendingLetters = pendingLetters?.length || 0;
        stats.approvedLetters = approvedLetters?.length || 0;
        stats.rejectedLetters = rejectedLetters?.length || 0;
        stats.totalUsers = totalUsers?.length || 0;

        // Get recent letters for admin
        const { data: recentLetters } = await supabaseClient
          .from('letters')
          .select(`
            *,
            sender:profiles!letters_sender_id_fkey(full_name),
            sender_department:departments!letters_sender_department_id_fkey(name),
            recipient_department:departments!letters_recipient_department_id_fkey(name)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        stats.recentLetters = recentLetters || [];

      } else if (profile.role === 'minister') {
        // Minister sees letters requiring approval
        const { data: pendingApprovals } = await supabaseClient
          .from('letters')
          .select('id', { count: 'exact' })
          .or('requires_minister_approval.eq.true,status.eq.pending_minister_approval');

        const { data: approvedByMinister } = await supabaseClient
          .from('letter_approvals')
          .select('id', { count: 'exact' })
          .eq('approver_id', user.id)
          .eq('approval_type', 'minister_approval')
          .eq('status', 'approved');

        stats.pendingApprovals = pendingApprovals?.length || 0;
        stats.approvedByMinister = approvedByMinister?.length || 0;

        // Get letters requiring minister approval
        const { data: lettersForApproval } = await supabaseClient
          .from('letters')
          .select(`
            *,
            sender:profiles!letters_sender_id_fkey(full_name),
            sender_department:departments!letters_sender_department_id_fkey(name),
            recipient_department:departments!letters_recipient_department_id_fkey(name)
          `)
          .or('requires_minister_approval.eq.true,status.eq.pending_minister_approval')
          .order('created_at', { ascending: false })
          .limit(10);

        stats.lettersForApproval = lettersForApproval || [];

      } else {
        // Department user statistics
        const { data: sentLetters } = await supabaseClient
          .from('letters')
          .select('id', { count: 'exact' })
          .eq('sender_id', user.id);

        const { data: receivedLetters } = await supabaseClient
          .from('letters')
          .select('id', { count: 'exact' })
          .eq('recipient_department_id', profile.department_id);

        const { data: pendingLetters } = await supabaseClient
          .from('letters')
          .select('id', { count: 'exact' })
          .eq('sender_id', user.id)
          .in('status', ['submitted', 'pending_admin_approval', 'pending_minister_approval']);

        stats.sentLetters = sentLetters?.length || 0;
        stats.receivedLetters = receivedLetters?.length || 0;
        stats.pendingLetters = pendingLetters?.length || 0;

        // Get recent letters for department user
        const { data: recentLetters } = await supabaseClient
          .from('letters')
          .select(`
            *,
            sender:profiles!letters_sender_id_fkey(full_name),
            sender_department:departments!letters_sender_department_id_fkey(name),
            recipient_department:departments!letters_recipient_department_id_fkey(name)
          `)
          .or(`sender_id.eq.${user.id},recipient_department_id.eq.${profile.department_id}`)
          .order('created_at', { ascending: false })
          .limit(10);

        stats.recentLetters = recentLetters || [];
      }

      // Get departments count for all users
      const { data: totalDepartments } = await supabaseClient
        .from('departments')
        .select('id', { count: 'exact' });

      stats.totalDepartments = totalDepartments?.length || 0;
      stats.userRole = profile.role;

      return new Response(JSON.stringify({ stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Dashboard function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});