import type { OracleInputType, SQLDbOutputType } from '@tool/packages/sql/types';
import oracle from 'oracledb';

export async function main({
  serviceName,
  sid,
  tns,
  host,
  port,
  username,
  password,
  database,
  sql: _sql,
  maxConnections,
  connectionTimeout
}: OracleInputType): Promise<SQLDbOutputType> {
  try {
    const connectString: string = (() => {
      if (tns) return tns;
      const hostname = `${host}:${port}`;
      if (serviceName) return `${hostname}/${serviceName}`;
      else if (sid) return `${hostname}/${sid}`;
      else if (database) return `${hostname}/${database}`;
      else throw new Error('Invalid connection parameters: serviceName, sid, or tns required');
    })();
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
