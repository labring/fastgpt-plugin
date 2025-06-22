import { z } from 'zod';
import { Parser } from 'expr-eval';

export const InputType = z.object({
  数学表达式: z.string().optional(),
  expr: z.string().optional()
});

export const OutputType = z.object({
  result: z.string()
});

const replaceSpecialChar = (expr: string) => {
  // replace ** to ^
  const result = expr.replace(/\*\*/g, '^');
  return result;
};

export async function tool({
  数学表达式: formatExpr,
  expr
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const parseExpr = formatExpr || expr;

  if (typeof parseExpr !== 'string') {
    return Promise.reject('Expr is not a string');
  }

  try {
    const parser = new Parser();
    const exprParser = parser.parse(replaceSpecialChar(parseExpr));

    return {
      result: exprParser.evaluate()
    };
  } catch (error) {
    return {
      result: `${parseExpr} is not a valid math expression. Error: ${error}`
    };
  }
}
