import { ToolPlugin } from '@fastgpt-plugin/helpers/index';

import { tool as clickhouseTool } from './children/clickhouse/src/tool';
import { tool as mysqlTool } from './children/mysql/src/tool';
import { tool as oracleTool } from './children/oracle/src/tool';
import { tool as postgresqlTool } from './children/postgresql/src/tool';
import { tool as sqlserverTool } from './children/sqlserver/src/tool';

const plugin = new ToolPlugin();
plugin.registerTool('mysql', mysqlTool);
plugin.registerTool('postgresql', postgresqlTool);
plugin.registerTool('sqlserver', sqlserverTool);
plugin.registerTool('oracle', oracleTool);
plugin.registerTool('clickhouse', clickhouseTool);

export { plugin };
