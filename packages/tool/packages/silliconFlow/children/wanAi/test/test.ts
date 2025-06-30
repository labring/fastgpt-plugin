import { tool, InputType } from '../src/index';

async function main() {
  // 构造测试参数
  const params: {
    url: string;
    authorization: string;
    model:
      | 'Wan-AI/Wan2.1-T2V-14B'
      | 'Wan-AI/Wan2.1-T2V-14B-Turbo'
      | 'Wan-AI/Wan2.1-I2V-14B-720P'
      | 'Wan-AI/Wan2.1-I2V-14B-720P-Turbo';
    prompt: string;
    image_size: '1280x720' | '960x960'; // 根据 InputType 要求补全所有可能值
    negative_prompt?: string;
    image?: string;
    seed?: number;
  } = {
    url: 'https://api.siliconflow.cn/v1/video',
    authorization: '<your_token>', // 请替换为有效的 token
    model: 'Wan-AI/Wan2.1-T2V-14B',
    prompt: '一只可爱的猫咪在花园里玩耍',
    image_size: '1280x720'
    // negative_prompt, seed, image 可选
  };

  try {
    // 校验参数
    InputType.parse(params);

    // 调用接口
    const result = await tool(params);
    console.log('生成结果:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('调用失败:', err);
  }
}

main();
