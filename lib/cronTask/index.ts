import cron from 'node-cron';
import { clearExpiredMinioFiles } from '../s3/ttl/cron';
cron.schedule('0 */1 * * *', clearExpiredMinioFiles);
