import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '@/db/supabase.client';

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerInstance({ cookies: context.cookies, request: context.request });

  const { data: { user } } = await supabase.auth.getUser();

  context.locals.user = user;

  return next();
});
