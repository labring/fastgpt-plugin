# 5118 SEO 关键词检索 API 工具

调用参考接口，获取关键词

### 参考文档
https://www.5118.com/apistore/detail/8cf3d6ed-2b12-ed11-8da8-e43d1a103141/-1
提交任务请求参数说明：
    名称 	类型 	必填 	默认值 	说明
    keyword 	string 	是 		查询关键词
    page_index 	int 	否 	1 	当前分页
    page_size 	int 	否 	100 	每页返回数据的数量(最大返回数量100条)
    sort_fields 	int 	否 	4 	排序字段(输入2-9下标,2:竞价公司数量,3:长尾词数量,4:流量指数,5:百度移动指数,6:360好搜指数,7:PC日检索量,8:移动日检索量,9:竞争激烈程度)
    sort_type 	string 	否 	desc 	升序或降序(asc:升序,desc:降序)
    filter 	int 	否 	1 	快捷过滤(输入1-9下标,1:所有词,2:所有流量词,3:流量指数词,4:移动指数词,5:360指数词,6:流量特点词,7:PC日检索量词,8:移动日检索量,9:存在竞价的词)
    filter_date 	string 	否 		筛选日期(时间格式:yyyy-MM-dd)

提交任务返回参数说明：
    名称 	类型 	默认值 	说明
    errcode 	string 	0 	返回的错误代码
    errmsg 	string 		返回的错误说明
    total 	int 		总数量
    page_count 	int 		总页数
    page_index 	int 	1 	当前分页
    page_size 	int 	100 	每页返回数据的数量(最大返回数量100条)
    keyword 	string 		关键词
    index 	int 		流量指数
    mobile_index 	int 		移动指数
    douyin_index 	int 		抖音指数
    haosou_index 	int 		好搜360指数
    long_keyword_count 	int 		长尾词数量
    page_url 	string 		推荐网站
    bidword_company_count 	int 		竞价公司数量
    bidword_kwc 	int 		竞价竞争度(1、高 2、中 3、低)
    bidword_pcpv 	int 		PC检索量
    bidword_wisepv 	int 		移动检索量
    sem_reason 	string 		流量特点
    sem_price 	string 		SEM点击价格

JSON

    {
        "errcode": "0",
        "errmsg": "",
        "data": {
            "total": 52,
            "page_count": 18,
            "page_index": 1,
            "page_size": 3,
            "word": [
                {
                    "keyword": "衬衫",
                    "index": 1063,
                    "mobile_index": 919,
                    "haosou_index": 1163,
                    "long_keyword_count": 6045520,
                    "bidword_company_count": 185,
                    "page_url": "",
                    "bidword_kwc": 1,
                    "bidword_pcpv": 240,
                    "bidword_wisepv": 1433,
                    "sem_reason": "",
                    "sem_price": "0.35~4.57"
                }
    			...
    				]
    	}
    }


---

下面由 AI 生成完整的设计文档
