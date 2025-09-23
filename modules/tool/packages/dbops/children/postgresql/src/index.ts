import type { PostgreSQLInputType, SQLDbOutputType } from '@tool/packages/dbops/types';
import postgres from 'postgres';

export async function main({
  host,
  port,
  username,
  password,
  database,
  sql: _sql,
  maxConnections,
  connectionTimeout
}: PostgreSQLInputType): Promise<SQLDbOutputType> {
  try {
    const sql = postgres({
      host,
      port,
      db: database,
      user: username,
      pass: password,
      max: maxConnections,
      connect_timeout: connectionTimeout
    });
    const result = await sql.unsafe(_sql);
    await sql.end();
    return { result };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return Promise.reject(Error(`PostgreSQL SQL execution error: ${error.message}`));
    }
    return Promise.reject(Error('PostgreSQL SQL execution error: An unknown error occurred'));
  }
}
