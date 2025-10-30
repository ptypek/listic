import type { APIRoute } from "astro";
import { z } from "zod";
import { updateListItemSchema, uuidValidator } from "../../../../lib/validators/list.validator";
import { listService } from "../../../../services/list.service";

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // 1. Authentication
  const { user } = locals;
  if (!user) {
    return new Response(
      JSON.stringify({ message: "Unauthorized" }),
      { status: 401 }
    );
  }

  // 2. Path Parameter Validation
  const { itemId } = params;
  if (!itemId) {
    return new Response(JSON.stringify({ message: "Item ID is required" }), {
      status: 400,
    });
  }

  try {
    // 3. Request Body Validation
    const body = await request.json();
    const validatedData = updateListItemSchema.parse(body);

    // 4. Call Service Logic
    const updatedItem = await listService.updateListItem(
      locals.supabase,
      itemId,
      validatedData,
      user.id
    );

    // 5. Success Response
    return new Response(JSON.stringify(updatedItem), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Error Handling
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ message: "Invalid request body", errors: error.errors }),
        { status: 400 }
      );
    }

    if (error.name === "NotFoundError") {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 404,
      });
    } 

    console.error("Error updating list item:", error);
    return new Response(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  // 1. Authentication
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  // 2. Path Parameter Validation
  const result = uuidValidator.safeParse(params.itemId);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        message: "Invalid request parameters",
        errors: result.error.flatten().fieldErrors,
      }),
      { status: 400 }
    );
  }

  try {
    await listService.deleteListItem(locals.supabase, result.data.uuId, user.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    // @ts-ignore
    if (error.name === "NotFoundError") {
      // @ts-ignore
      return new Response(JSON.stringify({ message: error.message }), {
        status: 404,
      });
    }

    console.error("Error deleting list item:", error);
    return new Response(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
};
