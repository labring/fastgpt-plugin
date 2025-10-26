import { contract } from '@/contract';
import { s } from '@/router/init';
import confirmUpload from './confirmUpload';
import getUploadURL from './getUploadURL';
import deleteHandler from './delete';
import install from './install';
import parseUploadedTool from './parseUploadedTool';

export default s.router(contract.tool.upload, {
  confirmUpload,
  getUploadURL,
  delete: deleteHandler,
  install,
  parseUploadedTool: parseUploadedTool
});
