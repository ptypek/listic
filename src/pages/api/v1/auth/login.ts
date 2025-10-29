import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '@/db/supabase.client';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerInstance({ cookies, request });

  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(
      JSON.stringify({
        error: 'Email and password are required',
      }),
      { status: 400 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { status: 400 },
    );
  }

  return new Response(JSON.stringify(data));
};
