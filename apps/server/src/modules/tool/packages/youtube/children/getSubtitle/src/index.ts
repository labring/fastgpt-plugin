import { z } from 'zod';
import { getSubtitles } from 'youtube-caption-extractor';
import { getErrText } from '@tool/utils/err';

export const InputType = z.object({
  videoUrl: z.string(),
  lang: z.string().optional().default('zh-CN')
});

export const OutputType = z.object({
  subtitle: z.string(),
  videoId: z.string()
});

/**
 * 从 YouTube URL 中提取视频 ID
 */
function extractVideoId(input: string): string {
  // 如果已经是视频 ID (11个字符)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // 处理各种 YouTube URL 格式
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  throw new Error('无法从输入中提取视频 ID。请提供有效的 YouTube 链接或视频 ID。');
}

/**
 * 格式化字幕内容
 */
function formatSubtitles(subtitles: any[]): string {
  return subtitles
    .map((item) => {
      // 移除 HTML 标签
      const text = item.text.replace(/<[^>]*>/g, '');
      return text.trim();
    })
    .filter((text) => text.length > 0)
    .join('\n');
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { videoUrl, lang } = props;

  // 提取视频 ID
  const videoId = extractVideoId(videoUrl);

  // 获取字幕
  const subtitles = await (async () => {
    try {
      return await getSubtitles({ videoID: videoId, lang });
    } catch (error) {
      return Promise.reject(
        `无法获取 ${lang} 语言的字幕。该视频可能没有该语言的字幕,或者字幕不可用。错误: ${getErrText(error)}`
      );
    }
  })();

  // 格式化字幕内容
  const subtitle = formatSubtitles(subtitles);

  if (!subtitle) {
    return Promise.reject('字幕内容为空');
  }

  return {
    subtitle,
    videoId
  };
}
