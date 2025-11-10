import type { APIRoute } from "astro";
import { generateListFromRecipesSchema } from "../../../../lib/validators/list.validator";
import { listService } from "../../../../services/list.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
        return new Response(JSON.stringify({ error: 'User is not authenticated.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const body = await request.json();
    const validation = generateListFromRecipesSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error.flatten() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await listService.generateListFromRecipes(validation.data, user.id, locals.supabase);

    return new Response(JSON.stringify(result), {
      status: 201, // 201 Created
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in POST /generate-from-recipes:", error);
    if (error instanceof Error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
    return new Response(JSON.stringify({ error: "An unknown error occurred." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
    });
  }
};