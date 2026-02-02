import { env } from '@/env';

export const isProd = env.NODE_ENV === 'production';
