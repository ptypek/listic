import { z } from 'zod';

export const CreateListSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
});

export type CreateListPayload = z.infer<typeof CreateListSchema>;

export const generateListFromRecipesSchema = z.object({
	list_name: z.string().min(1, { message: 'List name is required' }),
	recipes: z.array(z.string()).min(1, { message: 'At least one recipe is required' }),
});

export type GenerateListFromRecipesPayload = z.infer<typeof generateListFromRecipesSchema>;

export const AiGeneratedItemSchema = z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
    category: z.string(),
});

export const AiServiceResponseSchema = z.object({
    items: z.array(AiGeneratedItemSchema),
});

export const GetListsQueryDto = z.object({
  sort: z.enum(["created_at", "name", "updated_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const uuidValidator = z.object({
  uuId: z.string().uuid(),
});

export const idListValidator = z.object({
  listId: z.string().uuid(),
});

export const UpdateListValidator = z.object({
  name: z.string().min(1, { message: "Nazwa listy nie może być pusta." }),
});

export const addListItemSchema = z.object({
  list_id: z.string().uuid(),
  category_id: z.number(),
  name: z.string().min(1, { message: "Nazwa produktu nie może być pusta." }),
  quantity: z.number().optional().default(1),
  unit: z.string().optional().default("szt"),
});

export const updateListItemSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  is_checked: z.boolean().optional(),
});
