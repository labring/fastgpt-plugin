import { main } from './src';
import { PostgreSQLInputSchema, SQLDbOutputSchema } from '@tool/packages/dbops/types';
import config from './config';
import { exportTool } from '@tool/utils/tool';

export default exportTool({
  toolCb: main,
  InputType: PostgreSQLInputSchema,
  OutputType: SQLDbOutputSchema,
  config
});
