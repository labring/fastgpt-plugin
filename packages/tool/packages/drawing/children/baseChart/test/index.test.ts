import { expect, test, vi } from 'vitest';
import { tool } from '../src';

test('baseChart', async () => {
  const res = await tool({
    title: '测试',
    xAxis: ['1', '2', '3'],
    yAxis: ['1', '2', '3'],
    chartType: '柱状图'
  });
  console.log(res);
});
