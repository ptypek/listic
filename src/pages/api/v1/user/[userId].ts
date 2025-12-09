import type { APIRoute } from "astro";
import { uuidValidator } from "../../../../lib/validators/list.validator";
import { deleteUserAccount } from "../../../../services/user.service";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  // 1. Authentication
  const { user } = locals;
  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  

  // 2. Path Parameter Validation
  const result = uuidValidator.safeParse({ uuId: params.userId });
  if (!result.success) {
    return new Response(
      JSON.stringify({
        message: "Invalid request parameters",
        errors: result.error.flatten().fieldErrors,
      }),
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY, 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    await deleteUserAccount(supabaseAdmin, result.data.uuId);
    return new Response(null, { status: 204 });
  } catch (error) {
    // @ts-expect-error - error is not typed
    if (error.name === "NotFoundError") {
      // @ts-expect-error - error is not typed
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