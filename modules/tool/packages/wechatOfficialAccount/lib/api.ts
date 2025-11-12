export const OffiAccountURL = {
  // https://developers.weixin.qq.com/doc/subscription/api/base/api_getaccesstoken.html
  getAuthToken: {
    url: 'https://api.weixin.qq.com/cgi-bin/token',
    method: 'get' as const
  },

  // Materials API
  // https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_getmaterial.html
  getMaterial: {
    url: 'https://api.weixin.qq.com/cgi-bin/material/get_material',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_batchgetmaterial.html
  batchGetMaterial: {
    url: 'https://api.weixin.qq.com/cgi-bin/material/batchget_material',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_uploadimage.html
  uploadImage: {
    url: 'https://api.weixin.qq.com/cgi-bin/media/uploadimg',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_addmaterial.html
  addMaterial: {
    url: 'https://api.weixin.qq.com/cgi-bin/material/add_material',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_delmaterial.html
  deleteMaterial: {
    url: 'https://api.weixin.qq.com/cgi-bin/material/del_material',
    method: 'post' as const
  },

  // Draft API
  // https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_switch.html
  draftSwitch: {
    url: 'https://api.weixin.qq.com/cgi-bin/draft/switch',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_update.html
  updateDraft: {
    url: 'https://api.weixin.qq.com/cgi-bin/draft/update',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_batchget.html
  batchGetDraft: {
    url: 'https://api.weixin.qq.com/cgi-bin/draft/batchget',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_add.html
  addDraft: {
    url: 'https://api.weixin.qq.com/cgi-bin/draft/add',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_getdraft.html
  getDraft: {
    url: 'https://api.weixin.qq.com/cgi-bin/draft/get',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_delete.html
  deleteDraft: {
    url: 'https://api.weixin.qq.com/cgi-bin/draft/delete',
    method: 'post' as const
  },

  // Release API
  // https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublish_batchget.html
  batchGetPublished: {
    url: 'https://api.weixin.qq.com/cgi-bin/freepublish/batchget',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublish_submit.html
  submitPublish: {
    url: 'https://api.weixin.qq.com/cgi-bin/freepublish/submit',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublishdelete.html
  deletePublished: {
    url: 'https://api.weixin.qq.com/cgi-bin/freepublish/delete',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublish_get.html
  getPublishStatus: {
    url: 'https://api.weixin.qq.com/cgi-bin/freepublish/get',
    method: 'post' as const
  },

  // https://developers.weixin.qq.com/doc/subscription/api/public/api_freepublishgetarticle.html
  getPublishedArticle: {
    url: 'https://api.weixin.qq.com/cgi-bin/freepublish/getarticle',
    method: 'post' as const
  }
} as const;
// Common Types
export interface NewsItem {
  title: string;
  thumb_media_id: string;
  show_cover_pic: number;
  author?: string;
  digest?: string;
  content: string;
  url: string;
  content_source_url?: string;
}

export interface MaterialItem {
  media_id: string;
  content?: {
    news_item: NewsItem[];
  };
  update_time: number;
  name?: string;
  url?: string;
}

export interface DraftItem {
  media_id: string;
  content: {
    news_item: (Article & {
      url?: string;
      is_deleted?: boolean;
    })[];
  };
  update_time: number;
}

export interface PublishedItem {
  article_id: string;
  content: {
    news_item: (Article & {
      url?: string;
    })[];
  };
  update_time: number;
}

export type WeChatError = {
  errcode: number;
  errmsg: string;
};

// Material types
export type MaterialType = 'image' | 'video' | 'voice' | 'news';

// Article types for drafts
export type ArticleType = 'news' | 'newspic';

// Publish status types
export type PublishStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=success, 1=publishing, 2=original fail, 3=normal fail, 4=audit fail, 5=deleted, 6=banned

// Image info for articles
export interface ImageInfo {
  image_list: Array<{
    image_media_id: string;
  }>;
}

// Product info for articles
export interface ProductInfo {
  footer_product_info?: {
    product_key?: string;
  };
}

// Complete article structure for drafts
export interface Article {
  article_type?: ArticleType;
  title?: string;
  author?: string;
  digest?: string;
  content: string;
  content_source_url?: string;
  thumb_media_id?: string;
  need_open_comment?: number;
  only_fans_can_comment?: number;
  pic_crop_235_1?: string;
  pic_crop_1_1?: string;
  image_info?: ImageInfo;
  cover_info?: any;
  product_info?: ProductInfo;
}

export type OffiAccountAPIType = {
  getAuthToken: {
    req: {
      grant_type: 'client_credential';
      appid: string;
      secret: string;
    };
    res: {
      access_token: string;
      expires_in: number;
    };
  };

  // Materials API
  getMaterial: {
    req: {
      access_token: string;
      media_id: string;
    };
    res:
      | { news_item: NewsItem[] }
      | { title: string; description: string; down_url: string }
      | Blob; // For other media types
  };

  batchGetMaterial: {
    req: {
      access_token: string;
      type: MaterialType;
      offset: number;
      count: number;
    };
    res: {
      total_count: number;
      item_count: number;
      item: MaterialItem[];
    };
  };

  uploadImage: {
    req: {
      access_token: string;
      media: File; // FormData file
    };
    res: {
      url: string;
      errcode?: number;
      errmsg?: string;
    } & WeChatError;
  };

  addMaterial: {
    req: {
      access_token: string;
      type: MaterialType;
      media: File; // FormData file
      description?: {
        title?: string;
        introduction?: string;
      };
    };
    res: {
      media_id: string;
      url?: string; // Only for image type
    };
  };

  deleteMaterial: {
    req: {
      access_token: string;
      media_id: string;
    };
    res: WeChatError;
  };

  // Draft API
  draftSwitch: {
    req: {
      access_token: string;
      checkonly?: number; // 1 for check only
    };
    res: WeChatError & {
      is_open?: number; // 0: closed, 1: open
    };
  };

  updateDraft: {
    req: {
      access_token: string;
      media_id: string;
      index: number; // Position in articles array (0-based)
      articles: Article;
    };
    res: WeChatError;
  };

  batchGetDraft: {
    req: {
      access_token: string;
      offset: number;
      count: number; // 1-20
      no_content?: number; // 1 to exclude content field
    };
    res: {
      total_count: number;
      item_count: number;
      item: DraftItem[];
    };
  };

  addDraft: {
    req: {
      access_token: string;
      articles: Article[];
    };
    res: {
      media_id: string;
    };
  };

  getDraft: {
    req: {
      access_token: string;
      media_id: string;
    };
    res: {
      news_item: (Article & {
        thumb_url?: string;
        url?: string;
        is_deleted?: boolean;
      })[];
    };
  };

  deleteDraft: {
    req: {
      access_token: string;
      media_id: string;
    };
    res: WeChatError;
  };

  batchGetPublished: {
    req: {
      access_token: string;
      offset: number;
      count: number; // 1-20
      no_content?: number; // 1 to exclude content field
    };
    res: {
      total_count: number;
      item_count: number;
      item: PublishedItem[];
    };
  };

  submitPublish: {
    req: {
      access_token: string;
      media_id: string;
    };
    res: WeChatError & {
      publish_id: string;
      msg_data_id: string;
    };
  };

  deletePublished: {
    req: {
      access_token: string;
      article_id: string;
      index?: number; // Position (1-based), 0 or empty deletes all
    };
    res: WeChatError;
  };

  getPublishStatus: {
    req: {
      access_token: string;
      publish_id: string;
    };
    res: WeChatError & {
      publish_id: string;
      publish_status: PublishStatus;
      article_id?: string;
      article_detail?: any;
      fail_idx?: number[]; // Indices of failed articles
    };
  };

  getPublishedArticle: {
    req: {
      access_token: string;
      article_id: string;
    };
    res: WeChatError & {
      news_item: (Article & {
        thumb_url?: string;
        url?: string;
        is_deleted?: boolean;
      })[];
    };
  };
};
