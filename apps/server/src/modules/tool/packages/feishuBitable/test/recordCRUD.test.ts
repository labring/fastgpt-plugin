/**
 * 飞书记录 CRUD 测试
 * 测试 Record 的创建、获取、更新、删除和列表查询操作
 */

import { describe, expect, it } from 'vitest';
import { tool as recordCreate } from '../children/recordCreate/src';
import { tool as recordGet } from '../children/recordGet/src';
import { tool as recordList } from '../children/recordList/src';
import { tool as recordUpdate } from '../children/recordUpdate/src';
import { tool as recordDelete } from '../children/recordDelete/src';
import { testConfig } from './constants';

// 测试配置

describe('Record CRUD 测试', () => {
  let createdRecordId: string;

  /**
   * 测试 1: 创建记录
   */
  it('1. 创建记录 (recordCreate)', async () => {
    console.log('\n=== 测试 1: 创建记录 ===');

    // 注意: fields 的字段名需要根据实际数据表的字段来设置
    // 这里使用飞书默认字段 "文本" 作为示例
    const fields = JSON.stringify({
      文本: `测试记录_${Date.now()}`
    });

    const result = await recordCreate({
      ...testConfig,
      fields
    });

    console.log('创建结果:', result);

    expect(result).toHaveProperty('recordId');

    // 保存 ID 供后续测试使用
    createdRecordId = result.recordId;
  }, 30000);

  /**
   * 测试 2: 获取单个记录
   */
  it('2. 获取单个记录 (recordGet)', async () => {
    console.log('\n=== 测试 2: 获取单个记录 ===');

    const result = await recordGet({
      ...testConfig,
      recordId: createdRecordId
    });

    console.log('获取结果:', result);

    expect(result).toHaveProperty('recordId');
    expect(result.recordId).toBe(createdRecordId);
    expect(result).toHaveProperty('fields');

    console.log(`✓ 获取成功，Record ID: ${result.recordId}`);
    console.log(`✓ 字段数据:`, result.fields);
  }, 30000);

  /**
   * 测试 3: 批量获取记录列表
   */
  it('3. 批量获取记录列表 (recordList)', async () => {
    console.log('\n=== 测试 3: 批量获取记录列表 ===');

    const result = await recordList({
      ...testConfig,
      pageSize: 20
    });

    console.log('获取结果:', result);

    expect(result).toHaveProperty('records');
    expect(Array.isArray(result.records)).toBe(true);
    expect(result.records.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('hasMore');

    console.log(`✓ 获取成功，共 ${result.records.length} 条记录`);
    console.log('记录列表:');
    result.records.forEach((record: any, index: number) => {
      console.log(`  ${index + 1}. Record ID: ${record.recordId}`);
      console.log(`     字段:`, record.fields);
    });
  }, 30000);

  /**
   * 测试 4: 更新记录
   */
  it('4. 更新记录 (recordUpdate)', async () => {
    console.log('\n=== 测试 4: 更新记录 ===');

    // 更新字段数据
    const fields = JSON.stringify({
      文本: `更新后的记录_${Date.now()}`
    });

    const result = await recordUpdate({
      ...testConfig,
      recordId: createdRecordId,
      fields
    });

    console.log('更新结果:', result);

    expect(result.success).toBe(true);

    // 验证更新是否生效
    const getResult = await recordGet({
      ...testConfig,
      recordId: createdRecordId
    });
    console.log(`✓ 验证成功，当前字段数据:`, getResult.fields);
  }, 30000);

  /**
   * 测试 5: 删除记录
   */
  it('5. 删除记录 (recordDelete)', async () => {
    console.log('\n=== 测试 5: 删除记录 ===');

    const result = await recordDelete({
      ...testConfig,
      recordId: createdRecordId
    });

    console.log('删除结果:', result);

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);

    console.log(`✓ 删除成功，Record ID: ${createdRecordId}`);
  }, 30000);
});
