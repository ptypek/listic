import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { CreateListSchema } from "../../../../lib/validators/list.validator";
import { listService } from "../../../../services/list.service";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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
      validation.data,
      DEFAULT_USER_ID,
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