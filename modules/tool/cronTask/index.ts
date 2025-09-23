import cron from 'node-cron';
import cleanOrphanPlugins from './cleanOrphanPlugins';
cron.schedule('0 0 * * *', cleanOrphanPlugins);
