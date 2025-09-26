import { main } from './src';
import { ClickHouseInputSchema, SQLDbOutputSchema } from '@tool/packages/dbops/types';
import config from './config';
import { exportTool } from '@tool/utils/tool';

export default exportTool({
  toolCb: main,
  InputType: ClickHouseInputSchema,
  OutputType: SQLDbOutputSchema,
  config
});
