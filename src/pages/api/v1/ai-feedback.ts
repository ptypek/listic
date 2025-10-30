import type { APIRoute } from 'astro';
import { AiFeedbackValidator } from '@/lib/validators/ai-feedback.validator';
import { AiFeedbackService } from '@/services/ai-feedback.service';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { locals, request } = context;
  const { supabase, session } = locals;

  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedBody = AiFeedbackValidator.safeParse(body);

    if (!validatedBody.success) {
      return new Response(JSON.stringify({ error: 'Bad Request', details: validatedBody.error.flatten() }), {
        status: 400,
      });
    }

    const { list_item_id } = validatedBody.data;
    const userId = session.user.id;

    const aiFeedbackService = new AiFeedbackService(supabase);
    await aiFeedbackService.logFeedback({ list_item_id }, userId);

    return new Response(JSON.stringify({ message: 'Feedback received. Thank you!' }), {
      status: 202,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NotFound') {
        return new Response(JSON.stringify({ error: 'List item not found' }), { status: 404 });
      }
      if (error.message === 'InternalServerError') {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
      }
    }
    
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
