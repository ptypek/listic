import { z } from 'zod';

export const AiFeedbackValidator = z.object({
  list_item_id: z.string().uuid({ message: "Identyfikator produktu jest nieprawidłowy." }),
});
