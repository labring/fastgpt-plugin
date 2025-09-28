import type { OracleInputType, SQLDbOutputType } from '@tool/packages/dbops/types';
import oracle from 'oracledb';

function refine(result: any) {
  if (!result.metaData || !result.rows) {
    throw new Error('Invalid result: metaData or rows missing');
  }

  const columnNames = result.metaData.map((column: any) => column.name);

  return result.rows.map((row: any, index: number) => {
    if (row.length !== columnNames.length) {
      throw new Error(`Row ${index} length does not match metaData length`);
    }
    const data: any = {};
    columnNames.forEach((name: any, index: number) => {
      data[name] = row[index];
    });
    return data;
  });
}

export async function main({
  sql: _sql,
  connectString,
  username,
  password,
  maxConnections,
  connectionTimeout
}: OracleInputType): Promise<SQLDbOutputType> {
  try {
    const pool = await oracle.createPool({
      connectString,
      user: username,
      password: password,
      poolMin: 0,
      poolTimeout: 60,
      poolMax: maxConnections,
      connectTimeout: connectionTimeout
    });
    const sql = await pool.getConnection();
    const result = await sql.execute(_sql);
    await sql.close();
    return { result };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return Promise.reject(Error(`Oracle SQL execution error: ${error.message}`));
    }
    return Promise.reject(Error('Oracle SQL execution error: An unknown error occurred'));
  }
}
