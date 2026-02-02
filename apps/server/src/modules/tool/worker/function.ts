import { runWorker } from './utils';
import type {
  Props as StreamToMarkdownProps,
  Response as StreamToMarkdownResponse
} from './streamToMarkdown';

export const htmlToMarkdown = async (html: string) => {
  return await runWorker('htmlToMarkdown', { html });
};
export const streamToMarkdown = async (props: StreamToMarkdownProps) => {
  return await runWorker<StreamToMarkdownResponse>('streamToMarkdown', props);
};
