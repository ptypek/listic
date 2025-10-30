import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '@/db/supabase.client';

// Routes that do not require authentication
const publicApiRoutes = ['/api/v1/auth/login', '/api/v1/auth/register'];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerInstance({ cookies: context.cookies, request: context.request });

  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (session && user) {
    context.locals.session = session;
    context.locals.user = user;
  } else {
    context.locals.session = null;
    context.locals.user = null;
  }
  context.locals.supabase = supabase;

  const pathname = context.url.pathname;

  // Protect all API routes under /api/v1/ unless they are public
  if (pathname.startsWith('/api/v1/') && !publicApiRoutes.some(route => pathname.startsWith(route))) {
    if (!context.locals.session) {
      return new Response(JSON.stringify({ error: 'User is not authenticated.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return next();
});
