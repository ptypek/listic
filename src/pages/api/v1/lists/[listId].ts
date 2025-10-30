import type { APIRoute } from "astro";
import { uuidValidator, UpdateListValidator } from "../../../../lib/validators/list.validator";
import { listService } from "../../../../services/list.service";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { session, supabase } = locals;
  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: "User is not authenticated" }), { status: 401 });
  }

  const { listId } = params;

  const listIdValidation = uuidValidator.safeParse({ uuId: listId });

  if (!listIdValidation.success) {
    return new Response(JSON.stringify({ error: "Invalid list ID format" }), {
      status: 400,
    });
  }

  try {
    await listService.deleteList(
      supabase,
      listIdValidation.data.uuId,
      session.user.id
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Not Found') {
      return new Response(JSON.stringify({ error: "List not found or user does not have access" }), { status: 404 });
    }
    console.error(error);
    return new Response(JSON.stringify({ error: "An internal server error occurred" }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ params, locals }) => {
  const { session, supabase } = locals;
  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { listId } = params;

  const validationResult = uuidValidator.safeParse({ uuId: listId });

  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error.flatten()), {
      status: 400,
    });
  }

  try {
    const list = await listService.getListById(
      supabase,
      validationResult.data.uuId,
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

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { session, supabase } = locals;
  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { listId } = params;
  const listIdValidation = uuidValidator.safeParse({ uuId: listId });

  if (!listIdValidation.success) {
    return new Response(JSON.stringify(listIdValidation.error.flatten()), {
      status: 400,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ message: "Invalid request body" }), { status: 400 });
  }

  const bodyValidation = UpdateListValidator.safeParse(body);

  if (!bodyValidation.success) {
    return new Response(JSON.stringify(bodyValidation.error.flatten()), {
      status: 400,
    });
  }

  try {
    const updatedList = await listService.updateList(
      supabase,
      listIdValidation.data.uuId,
      bodyValidation.data,
      session.user.id
    );

    if (!updatedList) {
      return new Response(JSON.stringify({ message: "List not found or you don't have permission to update it" }), { status: 404 });
    }

    return new Response(JSON.stringify(updatedList), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};