import type { APIRoute } from "astro";
import { generateListFromRecipesSchema } from "../../../../lib/validators/list.validator";
import { listService } from "../../../../services/list.service";
import { DEFAULT_USER_ID, supabaseClient } from "../../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const validation = generateListFromRecipesSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error.flatten() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: Replace DEFAULT_USER_ID with authenticated user from locals
    const userId = DEFAULT_USER_ID;

    const result = await listService.generateListFromRecipes(validation.data, userId, supabaseClient);

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
