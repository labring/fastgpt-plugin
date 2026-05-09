import { z } from 'zod';
import axios from 'axios';
import { serviceRequestMaxContentLength } from '@tool/constants';
import { streamToMarkdown } from '@tool/worker/function';
import * as cheerio from 'cheerio';
import { cheerioToHtml } from '@tool/worker/streamToMarkdown';
import { html2md } from '@tool/worker/htmlToMarkdown/utils';
import { workerExists } from '@tool/worker/utils';
import { createInternalAddressChecker } from './network';

export const isInternalAddress = createInternalAddressChecker({
  checkInternalIp: () => true
}).isInternalAddress;

export const urlsFetchV2 = async ({
  url,
  selector
}: {
  url: string;
  selector?: string;
}): Promise<{
  title: string;
  content: string;
}> => {
  const isInternal = await isInternalAddress(url);
  if (isInternal) {
    return {
      title: '',
      content: 'Cannot fetch internal url'
    };
  }

  const fetchRes = await axios.get(url, {
    timeout: 30000,
    maxContentLength: serviceRequestMaxContentLength,
    maxBodyLength: serviceRequestMaxContentLength,
    responseType: 'text'
  });

  if (fetchRes.data && fetchRes.data.length > serviceRequestMaxContentLength) {
    return Promise.reject(`Content size exceeds ${serviceRequestMaxContentLength} limit`);
  }

  return await streamToMarkdown({
    response: fetchRes.data,
    url,
    selector
  });
};

export const urlsFetchV1 = async ({
  url,
  selector
}: {
  url: string;
  selector?: string;
}): Promise<{
  title: string;
  content: string;
}> => {
  const isInternal = await isInternalAddress(url);
  if (isInternal) {
    return {
      title: '',
      content: 'Cannot fetch internal url'
    };
  }
  console.log('Run in v1', url);
  const fetchRes = await axios.get(url, {
    timeout: 30000,
    maxContentLength: serviceRequestMaxContentLength,
    maxBodyLength: serviceRequestMaxContentLength,
    responseType: 'text'
  });

  if (fetchRes.data && fetchRes.data.length > serviceRequestMaxContentLength) {
    return Promise.reject(`Content size exceeds ${serviceRequestMaxContentLength} limit`);
  }

  const $ = cheerio.load(fetchRes.data);
  const { title, html } = cheerioToHtml({
    fetchUrl: url,
    $: $,
    selector: selector
  });

  return {
    title,
    content: html2md(html)
  };
};

export const InputType = z.object({
  url: z.string()
});

export const OutputType = z.object({
  title: z.string().optional(),
  result: z.string()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const workerRun = workerExists('streamToMarkdown');
  if (!workerRun) {
    const { title, content } = await urlsFetchV1({
      url: props.url,
      selector: 'body'
    });

    return {
      title,
      result: content
    };
  }

  const { title, content } = await urlsFetchV2({
    url: props.url,
    selector: 'body'
  });

  return {
    title,
    result: content
  };
}
