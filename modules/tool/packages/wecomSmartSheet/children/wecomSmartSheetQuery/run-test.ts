import { tool } from './src/index';

async function test() {
  const accessToken =
    '-mL7ze7og33EBxj-PdNGFsMnBf5OCKsrtaSy6K3-wlgYcF8nu4sjQ_UEN2Y5MGjrljV4McNlaqBAsrpQFoeKzD12WJV1GDbNzba3wsRYtfgZZu9DAcD-xYdTOEw-wbPN-QPHyv4VG2-TfSjP6VVeoaF6SkdsLqi_W-PdjgeNWDbdkZNg_MFkUzY7LAxD_jctLzpndNSFP_3rcNDkFAUabA';
  const docid =
    'dcC9tIgWKn0HgfnGmktP_Wmpi2WslmXfV9-nHidL1JVQqp5B9hmVIB_HTGF_DL88Vo_wFm9SheqihADrkppJL9hw';

  console.log('正在查询智能表记录...');
  console.log('Doc ID:', docid);

  try {
    const result = await tool({
      accessToken: accessToken,
      docid: docid,
      limit_per_sheet: 1000
      // sheets: '["sheet1", "子表名称"]' // 可选：指定要查询的sheet ID或名称
    });

    console.log('--- 查询成功 ---');
    console.log('总记录数:', result.total_records);
    console.log('子表数量:', result.sheet_count);
    console.log('结果结构:', Object.keys(result.result));

    // 打印每个子表的概要信息
    if (result.result.sheets) {
      Object.entries(result.result.sheets).forEach(([sheetId, sheetData]: [string, any]) => {
        console.log(`\n子表 ${sheetId} (${sheetData.title}):`);
        console.log(`  记录数: ${sheetData.record_count}`);
        if (sheetData.records && sheetData.records.length > 0) {
          console.log(`  第一条记录: ${JSON.stringify(sheetData.records[0])}`);
        }
      });
    }
  } catch (error: any) {
    console.error('--- 查询失败 ---');
    console.error('错误信息:', error.message);
    console.error('完整错误:', error);
  }
}

test();
