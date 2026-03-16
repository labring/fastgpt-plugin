import { z } from 'zod';
import { createHmac, createHash } from 'node:crypto';

const OCR_TYPES = [
  'GeneralStructure',
  'Advanced',
  'General',
  'Handwriting',
  'Basic',
  'TableOcr',
  'DocumentStructure',
  'Idcard',
  'ChinesePassport',
  'Passport',
  'Household',
  'EstateCertification',
  'BankCard',
  'BirthCertification',
  'ExitEntryPermitToMainland',
  'ExitEntryPermitToHK',
  'HKIdcard',
  'SocialSecurityCardVersionII',
  'InternationalIdcard',
  'MixedInvoices',
  'Invoice',
  'CarInvoice',
  'QuotaInvoice',
  'AirItinerary',
  'TrainInvoice',
  'TaxiInvoice',
  'RollTicket',
  'BankAcceptance',
  'BusShipTicket',
  'NonTaxInvoice',
  'CommonPrintedInvoice',
  'HotelConsume',
  'PaymentRecord',
  'PurchaseRecord',
  'RideHailingItinerary',
  'ShoppingReceipt',
  'TollInvoice',
  'TaxClearanceCertificate',
  'UsedCarInvoice',
  'BusinessLicense',
  'BankAccountLicense',
  'TradeMarkCertification',
  'FoodProduceLicense',
  'FoodManageLicense',
  'MedicalDeviceManageLicense',
  'MedicalDeviceProduceLicense',
  'CtwoMedicalDeviceManageLicense',
  'CosmeticProduceLicense',
  'InternationalBusinessLicense',
  'VehicleLicense',
  'DrivingLicense',
  'Waybill',
  'CarNumber',
  'CarVinCode',
  'VehicleRegistration',
  'VehicleCertification',
  'EduFormula',
  'EduOralCalculation',
  'EduPaperOcr',
  'EduPaperCut',
  'EduQuestionOcr',
  'EduPaperStructed',
  'MultiLanguage',
  'English',
  'Thai',
  'Janpanese',
  'Korean',
  'Latin',
  'Russian',
  'CovidTestReport'
] as const;

export const InputType = z.object({
  accessKeyId: z.string().min(1, 'AccessKey ID is required'),
  accessKeySecret: z.string().min(1, 'AccessKey Secret is required'),
  fileUrl: z.string().url('Invalid file URL'),
  ocrType: z.enum(OCR_TYPES)
});

export const OutputType = z.object({
  result: z.record(z.string(), z.unknown())
});

function percentEncode(s: string): string {
  return encodeURIComponent(s)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function sign(
  accessKeyId: string,
  accessKeySecret: string,
  params: Record<string, string>
): string {
  const sortedKeys = Object.keys(params).sort();
  const canonicalQuery = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');

  const stringToSign = `POST&${percentEncode('/')}&${percentEncode(canonicalQuery)}`;
  const signingKey = `${accessKeySecret}&`;

  return createHmac('sha1', signingKey).update(stringToSign).digest('base64');
}

export async function tool({
  accessKeyId,
  accessKeySecret,
  fileUrl,
  ocrType
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const endpoint = 'https://ocr-api.cn-hangzhou.aliyuncs.com';
  const action = `Recognize${ocrType}`;
  const version = '2021-07-07';

  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const nonce = createHash('md5').update(`${Date.now()}${Math.random()}`).digest('hex');

  const params: Record<string, string> = {
    Action: action,
    Version: version,
    AccessKeyId: accessKeyId,
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: nonce,
    Timestamp: timestamp,
    Format: 'JSON',
    Url: fileUrl
  };

  params.Signature = sign(accessKeyId, accessKeySecret, params);

  const body = new URLSearchParams(params).toString();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok || (data['Code'] && data['Code'] !== 0)) {
    const msg =
      (data['Message'] as string | undefined) ||
      (data['Msg'] as string | undefined) ||
      `HTTP ${response.status}`;
    throw new Error(`阿里云OCR识别失败 [${action}]: ${msg}`);
  }

  return { result: data };
}
