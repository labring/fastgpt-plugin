/**
 * 飞书数据表 CRUD 测试
 * 测试 DataTable 的创建、获取、更新、删除操作和字段获取
 */
import { describe, expect, it } from 'vitest';
import { tool as dataTableCreate } from '../children/dataTableCreate/src';
import { tool as dataTableGetTables } from '../children/dataTableGetTables/src';
import { tool as dataTableGetTableFields } from '../children/dataTableGetTableFields/src';
import { tool as dataTableUpdate } from '../children/dataTableUpdate/src';
import { tool as dataTableDelete } from '../children/dataTableDelete/src';
import { testConfig } from './constants';

describe('DataTable CRUD 测试', () => {
  let createdDataTableId: string;

  /**
   * 测试 1: 创建数据表
   */
  it('1. 创建数据表 (dataTableCreate)', async () => {
    console.log('\n=== 测试 1: 创建数据表 ===');

    const result = await dataTableCreate({
      ...testConfig,
      tableName: `测试表_${Date.now()}`
    });

    console.log('创建结果:', result);

    expect(result).toHaveProperty('dataTableId');

    // 保存 ID 供后续测试使用
    createdDataTableId = result.dataTableId;
    console.log(`✓ 创建成功，DataTable ID: ${createdDataTableId}`);
  }, 30000);

  /**
   * 测试 2: 获取数据表列表
   */
  it('2. 获取数据表列表 (dataTableGetTables)', async () => {
    console.log('\n=== 测试 2: 获取数据表列表 ===');

    const result = await dataTableGetTables({
      ...testConfig
    });

    console.log('获取结果:', result);

    expect(result).toHaveProperty('tables');
    expect(Array.isArray(result.tables)).toBe(true);
    expect(result.tables.length).toBeGreaterThan(0);

    console.log(`✓ 获取成功，共 ${result.tables.length} 个数据表`);
    console.log('数据表列表:');
    result.tables.forEach((table: any, index: number) => {
      console.log(`  ${index + 1}. ${table.name} (${table.dataTableId})`);
    });
  }, 30000);

  /**
   * 测试 3: 获取数据表字段配置
   */
  it('3. 获取数据表字段配置 (dataTableGetTableFields)', async () => {
    console.log('\n=== 测试 3: 获取数据表字段配置 ===');

    const result = await dataTableGetTableFields({
      ...testConfig,
      dataTableId: createdDataTableId
    });

    console.log('获取结果:', result);

    expect(result).toHaveProperty('fields');
    expect(Array.isArray(result.fields)).toBe(true);

    console.log(`✓ 获取成功，共 ${result.fields.length} 个字段`);
    console.log('字段列表:');
    result.fields.forEach((field: any, index: number) => {
      console.log(`  ${index + 1}. ${field.fieldName} (ID: ${field.fieldId}, 类型: ${field.type})`);
    });
  }, 30000);

  /**
   * 测试 4: 更新数据表名称
   * 注意: 飞书 API 可能不支持更新 DataTable 名称，此测试可能失败
   */
  it('4. 更新数据表名称 (dataTableUpdate)', async () => {
    console.log('\n=== 测试 4: 更新数据表名称 ===');

    // 等待 1 秒，确保飞书 API 处理完成创建操作
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newName = `更新后的表_${Date.now()}`;

    try {
      const result = await dataTableUpdate({
        ...testConfig,
        dataTableId: createdDataTableId,
        name: newName
      });

      console.log('更新结果:', result);

      expect(result.success).toBe(true);

      console.log(`✓ 更新成功，新名称: ${newName}`);
    } catch (error) {
      console.error('更新失败:', error);
      console.log(`使用的 dataTableId: ${createdDataTableId}`);
      console.log(`使用的 biTableId: ${testConfig.biTableId}`);
      throw error;
    }
  }, 30000);

  /**
   * 测试 5: 删除数据表
   */
  it('5. 删除数据表 (dataTableDelete)', async () => {
    console.log('\n=== 测试 5: 删除数据表 ===');

    const result = await dataTableDelete({
      ...testConfig,
      dataTableId: createdDataTableId
    });

    console.log('删除结果:', result);

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);

    console.log(`✓ 删除成功，DataTable ID: ${createdDataTableId}`);
  }, 30000);
});
