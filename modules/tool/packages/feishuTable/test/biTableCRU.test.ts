/**
 * 飞书多维表格 CRU 测试
 * 测试 BiTable 的创建、获取、更新操作
 * 注意: 飞书不支持删除多维表格,需手动清理测试数据
 */

import { describe, expect, it } from 'vitest';
import { tool as biTableCreate } from '../children/biTableCreate/src';
import { tool as biTableGet } from '../children/biTableGet/src';
import { tool as biTableUpdate } from '../children/biTableUpdate/src';
import { testConfig } from './constants';
console.log(testConfig, 11111);
describe('BiTable CRU 测试', () => {
  let createdBiTableId: string;

  /**
   * 测试 1: 创建多维表格
   */
  it('1. 创建多维表格 (biTableCreate)', async () => {
    console.log('\n=== 测试 1: 创建多维表格 ===');

    const result = await biTableCreate({
      ...testConfig,
      name: `测试表格_${Date.now()}`,
      folderToken: testConfig.folderToken
    });

    console.log('创建结果:', result);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('url');

    // 保存 ID 供后续测试使用
    createdBiTableId = result.id;
    console.log(`✓ 创建成功，BiTable ID: ${createdBiTableId}`);
    console.log(`✓ 访问链接: ${result.url}`);
  }, 30000);

  /**
   * 测试 2: 获取多维表格信息
   */
  it('2. 获取多维表格信息 (biTableGet)', async () => {
    console.log('\n=== 测试 2: 获取多维表格信息 ===');

    const result = await biTableGet({
      ...testConfig,
      biTableId: createdBiTableId
    });

    console.log('获取结果:', result);

    expect(result).toHaveProperty('name');
    expect(result.name).toContain('测试表格_');
    console.log(`✓ 获取成功，名称: ${result.name}`);
  }, 30000);

  /**
   * 测试 3: 更新多维表格名称
   */
  it('3. 更新多维表格名称 (biTableUpdate)', async () => {
    console.log('\n=== 测试 3: 更新多维表格名称 ===');

    const newName = `更新后的表格_${Date.now()}`;
    const result = await biTableUpdate({
      ...testConfig,
      biTableId: createdBiTableId,
      name: newName
    });

    console.log('更新结果:', result);

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
    console.log(`✓ 更新成功，新名称: ${newName}`);

    // 验证更新是否生效
    const getResult = await biTableGet({
      ...testConfig,
      biTableId: createdBiTableId
    });
    expect(getResult.name).toBe(newName);
    console.log(`✓ 验证成功，当前名称: ${getResult.name}`);
  }, 30000);
});
