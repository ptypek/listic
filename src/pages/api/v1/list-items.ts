import type { APIRoute } from "astro";
import { addListItemSchema } from "../../../lib/validators/list.validator";
import { listService } from "../../../services/list.service";

export const POST: APIRoute = async (context) => {
  const { request, locals } = context;
  const supabase = locals.supabase;
  const session = locals.session;

  if (!session?.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = addListItemSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ message: "Invalid request body", errors: validation.error.flatten() }), { status: 400 });
    }

    const newItem = await listService.addListItem(supabase, validation.data, session.user.id);

    return new Response(JSON.stringify(newItem), { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
        return new Response(JSON.stringify({ message: error.message }), { status: 404 });
    }
    console.error("Error adding list item:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
};
