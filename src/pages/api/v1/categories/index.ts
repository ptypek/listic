import type { APIRoute } from "astro";
import { getCategories } from "@/services/category.service.ts";

export const GET: APIRoute = async ({}) => {
    try {
        const categories = await getCategories();
        return new Response(JSON.stringify(categories), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({
            error: "Internal Server Error",
            message: "An unexpected error occurred."
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
}
