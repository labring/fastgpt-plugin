import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.entertainment,
  name: {
    'zh-CN': 'YouTube 字幕获取',
    en: 'YouTube Subtitle Extraction'
  },
  description: {
    'zh-CN': '获取 YouTube 视频的字幕内容,支持多种语言',
    en: 'Extract subtitle content from YouTube videos, supporting multiple languages'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'videoUrl',
          label: '视频链接',
          description: 'YouTube 视频链接或视频 ID',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription:
            'YouTube 视频链接 (例如: https://www.youtube.com/watch?v=VIDEO_ID) 或直接输入视频 ID'
        },
        {
          key: 'lang',
          label: '字幕语言',
          description: '不一定有对应字幕，不存在的话可能默认会返回英文。',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'zh-CN',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: '英语 (English)', value: 'en' },
            { label: '简体中文 (Simplified Chinese)', value: 'zh-CN' },
            { label: '繁体中文 (Traditional Chinese)', value: 'zh-TW' },
            { label: '日语 (Japanese)', value: 'ja' },
            { label: '韩语 (Korean)', value: 'ko' },
            { label: '西班牙语 (Spanish)', value: 'es' },
            { label: '法语 (French)', value: 'fr' },
            { label: '德语 (German)', value: 'de' },
            { label: '俄语 (Russian)', value: 'ru' },
            { label: '阿拉伯语 (Arabic)', value: 'ar' }
          ],
          toolDescription:
            '字幕语言代码,如 en (英语), zh-CN (简体中文), zh-TW (繁体中文), ja (日语), ko (韩语) 等'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'subtitle',
          label: '字幕内容',
          description: '提取的字幕文本内容'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'videoId',
          label: '视频 ID',
          description: 'YouTube 视频的唯一标识符'
        }
      ]
    }
  ]
});
