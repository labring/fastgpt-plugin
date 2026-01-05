import { tool } from './src/index';

async function test() {
  const accessToken =
    'Vp-hjFOrpceVFWiJl18N5xkvJmgyoSZtohmqoZpZMS12dhxix8c4R3XN4Ye6G0RAYEpLULrbZ63Zez6hj8Ahv_HrcVn8TAuEC8_5c_N4Pv5ePwN4PHsqTryevASMIZSxCNwezi_7JQLn1W_HnNIobd4j6_gDNOwfmKO5gmvLLIoqmws4ZgfLqoc5HoDFar4QsINf2K6YrEDGJ6CAqhuJNQ';

  console.log('正在创建智能表...');

  try {
    const result = await tool({
      accessToken: accessToken,
      doc_name: '我的智能表_' + new Date().getTime()
    });

    console.log('--- 创建成功 ---');
    console.log('Doc ID:', result.docid);
    console.log('URL:', result.url);
    console.log('Full Result:', JSON.stringify(result.result, null, 2));
  } catch (error: any) {
    console.error('--- 创建失败 ---');
    console.error(error.message);
  }
}

test();
