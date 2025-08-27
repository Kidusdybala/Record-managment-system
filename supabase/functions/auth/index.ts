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

    const method = req.method;
    const url = new URL(req.url);
    
    console.log(`Auth API - ${method} request to ${url.pathname}`);

    // POST /auth/profile - Get user profile with role information
    if (method === 'POST' && url.pathname.includes('/profile')) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select(`
          *,
          department:departments(id, name, code, description)
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        user: {
          id: user.id,
          email: user.email,
          ...profile
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /auth/update-profile - Update user profile
    if (method === 'POST' && url.pathname.includes('/update-profile')) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { full_name, phone } = await req.json();

      const updateData: any = {};
      if (full_name) updateData.full_name = full_name;
      if (phone !== undefined) updateData.phone = phone;

      const { data: profile, error: updateError } = await supabaseClient
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select(`
          *,
          department:departments(id, name, code, description)
        `)
        .single();

      if (updateError) {
        console.error('Profile update error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        user: {
          id: user.id,
          email: user.email,
          ...profile
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /auth/change-password - Change user password
    if (method === 'POST' && url.pathname.includes('/change-password')) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { currentPassword, newPassword } = await req.json();

      if (!currentPassword || !newPassword) {
        return new Response(JSON.stringify({ error: 'Current and new passwords are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify current password by attempting to sign in
      const { error: verifyError } = await supabaseClient.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      });

      if (verifyError) {
        return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update password
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update password' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auth function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});