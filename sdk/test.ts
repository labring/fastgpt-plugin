import { createClient } from './client';

const client = createClient({
  baseUrl: 'http://localhost:3002',
  token: '111'
});

const res = await client.tool.list();
console.log(res);

const models = await client.model.list();
console.log(models);

console.log(res.body);
