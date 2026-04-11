import z from 'zod';

export const BoolStringSchema = z
  .string()
  .transform((val) => val === 'true')
  .pipe(z.boolean());

export const PositiveIntSchema = z.coerce.number<number>().int().positive();
