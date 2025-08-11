import { z } from 'zod';
import * as echarts from 'echarts';
import { uploadFile } from '@tool/utils/uploadFile';
import json5 from 'json5';

export const InputType = z
  .object({
    title: z.string().optional(),
    chartType: z.string(),
    dataInput: z.string(), // 用户友好的数据输入
    categories: z.string().optional(), // 分类数据（逗号分隔）
    seriesNames: z.string().optional(), // 系列名称（逗号分隔）
    colorScheme: z.string().optional(), // 颜色方案
    chartSize: z.string().optional(), // 图表尺寸
    legendPosition: z.string().optional(), // 图例位置
    // 兼容旧版JSON输入
    chartData: z.string().optional(),
    customOptions: z.string().optional()
  })
  .transform((data) => {
    // 如果使用旧版JSON输入
    if (data.chartData) {
      return {
        ...data,
        chartData: json5.parse(data.chartData),
        customOptions: data.customOptions ? json5.parse(data.customOptions) : {}
      };
    }

    // 新版用户友好输入的转换逻辑将在后续函数中处理
    return data;
  });

export const OutputType = z.object({
  chartUrl: z.string(),
  echartsConfig: z.string()
});

// 颜色方案配置
const COLOR_SCHEMES = {
  blue: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
  green: ['#91cc75', '#5470c6', '#fac858', '#ee6666', '#73c0de'],
  warm: ['#ee6666', '#fac858', '#91cc75', '#5470c6', '#73c0de'],
  cool: ['#73c0de', '#5470c6', '#91cc75', '#fac858', '#ee6666'],
  purple: ['#9a60b4', '#ea7ccc', '#5470c6', '#91cc75', '#fac858']
};

// 图表尺寸配置
const CHART_SIZES = {
  small: { width: 400, height: 300 },
  medium: { width: 600, height: 450 },
  large: { width: 800, height: 600 }
};

// 用户友好输入转换为ECharts数据结构
const parseUserFriendlyInput = (
  dataInput: string,
  chartType: string,
  categories?: string,
  seriesNames?: string
): any => {
  const lines = dataInput
    .trim()
    .split('\n')
    .filter((line) => line.trim());

  switch (chartType) {
    case 'multiLine': {
      // 多系列折线图：每行是一个系列的数据
      // 格式: "系列名,值1,值2,值3" 或如果没有系列名则用seriesNames
      const categoriesArray = categories ? categories.split(',').map((c) => c.trim()) : [];
      const seriesData = lines.map((line, index) => {
        const parts = line.split(',').map((p) => p.trim());
        const hasSeriesName = isNaN(Number(parts[0]));

        if (hasSeriesName) {
          return {
            name: parts[0],
            data: parts.slice(1).map(Number)
          };
        } else {
          const seriesNamesArray = seriesNames ? seriesNames.split(',').map((s) => s.trim()) : [];
          return {
            name: seriesNamesArray[index] || `系列${index + 1}`,
            data: parts.map(Number)
          };
        }
      });

      return {
        categories:
          categoriesArray.length > 0
            ? categoriesArray
            : Array.from(
                { length: Math.max(...seriesData.map((s) => s.data.length)) },
                (_, i) => `类别${i + 1}`
              ),
        series: seriesData
      };
    }

    case 'stackedBar': {
      // 堆积柱状图：同多系列折线图
      const stackCategories = categories ? categories.split(',').map((c) => c.trim()) : [];
      const stackSeries = lines.map((line, index) => {
        const parts = line.split(',').map((p) => p.trim());
        const hasSeriesName = isNaN(Number(parts[0]));

        if (hasSeriesName) {
          return {
            name: parts[0],
            data: parts.slice(1).map(Number)
          };
        } else {
          const seriesNamesArray = seriesNames ? seriesNames.split(',').map((s) => s.trim()) : [];
          return {
            name: seriesNamesArray[index] || `系列${index + 1}`,
            data: parts.map(Number)
          };
        }
      });

      return {
        categories:
          stackCategories.length > 0
            ? stackCategories
            : Array.from(
                { length: Math.max(...stackSeries.map((s) => s.data.length)) },
                (_, i) => `类别${i + 1}`
              ),
        series: stackSeries
      };
    }

    case 'mixed': {
      // 混合图表：第一行柱状数据，第二行折线数据
      const mixedCategories = categories ? categories.split(',').map((c) => c.trim()) : [];
      const barData = lines[0] ? lines[0].split(',').map(Number) : [];
      const lineData = lines[1] ? lines[1].split(',').map(Number) : [];

      return {
        categories:
          mixedCategories.length > 0
            ? mixedCategories
            : Array.from(
                { length: Math.max(barData.length, lineData.length) },
                (_, i) => `类别${i + 1}`
              ),
        barData,
        lineData
      };
    }

    case 'pie':
    case 'funnel': {
      // 饼图/漏斗图：名称,数值 格式
      const pieData = lines.map((line) => {
        const [name, value] = line.split(',').map((p) => p.trim());
        return { name, value: Number(value) };
      });
      return { data: pieData };
    }

    case 'scatter': {
      // 散点图：x,y,size 格式
      const scatterData = lines.map((line) => {
        const parts = line.split(',').map(Number);
        return parts;
      });
      return { data: scatterData };
    }

    case 'gauge': {
      // 仪表盘：单个数值
      const gaugeValue = Number(lines[0].split(',')[0]);
      const gaugeName = lines[0].split(',')[1] || '指标';
      return { value: gaugeValue, name: gaugeName, min: 0, max: 100 };
    }

    case 'radar': {
      // 雷达图：指标名1,指标名2,指标名3 (第一行) 然后是数据行
      const indicators = lines[0].split(',').map((name) => ({ name: name.trim(), max: 100 }));
      const radarData = lines.slice(1).map((line, index) => {
        const parts = line.split(',');
        const hasName = isNaN(Number(parts[0]));
        if (hasName) {
          return {
            name: parts[0].trim(),
            value: parts.slice(1).map(Number)
          };
        } else {
          const seriesNamesArray = seriesNames ? seriesNames.split(',').map((s) => s.trim()) : [];
          return {
            name: seriesNamesArray[index] || `数据${index + 1}`,
            value: parts.map(Number)
          };
        }
      });

      return { indicators, data: radarData };
    }

    default:
      throw new Error(`暂不支持用户友好输入的图表类型: ${chartType}`);
  }
};

// 应用样式选项到option
const applyStyleOptions = (option: any, colorScheme?: string, legendPosition?: string): any => {
  // 应用颜色方案
  if (colorScheme && COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES]) {
    option.color = COLOR_SCHEMES[colorScheme as keyof typeof COLOR_SCHEMES];
  }

  // 应用图例位置
  if (legendPosition && option.legend) {
    switch (legendPosition) {
      case 'top':
        option.legend = { ...option.legend, orient: 'horizontal', top: 10, left: 'center' };
        break;
      case 'bottom':
        option.legend = { ...option.legend, orient: 'horizontal', bottom: 10, left: 'center' };
        break;
      case 'left':
        option.legend = { ...option.legend, orient: 'vertical', left: 10, top: 'middle' };
        break;
      case 'right':
        option.legend = { ...option.legend, orient: 'vertical', right: 10, top: 'middle' };
        break;
    }
  }

  return option;
};

// 复杂图表配置生成器
const generateComplexChartOption = (
  title: string = '',
  chartType: string,
  chartData: any,
  customOptions: any = {},
  colorScheme?: string,
  legendPosition?: string
): any => {
  let option: any = {
    backgroundColor: '#ffffff',
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(50,50,50,0.8)',
      borderColor: '#333',
      textStyle: {
        color: '#fff'
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 10
    }
  };

  switch (chartType) {
    case 'multiLine':
      option = {
        ...option,
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: chartData.categories || [],
          axisLabel: { rotate: 45 }
        },
        yAxis: { type: 'value' },
        series:
          chartData.series?.map((s: any) => ({
            name: s.name,
            type: 'line',
            data: s.data,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 3 }
          })) || []
      };
      break;

    case 'mixed':
      option = {
        ...option,
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: chartData.categories || []
        },
        yAxis: [
          { type: 'value', name: '数值1', position: 'left' },
          { type: 'value', name: '数值2', position: 'right' }
        ],
        series: [
          {
            name: '柱状数据',
            type: 'bar',
            yAxisIndex: 0,
            data: chartData.barData || [],
            itemStyle: { color: '#5470c6' }
          },
          {
            name: '折线数据',
            type: 'line',
            yAxisIndex: 1,
            data: chartData.lineData || [],
            smooth: true,
            lineStyle: { color: '#91cc75', width: 3 }
          }
        ]
      };
      break;

    case 'stackedBar':
      option = {
        ...option,
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: chartData.categories || []
        },
        yAxis: { type: 'value' },
        series:
          chartData.series?.map((s: any) => ({
            name: s.name,
            type: 'bar',
            stack: 'total',
            data: s.data,
            emphasis: { focus: 'series' }
          })) || []
      };
      break;

    case 'radar':
      option = {
        ...option,
        radar: {
          indicator: chartData.indicators || [],
          shape: 'polygon',
          splitNumber: 5,
          axisName: { color: '#333' }
        },
        series: [
          {
            type: 'radar',
            data:
              chartData.data?.map((item: any) => ({
                value: item.value,
                name: item.name,
                areaStyle: { opacity: 0.3 }
              })) || []
          }
        ]
      };
      break;

    case 'scatter':
      option = {
        ...option,
        xAxis: { type: 'value', name: chartData.xAxisName || 'X轴' },
        yAxis: { type: 'value', name: chartData.yAxisName || 'Y轴' },
        series: [
          {
            type: 'scatter',
            data: chartData.data || [],
            symbolSize: (data: number[]) => Math.sqrt(data[2] || 20) * 2,
            itemStyle: {
              opacity: 0.7,
              color: (params: any) => {
                const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666'];
                return colors[params.dataIndex % colors.length];
              }
            }
          }
        ]
      };
      break;

    case 'funnel':
      option = {
        ...option,
        series: [
          {
            type: 'funnel',
            left: '10%',
            width: '80%',
            label: { show: true, position: 'inside' },
            labelLine: { show: false },
            itemStyle: { borderColor: '#fff', borderWidth: 1 },
            data: chartData.data || []
          }
        ]
      };
      break;

    case 'gauge':
      option = {
        ...option,
        series: [
          {
            type: 'gauge',
            center: ['50%', '60%'],
            startAngle: 200,
            endAngle: -40,
            min: chartData.min || 0,
            max: chartData.max || 100,
            splitNumber: 10,
            itemStyle: { color: '#58D9F9' },
            progress: { show: true, width: 8 },
            pointer: { length: '60%', width: 6 },
            detail: {
              valueAnimation: true,
              formatter: '{value}%'
            },
            data: [{ value: chartData.value || 50, name: chartData.name || '指标' }]
          }
        ]
      };
      break;

    case 'heatmap':
      option = {
        ...option,
        tooltip: {
          position: 'top',
          formatter: (params: any) => {
            return `${chartData.yAxis[params.data[1]]}: ${chartData.xAxis[params.data[0]]}<br/>数值: ${params.data[2]}`;
          }
        },
        grid: { height: '50%', top: '10%' },
        xAxis: {
          type: 'category',
          data: chartData.xAxis || [],
          splitArea: { show: true }
        },
        yAxis: {
          type: 'category',
          data: chartData.yAxis || [],
          splitArea: { show: true }
        },
        visualMap: {
          min: chartData.min || 0,
          max: chartData.max || 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '15%'
        },
        series: [
          {
            type: 'heatmap',
            data: chartData.data || [],
            label: { show: true },
            emphasis: {
              itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
            }
          }
        ]
      };
      break;

    case 'sankey':
      option = {
        ...option,
        series: [
          {
            type: 'sankey',
            layout: 'none',
            emphasis: { focus: 'adjacency' },
            data: chartData.nodes || [],
            links: chartData.links || [],
            itemStyle: { borderWidth: 1, borderColor: '#aaa' },
            lineStyle: { color: 'gradient', curveness: 0.5 }
          }
        ]
      };
      break;

    case 'tree':
      option = {
        ...option,
        series: [
          {
            type: 'tree',
            data: [chartData.data || {}],
            left: '2%',
            right: '2%',
            top: '8%',
            bottom: '20%',
            symbol: 'emptyCircle',
            orient: 'vertical',
            expandAndCollapse: true,
            label: {
              position: 'top',
              rotate: 0,
              verticalAlign: 'middle',
              align: 'center',
              fontSize: 12
            },
            leaves: {
              label: {
                position: 'bottom',
                rotate: 0,
                verticalAlign: 'middle',
                align: 'center'
              }
            }
          }
        ]
      };
      break;

    default:
      throw new Error(`不支持的图表类型: ${chartType}`);
  }

  // 应用自定义配置覆盖
  const mergeDeep = (target: any, source: any) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  };

  if (Object.keys(customOptions).length > 0) {
    mergeDeep(option, customOptions);
  }

  // 应用样式选项
  option = applyStyleOptions(option, colorScheme, legendPosition);

  return option;
};

const generateComplexChart = async (
  title: string = '',
  chartType: string,
  chartData: any,
  customOptions: any = {},
  chartSize?: string,
  colorScheme?: string,
  legendPosition?: string
) => {
  // 根据尺寸选项确定图表尺寸
  const size =
    chartSize && CHART_SIZES[chartSize as keyof typeof CHART_SIZES]
      ? CHART_SIZES[chartSize as keyof typeof CHART_SIZES]
      : CHART_SIZES.large;

  const chart = echarts.init(undefined, undefined, {
    renderer: 'svg',
    ssr: true,
    width: size.width,
    height: size.height
  });

  const option = generateComplexChartOption(
    title,
    chartType,
    chartData,
    customOptions,
    colorScheme,
    legendPosition
  );

  chart.setOption(option);
  const svgContent = chart.renderToSVGString();

  const base64 = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

  const file = await uploadFile({
    base64,
    defaultFilename: `complex-chart-${chartType}.svg`
  });

  chart.dispose();

  return {
    url: file.accessUrl,
    config: JSON.stringify(option, null, 2)
  };
};

export async function tool({
  title,
  chartType,
  dataInput,
  categories,
  seriesNames,
  colorScheme,
  chartSize,
  legendPosition,
  chartData,
  customOptions
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    let processedChartData: any;

    // 如果使用旧版JSON输入
    if (chartData) {
      processedChartData = chartData;
    } else {
      // 使用新版用户友好输入
      processedChartData = parseUserFriendlyInput(dataInput, chartType, categories, seriesNames);
    }

    const result = await generateComplexChart(
      title,
      chartType,
      processedChartData,
      customOptions || {},
      chartSize,
      colorScheme,
      legendPosition
    );

    return {
      chartUrl: result.url,
      echartsConfig: result.config
    };
  } catch (error) {
    throw new Error(`生成复杂图表失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
