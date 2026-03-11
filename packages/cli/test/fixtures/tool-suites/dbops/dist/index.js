import { a as InputSchema$4, c as OutputSchema$3, i as OutputSchema$2, l as InputSchema$1, n as OutputSchema, o as OutputSchema$4, r as InputSchema$2, s as InputSchema$3, t as InputSchema, u as OutputSchema$1 } from "./schemas-uhFbUD_I.js";
import "./config.js";
import { ToolPlugin, createToolHandler } from "@fastgpt-plugin/helpers/index";
import { createToolHandler as createToolHandler$1 } from "@fastgpt-plugin/helpers";

//#region .build-temp/children/mysql/src/tool.ts
const tool$4 = createToolHandler(InputSchema$1, OutputSchema$1, async (input, ctx) => {
	return { message: "Hello from MySQL" };
});

//#endregion
//#region .build-temp/children/postgresql/src/tool.ts
const tool$3 = createToolHandler$1(InputSchema$3, OutputSchema$3, async (_input, _ctx) => {
	return { message: "Hello from postgresql" };
});

//#endregion
//#region .build-temp/children/sqlserver/src/tool.ts
const tool$2 = createToolHandler$1(InputSchema$4, OutputSchema$4, async (_input, _ctx) => {
	return { message: "Hello from sqlserver" };
});

//#endregion
//#region .build-temp/children/oracle/src/tool.ts
const tool$1 = createToolHandler$1(InputSchema$2, OutputSchema$2, async (_input, _ctx) => {
	return { message: "Hello from oracle" };
});

//#endregion
//#region .build-temp/children/clickhouse/src/tool.ts
const tool = createToolHandler$1(InputSchema, OutputSchema, async (_input, _ctx) => {
	return { message: "Hello from clickhouse" };
});

//#endregion
//#region .build-temp/index.ts
const plugin = new ToolPlugin();
plugin.registerTool("mysql", tool$4);
plugin.registerTool("postgresql", tool$3);
plugin.registerTool("sqlserver", tool$2);
plugin.registerTool("oracle", tool$1);
plugin.registerTool("clickhouse", tool);

//#endregion
export { InputSchema as ClickhouseInputSchema, OutputSchema as ClickhouseOutputSchema, InputSchema$1 as MysqlInputSchema, OutputSchema$1 as MysqlOutputSchema, InputSchema$2 as OracleInputSchema, OutputSchema$2 as OracleOutputSchema, InputSchema$3 as PostgresqlInputSchema, OutputSchema$3 as PostgresqlOutputSchema, InputSchema$4 as SqlserverInputSchema, OutputSchema$4 as SqlserverOutputSchema, plugin };