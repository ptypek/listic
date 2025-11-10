import { z } from "zod";
import { type SupabaseClient } from "../db/supabase.client";
import { AiServiceResponseSchema, type CreateListPayload, GetListsQueryDto, type addListItemSchema } from "../lib/validators/list.validator";
import type { AddListItemCommand, GenerateListFromRecipesCommand, ListItemDto, ShoppingListWithItemsDto, UpdateListItemCommand, UpdateShoppingListCommand } from "../types";

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

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

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

  async getLists(supabase: SupabaseClient, query: z.infer<typeof GetListsQueryDto>, userId?: string) {
    const { sort, order } = query;

    let queryBuilder = supabase
      .from("shopping_lists")
      .select("*")
      .order(sort, { ascending: order === "asc" });

    if (userId) {
      queryBuilder = queryBuilder.eq("user_id", userId);
    }

    const { data, error } = await queryBuilder;

    return { data, error };
  }

  async getLastList(supabase: SupabaseClient, userId: string): Promise<ShoppingListWithItemsDto | null> {
    const { data, error } = await supabase
      .from("shopping_lists")
      .select(
        `
        *,
        items:list_items(*)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching last list from Supabase:", error);
      throw new Error("Failed to fetch last list from the database.");
    }

    return data;
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
            { "name": "Milk", "quantity": 1, "unit": "l", "category": "Dairy & Eggs" },
            { "name": "Eggs", "quantity": 12, "unit": "pcs", "category": "Dairy & Eggs" },
            { "name": "Tomatoes", "quantity": 4, "unit": "pcs", "category": "Vegetables" },
            { "name": "Onion", "quantity": 1, "unit": "pcs", "category": "Vegetables" },
            { "name": "Garlic", "quantity": 3, "unit": "cloves", "category": "Vegetables" },
            { "name": "Chicken Breast", "quantity": 2, "unit": "pcs", "category": "Meat" },
            { "name": "Pasta", "quantity": 500, "unit": "g", "category": "Pantry Staples" },
            { "name": "Olive Oil", "quantity": 1, "unit": "bottle", "category": "Pantry Staples" },
            { "name": "Apples", "quantity": 5, "unit": "pcs", "category": "Fruits" },
            { "name": "Salmon", "quantity": 1, "unit": "fillet", "category": "Fish" },
            { "name": "Salt", "quantity": 1, "unit": "pinch", "category": "Spices & Herbs" },
            { "name": "Pepper", "quantity": 1, "unit": "pinch", "category": "Spices & Herbs" },
            { "name": "Chocolate", "quantity": 1, "unit": "bar", "category": "Other" },
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

  async addMockData(supabase: SupabaseClient, userId: string): Promise<void> {
    const lastList = await this.getLastList(supabase, userId);

    if (!lastList) {
      throw new NotFoundError("No list found for the user.");
    }

    const { data: categories, error: catError } = await supabase.from('categories').select('id, name');
    if (catError) throw new Error("Could not fetch categories from the database.");

    const mockData = [
      { name: "Apples", quantity: 1, unit: "kg", category: "owoce" },
      { name: "Oranges", quantity: 2, unit: "kg", category: "owoce" },
      { name: "Bananas", quantity: 3, unit: "kg", category: "owoce" },
    ];

    const itemsToInsert = mockData.map(item => {
      const category = categories.find(c => c.name === item.category);
      if (!category) {
        throw new Error(`Category '${item.category}' not found.`);
      }
      return {
        list_id: lastList.id,
        category_id: category.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        source: 'manual' as const,
      };
    });

    const { error: itemsError } = await supabase.from('list_items').insert(itemsToInsert);
    if (itemsError) {
      console.error("Error inserting mock data:", itemsError);
      throw new Error("Failed to insert mock data.");
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
      throw new NotFoundError('List not found');
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

  async addListItem(supabase: SupabaseClient, command: AddListItemCommand, userId: string): Promise<ListItemDto> {
    const { list_id, category_id, name, quantity, unit } = command;

    // 1. Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      throw new NotFoundError('Category not found');
    }

    // 2. Verify list exists and belongs to the user
    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('id', list_id)
      .eq('user_id', userId)
      .single();

    if (listError || !list) {
      throw new NotFoundError('Shopping list not found');
    }

    // 3. Insert the new item
    const { data: newItem, error: insertError } = await supabase
      .from('list_items')
      .insert({
        list_id,
        category_id,
        name,
        quantity,
        unit,
        source: 'manual',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting list item:', insertError);
      throw new Error('Failed to add item to the list.');
    }

    return newItem;
  }

  async updateListItem(supabase: SupabaseClient, itemId: string, data: UpdateListItemCommand, userId: string): Promise<ListItemDto> {
    // RLS ensures the user can only update items on their own lists.
    // The `userId` parameter is implicitly used by RLS policy via `auth.uid()`.
    const { data: updatedItem, error } = await supabase
      .from('list_items')
      .update(data)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating list item:', error);
      // PGRST116: No rows found. This means either the item doesn't exist
      // or the user does not have permission (due to RLS).
      if (error.code === 'PGRST116') {
        throw new NotFoundError('List item not found');
      }
      throw new Error('Failed to update list item.');
    }

    return updatedItem;
  }

  async deleteListItem(supabase: SupabaseClient, itemId: string, userId: string): Promise<void> {
    // 1. Verify ownership before deleting
    const { data: item, error: selectError } = await supabase
      .from("list_items")
      .select(`
        id,
        shopping_lists ( user_id )
      `)
      .eq("id", itemId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error("Error verifying item ownership:", selectError);
      throw new Error("A database error occurred while verifying the item.");
    }

    // @ts-ignore
    if (!item || item.shopping_lists.user_id !== userId) {
      throw new NotFoundError("List item not found or access denied");
    }

    // 2. Delete the item
    const { error: deleteError } = await supabase
      .from("list_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      console.error("Error deleting list item:", deleteError);
      throw new Error("Failed to delete the list item.");
    }
  }
}

export const listService = new ListService();
