import express from 'express';
import { initOpenAPI } from './contract/openapi';
import { initRouter } from './router';
import { initTool } from '@tool/init';

const app = express().use(
  express.json(),
  express.urlencoded({ extended: true }),
  express.static('public', {})
);

initOpenAPI(app);
initRouter(app);

initTool();

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, (error?: Error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`FastGPT Plugin Service is listening at http://localhost:${PORT}`);
});
