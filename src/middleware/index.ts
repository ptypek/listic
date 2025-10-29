import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '@/db/supabase.client';

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

  return next();
});
