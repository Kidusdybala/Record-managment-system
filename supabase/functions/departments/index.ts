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
    console.log(`Departments API - ${method} request`);

    // GET /departments - Fetch all departments
    if (method === 'GET') {
      const { data: departments, error: deptError } = await supabaseClient
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (deptError) {
        console.error('Departments fetch error:', deptError);
        return new Response(JSON.stringify({ error: 'Failed to fetch departments' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ departments }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is record office (admin) for POST/PUT/DELETE operations
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

    // POST /departments - Create new department
    if (method === 'POST') {
      const { name, code, description } = await req.json();

      if (!name || !code) {
        return new Response(JSON.stringify({ error: 'Name and code are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: department, error: createError } = await supabaseClient
        .from('departments')
        .insert({ name, code, description })
        .select()
        .single();

      if (createError) {
        console.error('Department creation error:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create department' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Department created successfully:', department.id);
      return new Response(JSON.stringify({ department }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /departments/:id - Update department
    if (method === 'PUT') {
      const url = new URL(req.url);
      const deptId = url.pathname.split('/').pop();
      const { name, code, description } = await req.json();

      if (!deptId) {
        return new Response(JSON.stringify({ error: 'Department ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (code) updateData.code = code;
      if (description !== undefined) updateData.description = description;

      const { data: department, error: updateError } = await supabaseClient
        .from('departments')
        .update(updateData)
        .eq('id', deptId)
        .select()
        .single();

      if (updateError) {
        console.error('Department update error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update department' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Department updated successfully:', deptId);
      return new Response(JSON.stringify({ department }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /departments/:id - Delete department
    if (method === 'DELETE') {
      const url = new URL(req.url);
      const deptId = url.pathname.split('/').pop();

      if (!deptId) {
        return new Response(JSON.stringify({ error: 'Department ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if department has users assigned
      const { data: usersInDept, error: checkError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('department_id', deptId)
        .limit(1);

      if (checkError) {
        console.error('Department check error:', checkError);
        return new Response(JSON.stringify({ error: 'Failed to check department usage' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (usersInDept && usersInDept.length > 0) {
        return new Response(JSON.stringify({ error: 'Cannot delete department with assigned users' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: deleteError } = await supabaseClient
        .from('departments')
        .delete()
        .eq('id', deptId);

      if (deleteError) {
        console.error('Department deletion error:', deleteError);
        return new Response(JSON.stringify({ error: 'Failed to delete department' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Department deleted successfully:', deptId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Departments function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});