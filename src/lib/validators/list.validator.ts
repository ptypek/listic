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
