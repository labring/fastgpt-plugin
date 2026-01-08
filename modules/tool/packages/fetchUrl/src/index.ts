import { isIPv6 } from 'net';
import { z } from 'zod';
import axios from 'axios';
import { serviceRequestMaxContentLength } from '@tool/constants';
import { streamToMarkdown } from '@tool/worker/function';
import * as cheerio from 'cheerio';
import { cheerioToHtml } from '@tool/worker/streamToMarkdown';
import { html2md } from '@tool/worker/htmlToMarkdown/utils';
import { workerExists } from '@tool/worker/utils';

export const isInternalAddress = (url: string): boolean => {
  const SERVICE_LOCAL_PORT = `${process.env.PORT || 3000}`;
  const SERVICE_LOCAL_HOST =
    process.env.HOSTNAME && isIPv6(process.env.HOSTNAME)
      ? `[${process.env.HOSTNAME}]:${SERVICE_LOCAL_PORT}`
      : `${process.env.HOSTNAME || 'localhost'}:${SERVICE_LOCAL_PORT}`;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const fullUrl = parsedUrl.toString();

    // Check for localhost and common internal domains
    if (hostname === SERVICE_LOCAL_HOST) {
      return true;
    }

    // Metadata endpoints whitelist
    const metadataEndpoints = [
      // AWS
      'http://169.254.169.254/latest/meta-data/',
      // Azure
      'http://169.254.169.254/metadata/instance?api-version=2021-02-01',
      // GCP
      'http://metadata.google.internal/computeMetadata/v1/',
      // Alibaba Cloud
      'http://100.100.100.200/latest/meta-data/',
      // Tencent Cloud
      'http://metadata.tencentyun.com/latest/meta-data/',
      // Huawei Cloud
      'http://169.254.169.254/latest/meta-data/'
    ];
    if (metadataEndpoints.some((endpoint) => fullUrl.startsWith(endpoint))) {
      return true;
    }

    if (process.env.CHECK_INTERNAL_IP !== 'true') return false;

    // For IP addresses, check if they are internal
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Pattern.test(hostname)) {
      return false; // Not an IP address, so it's a domain name - consider it external by default
    }

    // ... existing IP validation code ...
    const parts = hostname.split('.').map(Number);

    if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255)) {
      return false;
    }

    // Only allow public IP ranges
    return (
      parts[0] !== 0 &&
      parts[0] !== 10 &&
      parts[0] !== 127 &&
      !(parts[0] === 169 && parts[1] === 254) &&
      !(parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) &&
      !(parts[0] === 192 && parts[1] === 168) &&
      !(parts[0] >= 224 && parts[0] <= 239) &&
      !(parts[0] >= 240 && parts[0] <= 255) &&
      !(parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) &&
      !(parts[0] === 9 && parts[1] === 0) &&
      !(parts[0] === 11 && parts[1] === 0)
    );
  } catch {
    return false; // If URL parsing fails, reject it as potentially unsafe
  }
};

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
  const isInternal = isInternalAddress(url);
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
  const isInternal = isInternalAddress(url);
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
