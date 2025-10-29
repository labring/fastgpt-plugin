import { s } from '@/router/init';
import { contract } from '@/contract';
import { getToolTags } from '@tool/controller';

export const getTagsHandler = s.route(contract.tool.getTags, async () => {
  const tags = getToolTags();

  return {
    status: 200,
    body: tags
  };
});
