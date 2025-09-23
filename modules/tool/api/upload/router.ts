import { contract } from '@/contract';
import { s } from '@/router/init';
import confirmUpload from './confirmUpload';
import getUploadURL from './getUploadURL';
import deleteHandler from './delete';

export default s.router(contract.tool.upload, {
  confirmUpload,
  getUploadURL,
  delete: deleteHandler
});
