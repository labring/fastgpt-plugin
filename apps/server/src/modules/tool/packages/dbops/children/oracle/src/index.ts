import type { OracleInputType, SQLDbOutputType } from '@tool/packages/dbops/types';
import oracle from 'oracledb';

oracle.fetchAsString = [oracle.NUMBER, oracle.DATE];
oracle.outFormat = oracle.OUT_FORMAT_OBJECT;

function sanitize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function main({
  sql,
  connectString,
  username,
  password,
  maxConnections,
  connectionTimeout
}: OracleInputType): Promise<SQLDbOutputType> {
  let pool: oracle.Pool | undefined;
  let conn: oracle.Connection | undefined;

  try {
    pool = await oracle.createPool({
      connectString,
      user: username,
      password: password,
      poolMin: 0,
      poolTimeout: 60,
      poolMax: maxConnections,
      connectTimeout: connectionTimeout
    });
    conn = await pool.getConnection();
    const execResult = await conn.execute(sql, [], {
      outFormat: oracle.OUT_FORMAT_OBJECT
    });
    const safeResult = sanitize({
      rows: execResult.rows ?? [],
      metaData: execResult.metaData ?? []
    });
    return {
      result: safeResult
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return Promise.reject(Error(`Oracle SQL execution error: ${error.message}`));
    }
    return Promise.reject(Error('Oracle SQL execution error: An unknown error occurred'));
  } finally {
    await conn?.close();
    await pool?.close();
  }
}
