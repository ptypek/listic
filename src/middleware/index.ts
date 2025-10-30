import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '@/db/supabase.client';

const protectedApiRoutes = [
  '/api/v1/lists',
  '/api/v1/list-items',
  '/api/v1/products/search',
  '/api/v1/ai-feedback',
  '/api/v1/categories',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerInstance({ cookies: context.cookies, request: context.request });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (session && user && user.aud === 'authenticated') {
    context.locals.session = session;
    context.locals.user = user;
  } else {
    context.locals.session = null;
    context.locals.user = null;
  }
  context.locals.supabase = supabase;

  const pathname = context.url.pathname;

  const isProtectedRoute = protectedApiRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !context.locals.user) {
    return new Response(JSON.stringify({ error: 'User is not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return next();
});
