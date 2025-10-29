import type { APIRoute } from "astro";
import { getListValidator } from "../../../../lib/validators/list.validator";
import { listService } from "../../../../services/list.service";

export const GET: APIRoute = async ({ params, locals }) => {
  const { session, supabase } = locals;
  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { listId } = params;

  const validationResult = getListValidator.safeParse({ listId });

  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error.flatten()), {
      status: 400,
    });
  }

  try {
    const list = await listService.getListById(
      supabase,
      validationResult.data.listId,
      session.user.id
    );

    if (!list) {
      return new Response(JSON.stringify({ message: "List not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(list), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};