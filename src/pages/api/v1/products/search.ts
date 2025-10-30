import type { APIContext } from "astro";
import { z } from "zod";
import { searchPopularProducts } from "../../../../services/product.service";

export const prerender = false;

const SearchQuerySchema = z.object({
    q: z.string().min(1, { message: "Query parameter 'q' is required and must not be empty." })
});

export async function GET({ request, locals }: APIContext) {
    const supabase = locals.supabase;
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    const validation = SearchQuerySchema.safeParse({ q: query });

    if (!validation.success) {
        return new Response(JSON.stringify({ error: validation.error.flatten().fieldErrors.q?.[0] }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const products = await searchPopularProducts(supabase, validation.data.q);
        return new Response(JSON.stringify(products), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}