import config from './config';
import { exportToolSet } from '@tool/utils/tool';

/**
 * KnowS 医学知识检索工具集入口
 * 导出完整的工具集配置，包含所有子工具
 */
export default exportToolSet({ config });
