export async function tool(_input: Record<string, unknown>): Promise<Record<string, unknown>> {
  return { message: 'Hello from {{name}}' };
}
