import { z } from "zod";
import { type SupabaseClient } from "../db/supabase.client";
import { AiServiceResponseSchema, type CreateListPayload, GetListsQueryDto } from "../lib/validators/list.validator";
import type { GenerateListFromRecipesCommand, ShoppingListWithItemsDto, UpdateShoppingListCommand } from "../types";

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

  async getListById(supabase: SupabaseClient, listId: string, userId: string): Promise<ShoppingListWithItemsDto | null> {
    const { data, error } = await supabase
      .from("shopping_lists")
      .select(`
        *,
        items:list_items(*)
      `)
      .eq("id", listId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching list from Supabase:", error);
      throw new Error("Failed to fetch list from the database.");
    }

    return data;
  }

  async updateList(supabase: SupabaseClient, listId: string, data: UpdateShoppingListCommand, userId: string) {
    const { data: updatedList, error } = await supabase
      .from('shopping_lists')
      .update(data)
      .eq('id', listId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating list in Supabase:', error);
      // Don't throw for PGRST116 (Not Found), as we handle it as a null return
      if (error.code !== 'PGRST116') {
        throw new Error("Failed to update list in the database.");
      }
    }

    return updatedList;
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

  async deleteList(supabase: SupabaseClient, listId: string, userId: string): Promise<void> {
    // First, verify the list exists and belongs to the user.
    const { data, error: fetchError } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching list for deletion:', fetchError);
      throw new Error('A database error occurred while trying to verify the list.');
    }

    // If data is null, it means no record was found (or fetchError.code was 'PGRST116')
    if (!data) {
      throw new Error('Not Found');
    }

    // If verification is successful, proceed with deletion.
    const { error: deleteError } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId);

    if (deleteError) {
      console.error('Error deleting list from Supabase:', deleteError);
      throw new Error('Failed to delete the list from the database.');
    }
  }
}

export const listService = new ListService();
