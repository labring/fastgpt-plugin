import { defineToolSet } from '@tool/type';
import { ToolTypeEnum } from '@tool/type/tool';
import googleSearch from './children/googleSearch';
import baiduSearch from './children/baiduSearch';
import googleVideosSearch from './children/googleVideosSearch';
import googleNewsSearch from './children/googleNewsSearch';
import googleImagesSearch from './children/googleImagesSearch';

export default defineToolSet({
  name: {
    'zh-CN': 'SearchApi',
    en: 'SearchApi'
  },
  icon: '',
  type: ToolTypeEnum.search,
  description: {
    'zh-CN': 'SearchApi 服务',
    en: 'SearchApi Service'
  },
  children: [googleSearch, baiduSearch, googleVideosSearch, googleNewsSearch, googleImagesSearch]
});
