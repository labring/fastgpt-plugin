import { z } from 'zod';
import { Parser } from 'expr-eval';

export const InputType = z
  .object({
    数学表达式: z.string().optional(),
    expr: z.string().optional()
  })
  .refine(
    (data) => {
      return data.数学表达式 || data.expr;
    },
    {
      message: '必须传入 "数学表达式" 或 "expr" 中的一个'
    }
  )
  .transform((data) => ({
    expr: data.expr || data.数学表达式
  }));

export const OutputType = z.object({
  result: z.union([z.string(), z.number()])
});

const replaceSpecialChar = (expr: string) => {
  // replace ** to ^
  const result = expr.replace(/\*\*/g, '^');
  return result;
};

export async function tool({
  expr
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const parseExpr = expr;

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
