import { z } from 'zod';
import wiki from 'wikijs';
import { getErrText } from '@tool/utils/err';
import { delay } from '@tool/utils/delay';

export const InputType = z.object({
  query: z.string()
});

export const OutputType = z.object({
  result: z.string()
});
const func = async (
  props: z.infer<typeof InputType>,
  retry = 3
): Promise<z.infer<typeof OutputType>> => {
  const { query } = props;

  try {
    const wikiInstance = wiki({ apiUrl: 'https://zh.wikipedia.org/w/api.php' }) as any;

    const searchResults = await wikiInstance.page(query).then((page: any) => {
      return page.summary();
    });

    return {
      result: searchResults
    };
  } catch (error) {
    console.log(error);

    if (retry <= 0) {
      return {
        result: getErrText(error, 'Failed to fetch data from wiki')
      };
    }

    await delay(Math.random() * 5000);
    return func(props, retry - 1);
  }
};

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  return func(props);
}
