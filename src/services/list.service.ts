import { z } from "zod";
import { type SupabaseClient } from "../db/supabase.client";
import { AiServiceResponseSchema, type CreateListPayload, GetListsQueryDto } from "../lib/validators/list.validator";
import type { GenerateListFromRecipesCommand, ShoppingListWithItemsDto } from "../types";

const aiCategoryToDbCategory: { [key: string]: string } = {
    "Dairy & Eggs": "nabiał",  
    "Vegetables": "warzywa",
    "Meat": "mięso",
    "Pantry Staples": "suche",
    "Fruits": "owoce",  
    "Fish": "ryby",
    "Spices & Herbs": "przyprawy",
    "Other": "inne",
};

class ListService {
  async createList(supabase: SupabaseClient, payload: CreateListPayload, userId: string) {
    const { name } = payload;

    const { data, error } = await supabase
      .from("shopping_lists")
      .insert([{ name, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error("Error creating list in Supabase:", error);
      throw new Error("Failed to create list in the database.");
    }

    return data;
  }

  async getLists(supabase: SupabaseClient, userId: string, query: z.infer<typeof GetListsQueryDto>) {
    const { sort, order } = query;

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", userId)
      .order(sort, { ascending: order === "asc" });

    return { data, error };
  }

  async generateListFromRecipes(cmd: GenerateListFromRecipesCommand, userId: string, supabase: SupabaseClient): Promise<ShoppingListWithItemsDto | null> {
    // 1. Construct prompt for AI (as implemented before)
    const { recipes, list_name } = cmd;
    // ... (prompt construction logic is assumed to be here)

    // 2. Call AI Service (mocked)
    const mockApiResponse = {
        "items": [
            { "name": "Chicken Breast", "quantity": 2, "unit": "pcs", "category": "Meat & Fish" },
            { "name": "Garlic", "quantity": 3, "unit": "cloves", "category": "Vegetables" },
            { "name": "Pasta", "quantity": 500, "unit": "g", "category": "Pantry Staples" },
        ]
    };
    const aiResponse = mockApiResponse;

    // 3. Parse and validate AI response
    const validation = AiServiceResponseSchema.safeParse(aiResponse);
    if (!validation.success) {
        console.error("AI response validation failed:", validation.error);
        throw new Error("Failed to understand the response from the AI service.");
    }
    const { items: aiItems } = validation.data;

    // 4. Database Transaction
    try {
        // Fetch all categories to map names to IDs
        const { data: categories, error: catError } = await supabase.from('categories').select('id, name');
        if (catError) throw new Error("Could not fetch categories from the database.");

        const defaultCategory = categories.find(c => c.name === 'inne');
        if (!defaultCategory) throw new Error("Default category 'inne' not found.");

        // Create the new shopping list
        const { data: newList, error: listError } = await supabase
            .from('shopping_lists')
            .insert({ name: list_name, user_id: userId })
            .select()
            .single();

        if (listError) throw listError;

        // Prepare list items
        const itemsToInsert = aiItems.map(item => {
            const dbCategoryName = aiCategoryToDbCategory[item.category] || 'inne';
            const category = categories.find(c => c.name === dbCategoryName) || defaultCategory;
            
            return {
                list_id: newList.id,
                category_id: category.id,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                source: 'ai' as const,
            };
        });

        // Insert all items
        const { error: itemsError } = await supabase.from('list_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        // 5. Fetch and return the new list with its items
        const { data: finalList, error: finalError } = await supabase
            .from('shopping_lists')
            .select(`
                *,
                items:list_items(*)
            `)
            .eq('id', newList.id)
            .single();

        if (finalError) throw finalError;

        return finalList as ShoppingListWithItemsDto;

    } catch (error) {
        console.error("Database transaction failed during list generation:", error);
        throw new Error("Failed to save the generated list to the database.");
    }
  }
}

export const listService = new ListService();
