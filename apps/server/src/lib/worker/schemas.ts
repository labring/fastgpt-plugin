import z from 'zod';

export const WorkerEnum = z.enum(['html2md', 'cherrio2md']);
export type WorkerEnumType = z.infer<typeof WorkerEnum>;

/**
 * HTML 转 Markdown Worker 参数
 */
export const Html2MdParamsSchema = z.object({
  html: z.string()
});
export type Html2MdParams = z.infer<typeof Html2MdParamsSchema>;

/**
 * HTML 转 Markdown Worker 返回值
 */
export const Html2MdResultSchema = z.string();
export type Html2MdResult = z.infer<typeof Html2MdResultSchema>;

/**
 * Cheerio 转 Markdown Worker 参数
 */
export const Cherrio2MdParamsSchema = z.object({
  fetchUrl: z.string(),
  // Cheerio 实例无法序列化，需要传递 HTML 字符串
  html: z.string(),
  selector: z.string().optional().default('body')
});
export type Cherrio2MdParams = z.input<typeof Cherrio2MdParamsSchema>;

/**
 * Cheerio 转 Markdown Worker 返回值
 */
export const Cherrio2MdResultSchema = z.object({
  markdown: z.string(),
  title: z.string(),
  usedSelector: z.string()
});
export type Cherrio2MdResult = z.infer<typeof Cherrio2MdResultSchema>;

/**
 * Worker 输入参数类型映射
 */
export type WorkerParamsMap = {
  html2md: Html2MdParams;
  cherrio2md: Cherrio2MdParams;
};

/**
 * Worker 返回值类型映射
 */
export type WorkerResultMap = {
  html2md: Html2MdResult;
  cherrio2md: Cherrio2MdResult;
};
