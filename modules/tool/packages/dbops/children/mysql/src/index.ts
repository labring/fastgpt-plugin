import type { MySQLInputType, SQLDbOutputType } from '@tool/packages/dbops/types';
import mysql from 'mysql2/promise';

export async function main({
  host,
  port,
  username,
  password,
  database,
  sql: _sql,
  maxConnections,
  connectionTimeout,
  charset,
  timezone
}: MySQLInputType): Promise<SQLDbOutputType> {
  try {
    const sql = await mysql.createConnection({
      host,
      port,
      user: username,
      charset: charset,
      password: password,
      timezone: timezone,
      database: database,
      maxIdle: maxConnections,
      connectTimeout: connectionTimeout
    });
    const [result] = await sql.execute(_sql);
    await sql.end();
    return { result };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return Promise.reject(new Error(`MySQL SQL execution error: ${error.message}`));
    }
    return Promise.reject(new Error('MySQL SQL execution error: An unknown error occurred'));
  }
}
