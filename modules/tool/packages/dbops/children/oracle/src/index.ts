import type { OracleInputType, SQLDbOutputType } from '@tool/packages/dbops/types';
import oracle from 'oracledb';

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
    return { result: result.rows };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return Promise.reject(Error(`Oracle SQL execution error: ${error.message}`));
    }
    return Promise.reject(Error('Oracle SQL execution error: An unknown error occurred'));
  }
}
