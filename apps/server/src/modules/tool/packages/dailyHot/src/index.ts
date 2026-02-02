import { z } from 'zod';
import { POST, GET } from '@tool/utils/request';

export const InputType = z.object({
  sources: z.array(z.enum(['36kr', 'zhihu', 'weibo', 'juejin', 'toutiao'])).default(['36kr'])
});

export const OutputType = z.object({
  hotNewsList: z.array(
    z.union([
      z.object({
        title: z.string().describe('hot news title').optional(),
        description: z.string().describe('hot news description').optional(),
        source: z.string().describe('hot news source website'),
        time: z.string().describe('hot news publish time').optional()
      }),
      z.object({
        source: z.string().describe('hot news source website'),
        error: z.string().describe('failed to get hot news, error message').optional()
      })
    ])
  )
});

type Response = z.infer<typeof OutputType>['hotNewsList'][number];

type Kr36Response = {
  data: {
    hotRankList: {
      templateMaterial: {
        widgetTitle: string;
      };
      publishTime: string;
    }[];
  };
};
async function get36krList(): Promise<Response[]> {
  const url = `https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot`;

  const { data: Kr36Response } = await POST<Kr36Response>(url, {
    partner_id: 'wap',
    param: {
      siteId: 1,
      platformId: 2
    },
    timestamp: new Date().getTime()
  });
  const kr36List = Kr36Response?.data?.hotRankList;
  if (!kr36List) {
    return Promise.reject({
      error: 'Failed to get kr36 list'
    });
  }

  const hotNewsList: Response[] = kr36List.map((item) => {
    return {
      title: item.templateMaterial.widgetTitle,
      source: '36氪',
      time: new Date(item.publishTime).toLocaleString('zh-CN')
    };
  });

  return hotNewsList;
}

type ZhihuResponse = {
  data: {
    target: {
      title: string;
      created: number;
      excerpt: string;
    };
  }[];
};
async function getZhihuList(): Promise<Response[]> {
  const url = `https://api.zhihu.com/topstory/hot-lists/total?limit=50`;

  const { data: ZhihuResponse } = await GET<ZhihuResponse>(url);
  const zhihuList = ZhihuResponse?.data;
  if (!zhihuList) {
    return Promise.reject({
      error: 'Failed to get zhihu list'
    });
  }

  const hotNewsList: Response[] = zhihuList.map((item) => {
    const data = item.target;
    return {
      title: data.title,
      description: data.excerpt,
      source: '知乎',
      time: new Date(data.created * 1000).toLocaleString('zh-CN')
    };
  });

  return hotNewsList;
}

type WeiboResponse = {
  data: {
    cards: {
      card_group?: {
        desc: string;
      }[];
    }[];
  };
};
async function getWeiboList(): Promise<Response[]> {
  const url =
    'https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot&title=%E5%BE%AE%E5%8D%9A%E7%83%AD%E6%90%9C&extparam=filter_type%3Drealtimehot%26mi_cid%3D100103%26pos%3D0_0%26c_type%3D30%26display_time%3D1540538388&luicode=10000011&lfid=231583';

  const { data: WeiboResponse } = await GET<WeiboResponse>(url, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  const weiboList = WeiboResponse.data.cards[0].card_group;
  if (!weiboList) {
    return Promise.reject({
      error: 'Failed to get weibo list'
    });
  }

  const hotNewsList: Response[] = weiboList.map((item) => {
    return {
      title: item.desc,
      source: '微博'
    };
  });

  return hotNewsList;
}

type JuejinResponse = {
  data: {
    content: {
      content_id: string;
      title: string;
      created_at: number;
      ctime: number;
    };
    author: {
      name: string;
    };
    content_counter: {
      hot_rank: number;
    };
  }[];
};
async function getJuejinList(): Promise<Response[]> {
  const url = 'https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot';

  const { data: JuejinResponse } = await GET<JuejinResponse>(url);
  const juejinList = JuejinResponse?.data;
  if (!juejinList) {
    return Promise.reject({
      error: 'Failed to get juejin list'
    });
  }

  const hotNewsList: Response[] = juejinList.map((item) => {
    return {
      title: item.content.title,
      source: '掘金'
    };
  });

  return hotNewsList;
}

type ToutiaoResponse = {
  data: {
    Title: string;
  }[];
};
async function getToutiaoList(): Promise<Response[]> {
  const url = `https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc`;

  const { data: ToutiaoResponse } = await GET<ToutiaoResponse>(url);
  const toutiaoList = ToutiaoResponse?.data;
  if (!toutiaoList) {
    return Promise.reject({
      error: 'Failed to get toutiao list'
    });
  }
  const hotNewsList: Response[] = toutiaoList.map((item) => {
    return {
      title: item.Title,
      source: '头条'
    };
  });

  return hotNewsList;
}

export async function tool({
  sources
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const map = {
    '36kr': get36krList,
    zhihu: getZhihuList,
    weibo: getWeiboList,
    juejin: getJuejinList,
    toutiao: getToutiaoList
  };
  const promises = sources.map(async (source) => {
    return await map[source]();
  });

  const results = await Promise.allSettled(promises);
  const allHotNewsList: Response[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allHotNewsList.push(...result.value);
    } else {
      allHotNewsList.push({
        error: `Failed to get hot news from ${sources[index]}`,
        source: sources[index]
      });
    }
  });

  if (!allHotNewsList.length) {
    return Promise.reject({
      error: 'Failed to get hot news list'
    });
  }

  return {
    hotNewsList: allHotNewsList
  };
}
