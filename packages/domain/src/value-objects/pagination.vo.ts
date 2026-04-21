import z from 'zod';

export const PaginationSchema = z.object({
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().default(10)
});

export const PaginationOutputSchema = z.object({
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative()
});

export type PaginationInputType = z.infer<typeof PaginationSchema>;
export type PaginationOutputType = z.infer<typeof PaginationOutputSchema>;
