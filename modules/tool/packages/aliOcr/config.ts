import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  toolId: 'aliOcr',
  name: {
    'zh-CN': '阿里云OCR文字识别',
    en: 'Alibaba Cloud OCR'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN':
      '使用阿里云文字识别（OCR）对图片或PDF进行智能识别，支持通用文字、证件证照、票据发票、企业资质、车辆物流、教育场景、小语种等71种识别类型。',
    en: 'Use Alibaba Cloud OCR to recognize text in images or PDFs. Supports 71 recognition types including general text, ID cards, invoices, business licenses, vehicles, education, and multilingual scenarios.'
  },
  toolDescription:
    'Perform OCR on an image or PDF using Alibaba Cloud OCR API. Select the recognition type (e.g. invoice, ID card, driving license) and provide the file URL. Returns the raw structured JSON result.',
  courseUrl:
    'https://help.aliyun.com/zh/ocr/developer-reference/api-ocr-api-2021-07-07-overview',
  secretInputConfig: [
    {
      key: 'accessKeyId',
      label: 'AccessKey ID',
      description: '阿里云 AccessKey ID',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'accessKeySecret',
      label: 'AccessKey Secret',
      description: '阿里云 AccessKey Secret',
      required: true,
      inputType: 'secret'
    }
  ],
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial release - 支持71种OCR识别类型',
      inputs: [
        {
          key: 'fileUrl',
          label: '文件 URL',
          description: '图片或PDF的公网可访问地址，图片最大10MB，PDF支持指定页码',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The public URL of the image or PDF to be recognized',
          placeholder: 'https://example.com/image.jpg'
        },
        {
          key: 'ocrType',
          label: '识别类型',
          description: '选择OCR识别场景，不同类型对应阿里云不同API接口',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          defaultValue: 'General',
          list: [
            // ── 统一识别 ──
            { label: '【统一识别】通用票证抽取（图片/PDF）', value: 'GeneralStructure' },

            // ── 通用文字识别 ──
            { label: '【通用文字】全文识别高精版（仅图片）', value: 'Advanced' },
            { label: '【通用文字】通用文字识别（仅图片）', value: 'General' },
            { label: '【通用文字】手写体识别（仅图片）', value: 'Handwriting' },
            { label: '【通用文字】电商图片文字识别（仅图片）', value: 'Basic' },
            { label: '【通用文字】表格识别（仅图片）', value: 'TableOcr' },
            { label: '【通用文字】文档结构化识别（仅图片）', value: 'DocumentStructure' },

            // ── 个人证照识别 ──
            { label: '【个人证照】身份证识别（仅图片）', value: 'Idcard' },
            { label: '【个人证照】中国护照识别（仅图片）', value: 'ChinesePassport' },
            { label: '【个人证照】国际护照识别（仅图片）', value: 'Passport' },
            { label: '【个人证照】户口本识别（仅图片）', value: 'Household' },
            { label: '【个人证照】不动产权证识别（仅图片）', value: 'EstateCertification' },
            { label: '【个人证照】银行卡识别（仅图片）', value: 'BankCard' },
            { label: '【个人证照】出生证明识别（仅图片）', value: 'BirthCertification' },
            { label: '【个人证照】来往大陆通行证识别（仅图片）', value: 'ExitEntryPermitToMainland' },
            { label: '【个人证照】往来港澳台通行证识别（仅图片）', value: 'ExitEntryPermitToHK' },
            { label: '【个人证照】香港身份证识别（仅图片）', value: 'HKIdcard' },
            { label: '【个人证照】社保卡识别（仅图片）', value: 'SocialSecurityCardVersionII' },
            { label: '【个人证照】国际身份证识别（仅图片）', value: 'InternationalIdcard' },

            // ── 票据凭证识别 ──
            { label: '【票据凭证】混贴发票识别（图片/PDF）', value: 'MixedInvoices' },
            { label: '【票据凭证】增值税发票识别（图片/PDF）', value: 'Invoice' },
            { label: '【票据凭证】机动车销售发票识别（仅图片）', value: 'CarInvoice' },
            { label: '【票据凭证】定额发票识别（图片/PDF）', value: 'QuotaInvoice' },
            { label: '【票据凭证】航空行程单识别（图片/PDF）', value: 'AirItinerary' },
            { label: '【票据凭证】火车票识别（图片/PDF）', value: 'TrainInvoice' },
            { label: '【票据凭证】出租车发票识别（仅图片）', value: 'TaxiInvoice' },
            { label: '【票据凭证】增值税卷票识别（图片/PDF）', value: 'RollTicket' },
            { label: '【票据凭证】银行承兑汇票识别（仅图片）', value: 'BankAcceptance' },
            { label: '【票据凭证】客运车船票识别（仅图片）', value: 'BusShipTicket' },
            { label: '【票据凭证】非税收入发票识别（仅图片）', value: 'NonTaxInvoice' },
            { label: '【票据凭证】通用机打发票识别（图片/PDF）', value: 'CommonPrintedInvoice' },
            { label: '【票据凭证】酒店流水识别（仅图片）', value: 'HotelConsume' },
            { label: '【票据凭证】支付详情页识别（仅图片）', value: 'PaymentRecord' },
            { label: '【票据凭证】电商订单页识别（仅图片）', value: 'PurchaseRecord' },
            { label: '【票据凭证】网约车行程单识别（仅图片）', value: 'RideHailingItinerary' },
            { label: '【票据凭证】购物小票识别（仅图片）', value: 'ShoppingReceipt' },
            { label: '【票据凭证】过路过桥费发票识别（仅图片）', value: 'TollInvoice' },
            { label: '【票据凭证】税收完税证明识别（仅图片）', value: 'TaxClearanceCertificate' },
            { label: '【票据凭证】二手车销售发票识别（图片/PDF）', value: 'UsedCarInvoice' },

            // ── 企业资质识别 ──
            { label: '【企业资质】营业执照识别（仅图片）', value: 'BusinessLicense' },
            { label: '【企业资质】银行开户许可证识别（仅图片）', value: 'BankAccountLicense' },
            { label: '【企业资质】商标注册证识别（仅图片）', value: 'TradeMarkCertification' },
            { label: '【企业资质】食品生产许可证识别（仅图片）', value: 'FoodProduceLicense' },
            { label: '【企业资质】食品经营许可证识别（仅图片）', value: 'FoodManageLicense' },
            { label: '【企业资质】医疗器械经营许可证识别（仅图片）', value: 'MedicalDeviceManageLicense' },
            { label: '【企业资质】医疗器械生产许可证识别（仅图片）', value: 'MedicalDeviceProduceLicense' },
            {
              label: '【企业资质】第二类医疗器械备案凭证识别（仅图片）',
              value: 'CtwoMedicalDeviceManageLicense'
            },
            { label: '【企业资质】化妆品生产许可证识别（仅图片）', value: 'CosmeticProduceLicense' },
            { label: '【企业资质】国际企业执照识别（图片/PDF）', value: 'InternationalBusinessLicense' },

            // ── 车辆物流识别 ──
            { label: '【车辆物流】行驶证识别（仅图片）', value: 'VehicleLicense' },
            { label: '【车辆物流】驾驶证识别（仅图片）', value: 'DrivingLicense' },
            { label: '【车辆物流】电子面单识别（仅图片）', value: 'Waybill' },
            { label: '【车辆物流】车牌识别（仅图片）', value: 'CarNumber' },
            { label: '【车辆物流】车辆VIN码识别（仅图片）', value: 'CarVinCode' },
            { label: '【车辆物流】机动车注册登记证识别（仅图片）', value: 'VehicleRegistration' },
            { label: '【车辆物流】车辆合格证识别（仅图片）', value: 'VehicleCertification' },

            // ── 教育场景识别 ──
            { label: '【教育场景】数学公式识别（仅图片）', value: 'EduFormula' },
            { label: '【教育场景】口算判题（仅图片）', value: 'EduOralCalculation' },
            { label: '【教育场景】整页试卷识别（仅图片）', value: 'EduPaperOcr' },
            { label: '【教育场景】试卷切题识别（仅图片）', value: 'EduPaperCut' },
            { label: '【教育场景】题目识别（仅图片）', value: 'EduQuestionOcr' },
            { label: '【教育场景】精细版结构化切题（仅图片）', value: 'EduPaperStructed' },

            // ── 小语种识别 ──
            { label: '【小语种】通用多语言识别（仅图片）', value: 'MultiLanguage' },
            { label: '【小语种】英语作文识别（仅图片）', value: 'English' },
            { label: '【小语种】泰语识别（仅图片）', value: 'Thai' },
            { label: '【小语种】日语识别（仅图片）', value: 'Janpanese' },
            { label: '【小语种】韩语识别（仅图片）', value: 'Korean' },
            { label: '【小语种】拉丁语识别（仅图片）', value: 'Latin' },
            { label: '【小语种】俄语识别（仅图片）', value: 'Russian' },

            // ── 医疗场景识别 ──
            { label: '【医疗场景】核酸检测报告识别（仅图片）', value: 'CovidTestReport' }
          ]
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '识别结果 JSON',
          description: '阿里云OCR返回的原始结构化JSON数据',
          valueType: WorkflowIOValueTypeEnum.object
        }
      ]
    }
  ]
});
