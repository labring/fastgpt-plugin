import createClient from './client';

const client = createClient({
  baseUrl: 'http://localhost:3002',
  token: '111'
});

const res = await client.tool.list();
if (res.status === 200) {
  const body = res.body;
}

console.log(res.body);
