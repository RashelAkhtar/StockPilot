import { z } from "zod";

export const productSchema = z.object({
  productName: z.string().trim().min(1, "Product name required"),
  buyingPrice: z.union([z.number(), z.string()]),
  productQty: z.union([z.number(), z.string()]),
});
