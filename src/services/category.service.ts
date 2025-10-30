import { supabaseClient } from "@/db/supabase.client";
import type { CategoryDto } from "@/types";

export const getCategories = async (): Promise<CategoryDto[]> => {
    const { data, error } = await supabaseClient.from("categories").select("*");

    if (error) {
        throw new Error(error.message);
    }

    return data as CategoryDto[];
}
