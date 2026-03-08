import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.union([z.number(), z.string()]),
  sellingPrice: z.union([z.string(), z.number()]),
  quantity: z.union([z.string(), z.number()]),
});

export const salesSchema = z
  .object({
    customersName: z.string().trim().optional(),
    customersPhone: z.string().trim().optional(),
    amountPaid: z.union([z.string(), z.number()]).optional(),
    items: z.array(cartItemSchema).min(1, "At least one item required").optional(),
    productId: z.union([z.number(), z.string()]).optional(),
    sellingPrice: z.union([z.string(), z.number()]).optional(),
    quantity: z.union([z.string(), z.number()]).optional(),
  })
  .refine(
    (data) => {
      const hasItems = Array.isArray(data.items) && data.items.length > 0;
      const hasSingleItem =
        data.productId !== undefined &&
        data.sellingPrice !== undefined &&
        data.quantity !== undefined;

      return hasItems || hasSingleItem;
    },
    {
      message: "Provide either items[] or productId, sellingPrice, and quantity",
      path: ["items"],
    },
  );
