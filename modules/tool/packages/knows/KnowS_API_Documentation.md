KnowS对接For⼩胰宝

环境&认证

测试环境

• Host- https://dev-api.nullht.com 

• x-api-key:c0970d9fe46345ecbf8b6d35b230d45e

⽣产环境

• Host- https://api.nullht.com 

• x-api-key:a6d9ce8081ac4d8cbcd772adafb75bca

⾝份认证

• HTTP头

◦ x-api-key

问答接⼝

检索证据列表

AI检索，⽤⼾提问，返回与该问题相关的证据列表

POST/knows/ai_search

• Request

属性

query

类型

String

data_scope

Enum[]

必填

说明

是

是

⽤⼾提问的问题⽂本

检索范围的证据类型PAPER,PAPER_CN,GUIDE,

MEETING

• Response

属性

question_id

evidences[]

→id

→title

→type

→label

类型

String

Array

String

String

Enum

说明

问题ID

证据列表

证据ID

证据标题

PAPER,PAPER_CN,GUIDE,MEETING

String[]

["IF:2.6","2001-08-01","⽂献综述(⾮系统性综述)","中科

院⼤类:4区","中科院⼩类:4区"]

→has_pdf

Boolean

是否有原⽂PDF

• 返回数据⽰例

代码块

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

{

    "question_id": "",

    "evidences":

    [

        {

            "id": "09c29d6d50154639b83f76a122f0aa04",
            "summary": "此综述⽂章指出,运动疗法可以有效改善肥胖⼈群的代谢状况。即使体重
降低不明显,但肥胖⼈群如果有较好的⼼肺健康状况,其⼼⾎管疾病死亡⻛险也会降低。运动可以提⾼肌
⾁对氧⽓的利⽤效率,使其更好地利⽤⽆限的脂肪储备⽽⾮有限的碳⽔化合物储备。此外,运动还可以改
善胰岛素抵抗和脂肪动员,从⽽改善代谢⻛险因素。作者建议,每周进⾏3-5次、每次30-45分钟的中等
强度运动,有助于改善肥胖⼈群的代谢状况。",
            "title": "Exercise in weight management of obesity.",

            "type": "PAPER",

            "label":

            [

                "IF:2.6",

                "2001-08-01",
                "⽂献综述(⾮系统性综述)",
                "中科院⼤类:4区",
                "中科院⼩类:4区"
            ]

        }

    ]

}

单篇证据的AI总结

对单篇证据，进⾏简单的概要总结

POST/knows/evidence/summary

• Request

属性

类型

必填

说明

evidence_id

String

是

证据ID

• Response

属性

summary

类型

String

说明

AI总结内容

获取所有证据的单篇AI总结（流式）

POST/knows/all_evidence_summary/stream

• Request

属性

类型

必填

说明

question_id

String

是

问题ID

• Response

Header

Transfer-Encoding:chunked

Content-type:text/event-stream;charset=utf-8

Body

结束帧的 data 为 {"type":"END"} 

代码块

1

2

3

4

5

data:{"created":1731041756068,"data":
{"evidence_id":"0d4a69c6a2484fd492e0fb417d3e506b","summary":"此项研究分析了阿司匹
林在结直肠癌患者中的⽣存结果。研究纳⼊了964名直肠或结肠癌患者，数据来 源于护⼠健康研究和健
康专业⼈员随访研究。研究结果显⽰，在具有突变PIK3CA的结直肠癌患者中，阿司匹林的常规使⽤与结
直肠癌特异性⽣存率的提⾼相关（多变量⻛险⽐为0.18，95%置信区间为0.06⾄0.61，P<0.001），
以及全因死亡的⽣存率提⾼（多变量⻛险⽐为0.54，95%置信区间为0.31⾄0.94，P=0.01）。然⽽，
在野⽣型PIK3CA的患者中，阿司匹林的常规使⽤与结直肠癌特异性⽣存率（多变量⻛险⽐为0.96，95%
置信区间为0.69⾄1.32，P=0.76）或全因死亡⽣存率（多变量⻛险⽐为0.94，95%置信区间为0.75⾄
1.17，P=0.96）没有相关性。研究结论指出，阿司匹林的常规使⽤与突变PIK3CA结直肠癌患者的⽣存
期延⻓相关，但与 野⽣型PIK3CA癌症患者⽆关。这些发现表明，结直肠癌中的PIK3CA突变可能作为阿
司匹林辅助治疗的预测分⼦⽣物标志物。"},"id":"1"}

data:{"created":1731041756153,"data":
{"evidence_id":"00a74088412c49309507334721f5fec6","summary":"此项病例对照研究分析
了在结直肠癌诊断后开始使⽤低剂量阿司匹林的患者的⽣存时间。研究纳⼊了4794名在1998年⾄2007
年间被诊断为结直肠癌的患者，并记录了1559例结直肠癌特异性死亡。研究结果显⽰，结直肠癌诊断后
使⽤低剂量阿司匹林与结直肠癌特异性死亡率（调整后的⽐值⽐为1.06，95%置信区间：0.92-1.24）
或全因死亡率（调整后的⽐值⽐为1.06，95%置信区间：0.94-1.19）没有显著关联。此外，使⽤低剂
量阿司匹林超过1年后也未发现与结直肠癌特异性死亡率的关联（调整后的⽐值⽐为0.98，95%置信区
间：0.82-1.19）。研究还表明，低剂量阿司匹林的使⽤与结肠癌特异性死亡率（调整后的⽐值⽐为
1.02，95%置信区间：0.83-1.25）或直肠癌特异性死亡率（调整后的⽐值⽐为1.10，95%置信区间：
0.88-1.38）之间没 有显著关联。结论是，在⼤规模⼈群基础的队列中，结直肠癌诊断后使⽤低剂量
阿司匹林并未增加⽣存时间。"},"id":"2"}

data:{"created":1731041756156,"data":
{"evidence_id":"047a3908339946309b77afa6f3390c9a","summary":"此项研究评估了阿司匹
林对结直肠癌发病率的⻓期影响。⼊组⼈数包括5139名参与英国医⽣阿司匹林试验的患者和2449名参
与UK-TIA阿司匹林试验的患者。研究设计为两项⼤型随机试验，随访时间超过20年。结果显⽰，分配
阿司匹林的患者结直肠癌的发病率显著降低（合并⻛险⽐0.74，95%置信区间0.56-0.97，
p=0.02），尤其是在接受阿司匹林治疗5年或更⻓时间的患者中（⻛险⽐0.63，95%置信区间0.47-
0.85，p=0.002）。然⽽，这种效果在治疗后10年才显现出来，且与治疗持续时间和药物依从性相关。
研究还发现，定期使⽤阿司匹林或其他⾮甾体抗炎药（NSAID）与结直肠癌⻛险降低⼀致，尤其是在使
⽤10年或更⻓时间后。对于阿司匹林的剂量，只有每⽇使⽤300毫克或以上的剂量与降低结直肠癌⻛险

有⼀致的关联。此研究的结论是，每⽇使⽤300毫克或以上的阿司匹林约5年对结直肠癌的初级预防有
效，且与观察性研究的发现⼀致。"},"id":"3"}

6

7

{"created":1731947280912,"data":{"type":"END"},"id":"1"}

单篇证据的被引内容

返回单篇证据被引⽤的原⽂部分

POST/knows/evidence/highlight

• Request

属性

类型

必填

说明

evidence_id

String

是

证据ID

• Response（Body）

属性

highlights

→block_id

→block_type

类型

Array

String

Enum

说明

引⽤位列表

caption图表标题

footnote脚注

equation公式

list-item列表类型⽂本

footer⻚脚

header⻚头

figure图⽚

heading标题

table表格

paragraph段落⽂本

→text

→files

String

⽂本内容

String[]

（图⽚）⽂件链接

→page_number

Integer

原⽂⻚码

代码块

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

[

    {

        "block_type": "header",

        "files": [],

        "page_number": 4,

        "text": "Zhang et al. Journal of Hematology & Oncology  2021,

14(1):145"

    },

    {

        "block_type": "caption",

        "files": [],

        "page_number": 4,

        "text": "Table 1  Trials comparing allo-HSCT with chemotherapy in acute

leukemia"

    },

    {

        "block_type": "table",

        "files": [

            "http://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

        ],

        "page_number": 4,

        "text": "References Diagnosis Risk Stratification CIR DFS OS\nLv et

al. [11] Adult Int-AML Int-AML 11.7% vs. 49.0% 74.3% vs. 47.3%; 80.8% vs.

53.5%; HID-HSCT vs. CT\np < 0.0001 p = 0.0004 p = 0.0001\nZhu et al. [15] Adult

t(8;21)AML-CR1 High risk: RUNX1-RUNX1 HR 22.1% vs 78.9% 61.7% vs 19.6% 71.6%

vs 26.7%\nHSCT vs. CT reduction < 3 log units loss of MMR within 6 months\nDuan

et al. [16] Adult inv(16)AML-CR1 CBFB-MYH11/ABL not report 84.6% vs. 31.4%,

76.0% vs. 71.0%; p = 0.283\nHSCT vs. CT levels > 0.1% at any time p < 0.001\nafter

two consolidation cycles\nDeng et al. [21] CEBPAbi + AML CR1 sustained positive

MRD 0% vs. 52.8%; p = 0.006 88.9% vs. 47.2%; 88.9% vs. 58.6%;p = 0.484\nafter two

consolidations p = 0.027\nHuang et al. [23] NPM1 + FLT3 +  Int or fav-AML not

report HR 0.138 HR 0.173\nCT vs. HSCT p < 0.001 p = 0.001\nChen et al. [106] NPM-

FLT3 +  FLT3-ITD mutant ratio FLT3 + HR 0.237 FL3 + HR 0.330 not report\nCT vs.

HSCT (high and low) p < 0.001; regardless of p < 0.001; regardless of FLT3-ITD

mutant length Ratio/Length\nRatio/Length\n(long and short)\nWang et al. [59] Ph

+ ALL white blood cell 1 risk factor: 23.6 vs. 1 risk factor:62.4 vs. 1 risk
factor:76.1% vs. HSCT vs. CT + TKIs\ncounts ≥ 30 × 109/L at diagnosis; less than 3

log 36.9%, p = 0.017; 2 risk factors: 37.5 vs. 100.0%, 43.8%, p = 0.048; 2 risk

factors:56.2 vs. 0%, 47.7%, p = 0.037; 2 risk factors:51.4% vs. 6.3%, reduction
of BCR-ABL p < 0.001\np < 0.001 p = 0.001\nlevels after two consoli‑\ndation

cycles\nLv et al. [32] Adult Ph-ALL Standard risk-ALL 12.8% vs 46.7%, 80.9% vs

51.1%, 91.2% vs 75.7%, HID-HSCT vs. CT\np = 0.0017 p = 0.0116 p = 0.0408"

21

22

23

24

25

26

    },

    {

        "block_type": "paragraph",

        "files": [],

        "page_number": 4,

        "text": "AML, acute myeloid leukemia; ALL, acute lymphoblastic

leukemia; CT, Chemotherapy; HSCT, hematopoietic stem cell transplantation;

HID, haploidentical donor; HR, high risk; Int, intermediate risk; DFS, disease-

free survival; TKIs, tyrosine kinase inhibitors; Sig, Statistical Significance"

27

28

    },

]

场景总结

基于问题和检索出来的证据，进⾏场景总结

POST/knows/answer

• Request

属性

类型

必填

说明

question_id

String

answer_type

Enum[]

是

是

问题ID

CLINICAL，RESEARCH，POPULAR_SCIENCE

• Response（Body）

属性

content

代码块

类型

String

说明

⽂本内容和引⽤id混杂，引⽤id⽤{}包裹

1

{"content":"建议1: ⽼年癌症患者出现眩晕和⼼悸可能与癌症本⾝或治疗相关的神经系统症状有
关。\n\n理由: ⼀项横断⾯研究发现,27%的年龄≥65岁的癌症患者存在异常运动、中⻛、周围性眩晕、
痴呆、退⾏性脊柱疾病和谵妄等神经系统症状{cb7a9d50776148648fd5aac728d136dc}。这些症状可
能导致⽼年癌症患者出现眩晕和⼼悸等表现。\n\n建议2: ⽼年癌症患者出现眩晕和⼼悸也可能与⼼⾎
管疾病、外周前庭疾病或精神 疾病等常⻅⽼年病因有关。\n\n理由: ⼀项诊断性研究发现,在⽼年眩
晕患者中,⼼⾎管疾病是最常⻅的主要原因(57%),其次是外周前庭疾病(14%)和精神疾病(10%)
{14bc312c014f47939f163205be099272}。另⼀项研究也发现,良性阵发性位置性眩晕(27.6%)和过
度换⽓/焦虑(15.3%)是⽼年⼈眩晕的常⻅原因{7587e1d119bb4e908b5378a05e59395f}。\n\n建议

3: 药物不良反应也可能是⽼年癌症患者出现眩晕和⼼悸的潜在原因之⼀。\n\n理由: ⼀项观察性研究
发现,药物不良反应是⽼年眩晕患者最常⻅的眩晕贡献性原因之⼀(20%)
{1a3a469f296d43d2b1f541111482ef3c}。另⼀综述也指出,镇静药物、抗⾼⾎压药物可能导致⽼年
⼈出现眩晕和步态不稳{e62b8a0dc3e04444827a0befec34807c}
{3125a641d7634269b92156da62a91e22}。\n\n建议4: 对于出现眩晕和⼼悸的⽼年癌症患者,需要
进⾏全⾯评估以确定具体原因。\n\n理由: ⼀项回顾性研究发现,⽼年⼈眩晕 常有多种诱因,如前庭系
统疾病、全⾝性疾病、多药物使⽤等{6279a2c70806414f88883909310dca41}。另⼀综述指出,通过
系统临床检查和选择性实验室检查可以确定⽼年⼈眩晕和失衡的具体原因
{e62b8a0dc3e04444827a0befec34807c}。因此,对于⽼年癌症患者的眩晕和⼼悸,需要进⾏全⾯评
估以明确病因。"}

场景总结（流式）

POST/knows/answer/stream

• Request

属性

类型

必填

说明

question_id

String

answer_type

Enum[]

是

是

问题ID

CLINICAL，RESEARCH，POPULAR_SCIENCE

• Response

结束帧的 data 为 {"type":"END"} 

代码块

data:{"created":1731947301717,"data":{"content":"## 学"},"id":"1"}

data:{"created":1731947301717,"data":{"content":"## 术背"},"id":"2"}

data:{"created":1731947301775,"data":{"content":"景和研究现"},"id":"3"}

data:{"created":1731947301916,"data":{"content":"状\n\n胰腺癌"},"id":"4"}

data:{"created":1731947302058,"data":{"content":"是⼀种⾼度"},"id":"5"}

data:{"created":1731947302104,"data":{"content":"恶性的消化"},"id":"6"}

data:{"created":1731947302241,"data":{"content":"系统肿瘤,"},"id":"7"}

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

data:{"created":1731947302382,"data":{"content":"预后极差。"},"id":"8"}

data:{"created":1731947280912,"data":{"type":"END"},"id":"9"}

TODO-创建Evidence

POST/knows/create_evidence_by_pdf_file

• Request

属性

类型

必填

说明

pdf_file

byte[]

是

• Response

代码块

1

2

3

{

  "evidence_id": ""

}

TODO-⾃动化标签（辅助列）

POST/knows/auto_tagging

• Request

属性

类型

必填

说明

content

String

⼆选⼀ ⽂本内容

evidence_id

String

⼆选⼀

EvidenceID，仅⽤到

全⽂的时候需要

tagging_type

Enum

是

⻅下表

• TaggingTypeEnum

EnumName

说明

Description

是否必须全

返回值格

⽂

式

THERAPEUTIC_AREA

ORGANISM

REGION

POPULATION_CHARACTERIS

TICS

PARTICIPANT_AGE

POPULATION_SEX

SAMPLE_SIZE

RESEARCH_GROUP

TREATMENT_REGIMEN_OF_R

ESEARCH_GROUP

CONTROL_GROUP

OUTCOME

PRIMARY_OUTCOME

LENGTH_OF_FOLLOW_UP

MAIN_FINDING

EFFECT_SIZE_AND_95CI_FO

R_PRIMARY_OUTCOME

TRIAL_NUMBER

FUNDING_SOURCE

LIMITATION

STUDY_TYPE

ORIGINAL_NON_ORIGINAL_S

TUDY

STUDY_PHASE

N

N

N

N

N

N

N

N

N

N

N

N

N

N

N

N

N

N

N

N

N

研究疾病

TherapeuticArea

研究物种

Organism

研究地区

Region

患者特征

PopulationCharacteristics

研究年龄

ParticipantAge

研究性别

PopulationSex

样本量

SampleSize

研究组

ResearchGroup

研究组的治

TreatmentRegimenofthe

疗⽅案

ResearchGroup

对照组

ControlGroup

研究终点

Outcome

主要研究终

PrimaryOutcome

点

随访时⻓

LengthofFollow-up

主要发现

MainFinding

主要终点的

EffectSizeand95%CIfor

⻛险⽐

PrimaryOutcome

试验注册号

TrialNumber

资⾦来源

FundingSource

局限性

Limitation

研究类型

StudyType

judgment

原始/⾮原始

Original/Non-originalStudy

_result，

研究

judgment

_reasons

研究分期

StudyPhase

CLINICAL_STAGE

BIOMARKER_STATUS

TREATMENT_LINE

N

N

N

患者临床分

ClinicalStage

期

⽣物标志物

BiomarkerStatus

状态

judgment

治疗线

TreatmentLine

_result，

judgment

_reasons

INCLUSION_EXCLUSION_BAS

N

extract_r

基于患者特

Inclusion/ExclusionBasedon

ED_ON_POPULATION_CHAR

esult，

征的纳排

PopulationCharacteristics

ACTERISTICS

judgment

_result，

judgment

_reasons

INCLUSION_EXCLUSION_BAS

N

extract_r

基于治疗线

Inclusion/ExclusionBasedon

ED_ON_TREATMENT_LINE

esult，

的纳排

TreatmentLine

judgment

_result，

judgment

_reasons

INCLUSION_EXCLUSION_BAS

N

extract_r

基于⼲预⽅

Inclusion/ExclusionBasedon

ED_ON_INTERVENTION

esult，

式的纳排

Intervention

judgment

_result，

judgment

_reasons

INCLUSION_EXCLUSION_BAS

N

extract_r

基于终点的

Inclusion/ExclusionBasedon

ED_ON_OUTCOME

esult，

纳排

Outcome

judgment

_result，

judgment

_reasons

RANDOM_SEQUENCE_GENER

Y

judgment

选择偏倚

RandomSequence

ATION

_result，

（随机序列

Generation

ALLOCATION_CONCEALMENT

Y

reason

的产⽣）

选择偏倚

（分配隐

藏）

AllocationConcealment

BLINDING_OF_OUTCOME_AS

Y

judgment

测量偏倚

BlindingofOutcome

SESSMENT

_result，

（研究结局

Assessment

reason

盲法评价）

INCOMPLETE_OUTCOME_DA

Y

judgment

随访偏倚

IncompleteOutcomeData

TA

_result，

（结果数据

reason

的完整性）

BLINDING_OF_PARTICIPANTS

Y

judgment

实施偏倚

BlindingofParticipantsand

_AND_PERSONNEL

_result，

（研究者和

Personnel

reason

受试者施

盲）

• Response

代码块

1

2

3

4

5

6

7

{

  "result": "",

  "extract_result": "",

  "judgment_result": "",

  "judgment_reason": "",

  "reason": ""

}

详情接⼝

英⽂⽂献详情

POST/knows/evidence/get_paper_en

• Request

属性

类型

必填

说明

evidence_id

String

translate_to_chin

Boolean

ese

是

否

证据ID

是否翻译标题摘要，默认为false

• Response（Body）

属性

title_en

title_cn

类型

String

String

说明

英⽂标题

中⽂标题

publish_date

String(yyyy-MM-

发表时间

dd)

impact_factor

Double

影响因⼦

study_type

journal

authors

String

String

⽂章类型

期刊名

String[]

作者

doi

abstract_en

abstract_cn

String

String

String

DOI号

英⽂摘要

中⽂摘要

cas_journal_division

String

中科院分区(⼤类)

cas_journal_division_sub String

中科院分区(⼩类)

wos_jif_quartile

String

JCR分区

has_pdf

Boolean

是否有全⽂

中⽂⽂献详情

POST/knows/evidence/get_paper_cn

• Request

属性

类型

必填

说明

evidence_id

String

是

证据ID

• Response（Body）

属性

title_en

title_cn

类型

String

String

说明

英⽂标题

中⽂标题

publish_date

String(yyyy-MM-

发表时间

dd)

impact_factor

Double

影响因⼦

study_type

journal

authors

doi

String

String

String[]

String

⽂章类型

期刊名

作者

DOI号

abstract_en

abstract_cn

String

String

英⽂摘要

中⽂摘要

指南详情

POST/knows/evidence/get_guide

• Request

属性

类型

必填

说明

evidence_id

String

translate_to_chin

Boolean

ese

• Response（Body）

是

否

证据ID

是否翻译标题，默认为false

属性

title_en

title_cn

类型

String

String

说明

英⽂标题

中⽂标题

publish_date

String(yyyy-MM-

发表时间

dd)

organizations

String[]

机构

会议详情

POST/knows/evidence/get_meeting

• Request

属性

类型

必填

说明

evidence_id

String

translate_to_chin

Boolean

ese

是

否

证据ID

是否翻译标题摘要，默认为false

• Response（Body）

属性

title_en

title_cn

类型

String

String

说明

英⽂标题

中⽂标题

publish_date

String(yyyy-MM-

发表时间

study_type

conference

sponsor

data_source

authors

doi

abstract_en

abstract_cn

dd)

String

String

String

String

String

String

String

String

研究类型

会议名

赞助⽅

来源

作者

DOI号

英⽂摘要

中⽂摘要

历史记录获取

获取问题列表

拉取⽤⼾的提问历史记录

POST/knows/list_question

1. 传⼊时间范围（from,to均可选，左闭右开）

2. 返回当前token所属租⼾/渠道下的⽤⼾问题列表

3. 时间正序排列

4. 每⻚最⼤返回50条，⽀持翻⻚

• Request

属性

类型

必填

说明

from_time

Timestamp

否

精确到毫秒的timestamp，例：1729246077911。如

不填则不做起始时间筛选

to_time

Timestamp

否

精确到毫秒的timestamp，例：1729246077911。如

不填则不做终⽌时间筛选

page

Integer

page_size

Integer

否

否

从1开始，默认为1

不⼩于0，最⼤50

• Response（Body）

属性

total_count

total_page

items[]

→id

→question

→user_id

→time

类型

Integer

Integer

Array

String

String

String

String

说明

总条数

总⻚数

数据

QuestionID

问题内容

⽤⼾ID

该问题的发⽣时间，"yyyy-MM-ddhh:mm:ss"格式

→clinical_answer

Boolean

是否有临床答案

→research_answer

Boolean

是否有学术答案



Boolean

是否有科普答案

→popular_science_answ

er

• 返回数据⽰例

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

{

    "code": 0,

    "msg": "ok",

    "data":

    {

        "total_count": 135,

        "total_page": 14,

        "items":

        [

            {

                "id": "",
                "question": "对于早期结直肠癌患者，使⽤阿司匹林能够改善患者的⽣存结局
吗？",
                "time": "yyyy-MM-dd hh:mm:ss",

                "user_id": "xxxxxx1",

                "clinical_answer": true,

                "research_answer": true,

                "popular_science_answer": true

            }

        ]

    }

}

获取⽂献解读列表

拉取⽤⼾的单篇⽂献AI解读历史记录

POST/knows/list_interpretion

1. 传⼊时间范围（from,to均可选，左闭右开）

2. 返回当前token所属租⼾/渠道下的⽤⼾单篇解读列表

3. 时间正序排列

4. 设置每⻚最⼤条数，⽀持翻⻚

• Request

属性

类型

必填

说明

from_time

Timestamp

否

精确到毫秒的timestamp，例：1729246077911。如

不填则不做起始时间筛选

to_time

Timestamp

否

精确到毫秒的timestamp，例：1729246077911。如

不填则不做终⽌时间筛选

page

page_size

int

int

否

否

从1开始，默认为1

不⼩于0，最⼤50

• Response（Body）

属性

total_count

total_page

items[]

→id

→user_id

类型

Integer

Integer

Array

String

String

说明

总条数

总⻚数

数据

QuestionID

⽤⼾ID

→evidence_type

Enum

证据类型（PAPER,GUIDE,MEETING）

→evidence_title

String

证据标题

→time

String

该解读的发⽣时间，"yyyy-MM-ddhh:mm:ss"格式

• 返回数据⽰例

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

{

    "code": 0,

    "msg": "ok",

    "data":

    {

        "total_count": 135,

        "total_page": 14,

        "items":

        [

            {

                "id": "",

                "evidence_type": "PAPER",

                "evidence_title": "Kamikawa Double-Flap Reconstruction After

Minimally Invasive Ivor-Lewis Esophagectomy.",

                "time": "yyyy-MM-dd hh:mm:ss",

                "user_id": "xxxxxx1"

            }

17

18

19

        ]

    }

}

⼩程序卡⽚⽣成⽅式

1. 调⽤ /knows/ai_search 接⼝，获取 question_id

2. 调⽤ /knows/answer 接⼝，触发总结

3. 待总结结束后，按照以下⽅法⽣成⼩程序卡⽚

a. ⼩程序AppId：wx5c99ce092b4ce157（⽣产）

b. ⼩程序⻚⾯路径拼接⽅式：/pages/gpt/index?sessionId= question_id 

统⼀错误码

错误码

-1

40001

错误描述

解决⽅案

systemerror

系统错误，请联系开发者

invalidcredential

Http请求头中x-api-key⽆效


