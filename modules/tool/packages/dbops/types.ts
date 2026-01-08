import { z } from 'zod';

export const BaseSQLDbInputSchema = z.object({
  sql: z
    .string()
    .min(1, 'SQL is required')
    .transform((val) => (val.endsWith(';') ? val.slice(0, -1) : val)),
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().int().positive().max(65535, 'Port number must be between 1 and 65535'),
  database: z.string().min(1, 'Database is required').optional(),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  connectionTimeout: z.coerce
    .number()
    .nonnegative()
    .transform((val) => (val ? val : 3e4)),
  maxConnections: z.coerce
    .number()
    .nonnegative()
    .transform((val) => (val ? val : 10))
});
export type BaseSQLDbInputType = z.infer<typeof BaseSQLDbInputSchema>;

export const SQLDbOutputSchema = z.object({ result: z.any() });
export type SQLDbOutputType = z.infer<typeof SQLDbOutputSchema>;

export const PostgreSQLInputSchema = z.object({
  ...BaseSQLDbInputSchema.shape
});
export type PostgreSQLInputType = z.infer<typeof PostgreSQLInputSchema>;

export const MySQLInputSchema = z.object({
  ...BaseSQLDbInputSchema.shape,
  charset: z.string().default('utf8mb4'),
  timezone: z.string().default('+00:00')
});
export type MySQLInputType = z.infer<typeof MySQLInputSchema>;

export const SQLServerInputSchema = z.object({
  ...BaseSQLDbInputSchema.shape,
  instanceName: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  domain: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional())
});
export type SQLServerInputType = z.infer<typeof SQLServerInputSchema>;

export const ClickHouseInputSchema = z.object({
  ...BaseSQLDbInputSchema.omit({ host: true, port: true }).shape,
  url: z.string().min(1, 'URL is required')
});
export type ClickHouseInputType = z.infer<typeof ClickHouseInputSchema>;

export const OracleInputSchema = z.object({
  ...BaseSQLDbInputSchema.pick({
    username: true,
    password: true,
    sql: true,
    maxConnections: true,
    connectionTimeout: true
  }).shape,
  connectString: z.string().min(1, 'connectString is required')
});

export type OracleInputType = z.infer<typeof OracleInputSchema>;
