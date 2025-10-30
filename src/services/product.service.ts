import type { SupabaseClient } from "@supabase/supabase-js";
import type { PopularProductDto } from "../types";

export async function searchPopularProducts(
    supabase: SupabaseClient,
    searchTerm: string
): Promise<PopularProductDto[]> {
    const { data, error } = await supabase
        .from('popular_products')
        .select('id, name, category_id')
        .textSearch('name', searchTerm, {
            type: 'websearch',
        })
        .limit(10);

    if (error) {
        console.error("Error searching popular products:", error);
        throw new Error("Failed to fetch popular products.");
    }

    return data || [];
}