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

    // Check if user is record office (admin)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'record_office') {
      return new Response(JSON.stringify({ error: 'Access denied. Admin privileges required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const method = req.method;
    
    console.log(`Users API - ${method} request to ${url.pathname}`);

    // GET /users - Fetch all users
    if (method === 'GET') {
      const { data: users, error: usersError } = await supabaseClient
        .from('profiles')
        .select(`
          *,
          department:departments(name, code)
        `)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Users fetch error:', usersError);
        return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /users/:id - Update user profile
    if (method === 'PUT') {
      const userId = url.pathname.split('/').pop();
      const { full_name, role, department_id, phone, is_active } = await req.json();

      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing user ID' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updateData: any = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (role !== undefined) updateData.role = role;
      if (department_id !== undefined) updateData.department_id = department_id;
      if (phone !== undefined) updateData.phone = phone;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: updatedUser, error: updateError } = await supabaseClient
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select(`
          *,
          department:departments(name, code)
        `)
        .single();

      if (updateError) {
        console.error('User update error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update user' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('User updated successfully:', userId);
      return new Response(JSON.stringify({ user: updatedUser }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /users/assign-role - Assign role to user
    if (method === 'POST') {
      const { user_id, role, department_id } = await req.json();

      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: 'Missing user ID or role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: updatedUser, error: updateError } = await supabaseClient
        .from('profiles')
        .update({ role, department_id })
        .eq('id', user_id)
        .select(`
          *,
          department:departments(name, code)
        `)
        .single();

      if (updateError) {
        console.error('Role assignment error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to assign role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Role assigned successfully:', user_id, role);
      return new Response(JSON.stringify({ user: updatedUser }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Users function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});