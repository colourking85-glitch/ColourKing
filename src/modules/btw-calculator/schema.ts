import { z } from 'zod';

export const calculatorInputSchema = z.object({
  amount: z.number().int(),
  inputType: z.enum(['incl', 'excl']),
});

export type CalculatorInput = z.infer<typeof calculatorInputSchema>;
