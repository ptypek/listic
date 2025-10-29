import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { CreateListSchema, GetListsQueryDto } from "../../../../lib/validators/list.validator";
import { listService } from "../../../../services/list.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const session = locals.session;

  if (!session || !session.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Użytkownik nie jest uwierzytelniony.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validation = GetListsQueryDto.safeParse(queryParams);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          message: validation.error.flatten(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { data: lists, error } = await listService.getLists(
      locals.supabase,
      session.user.id,
      validation.data,
    );

    if (error) {
      console.error("Error fetching lists:", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Wystąpił błąd podczas pobierania list.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(JSON.stringify(lists), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /lists:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił nieoczekiwany błąd.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session;

  if (!session || !session.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Użytkownik nie jest uwierzytelniony.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const body = await request.json();
    const validation = CreateListSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          message: validation.error.flatten(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const newList = await listService.createList(
      locals.supabase,
      validation.data,
      session.user.id,
    );

    return new Response(JSON.stringify(newList), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          message: error.flatten(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
    
    console.error("Error creating list:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił nieoczekiwany błąd podczas tworzenia listy.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};