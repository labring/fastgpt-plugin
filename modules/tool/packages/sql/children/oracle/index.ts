import { main } from './src';
import { OracleInputRefinedSchema, SQLDbOutputSchema } from '@tool/packages/sql/types';
import config from './config';
import { exportTool } from '@tool/utils/tool';

export default exportTool({
  toolCb: main,
  InputType: OracleInputRefinedSchema,
  OutputType: SQLDbOutputSchema,
  config
});
