import { z } from 'zod';
import * as echarts from 'echarts';
import { uploadFile } from '@tool/utils/uploadFile';
import json5 from 'json5';

export const InputType = z
  .object({
    title: z.string().optional(),
    xAxis: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    yAxis: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
    chartType: z.string()
  })
  .transform((data) => {
    return {
      ...data,
      xAxis: (Array.isArray(data.xAxis) ? data.xAxis : (json5.parse(data.xAxis) as string[])).map(
        (item) => String(item)
      ),
      yAxis: (Array.isArray(data.yAxis) ? data.yAxis : (json5.parse(data.yAxis) as string[])).map(
        (item) => String(item)
      )
    };
  });

type SeriesData = {
  name: string;
  type: 'bar' | 'line' | 'pie'; // 只允许这三种类型
  data: number[] | { value: number; name: string }[]; // 根据图表类型的数据结构
};

type Option = {
  backgroundColor: string;
  title: { text: string };
  tooltip: object;
  xAxis: { data: string[] };
  yAxis: object;
  series: SeriesData[]; // 使用定义的类型
};
export const OutputType = z.object({
  '图表 url': z.string().optional(), // 兼容旧版
  chartUrl: z.string().optional()
});

const generateChart = async (title = '', xAxis: string[], yAxis: string[], chartType: string) => {
  const chart = echarts.init(undefined, undefined, {
    renderer: 'svg', // 必须使用 SVG 模式
    ssr: true, // 开启 SSR
    width: 400, // 需要指明高和宽
    height: 300
  });

  const option: Option = {
    backgroundColor: '#f5f5f5',
    title: { text: title },
    tooltip: {},
    xAxis: { data: xAxis },
    yAxis: {},
    series: [] // 初始化为空数组
  };

  // 根据 chartType 生成不同的图表
  switch (chartType) {
    case '柱状图':
      option.series.push({ name: 'Sample', type: 'bar', data: yAxis.map(Number) });
      break;
    case '折线图':
      option.series.push({ name: 'Sample', type: 'line', data: yAxis.map(Number) });
      break;
    case '饼图':
      option.series.push({
        name: 'Sample',
        type: 'pie',
        data: yAxis.map((value, index) => ({
          value: Number(value),
          name: xAxis[index] // 使用 xAxis 作为饼图的名称
        }))
      });
      break;
    default:
      console.error('不支持的图表类型:', chartType);
      return '';
  }

  chart.setOption(option);
  const svgContent = chart.renderToSVGString();

  const base64 = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

  const file = await uploadFile({
    base64,
    defaultFilename: `chart.svg`
  });

  return file.accessUrl;
};

export async function tool({
  title,
  xAxis,
  yAxis,
  chartType
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const base64 = await generateChart(title, xAxis, yAxis, chartType);
  return {
    '图表 url': base64, // 兼容旧版
    chartUrl: base64
  };
}
