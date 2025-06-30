import { tool, InputType } from '../src/index';

async function main() {
  // 构造测试参数
  const params = {
    url: 'https://api.siliconflow.cn/v1/images/generations',
    authorization: '<your_token>', // 请替换为有效的 token
    prompt: '一只可爱的猫咪插画',
    image_size: '1024x1024',
    batch_size: 1,
    num_inference_steps: 20,
    guidance_scale: 7.5
    // negative_prompt, seed, image 可选
  };

  try {
    // 校验参数
    InputType.parse(params);

    // 调用接口
    const result = await tool(params as any);
    console.log('生成结果:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('调用失败:', err);
  }
}

main();
