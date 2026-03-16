import { describe, it, expect } from 'vitest';
import { InputType } from '../src';

describe('aliOcr Input Validation', () => {
  const validBase = {
    accessKeyId: 'test-id',
    accessKeySecret: 'test-secret',
    fileUrl: 'https://example.com/invoice.jpg',
    ocrType: 'General' as const
  };

  it('should reject empty accessKeyId', () => {
    expect(() => InputType.parse({ ...validBase, accessKeyId: '' })).toThrow();
  });

  it('should reject empty accessKeySecret', () => {
    expect(() => InputType.parse({ ...validBase, accessKeySecret: '' })).toThrow();
  });

  it('should reject invalid fileUrl', () => {
    expect(() => InputType.parse({ ...validBase, fileUrl: 'not-a-url' })).toThrow();
  });

  it('should reject unknown ocrType', () => {
    expect(() => InputType.parse({ ...validBase, ocrType: 'UnknownType' as never })).toThrow();
  });

  it('should accept all defined ocrTypes', () => {
    const types = [
      'GeneralStructure',
      'Advanced', 'General', 'Handwriting', 'Basic', 'TableOcr', 'DocumentStructure',
      'Idcard', 'ChinesePassport', 'Passport', 'Household', 'EstateCertification',
      'BankCard', 'BirthCertification', 'ExitEntryPermitToMainland', 'ExitEntryPermitToHK',
      'HKIdcard', 'SocialSecurityCardVersionII', 'InternationalIdcard',
      'MixedInvoices', 'Invoice', 'CarInvoice', 'QuotaInvoice', 'AirItinerary',
      'TrainInvoice', 'TaxiInvoice', 'RollTicket', 'BankAcceptance', 'BusShipTicket',
      'NonTaxInvoice', 'CommonPrintedInvoice', 'HotelConsume', 'PaymentRecord',
      'PurchaseRecord', 'RideHailingItinerary', 'ShoppingReceipt', 'TollInvoice',
      'TaxClearanceCertificate', 'UsedCarInvoice',
      'BusinessLicense', 'BankAccountLicense', 'TradeMarkCertification',
      'FoodProduceLicense', 'FoodManageLicense', 'MedicalDeviceManageLicense',
      'MedicalDeviceProduceLicense', 'CtwoMedicalDeviceManageLicense',
      'CosmeticProduceLicense', 'InternationalBusinessLicense',
      'VehicleLicense', 'DrivingLicense', 'Waybill', 'CarNumber', 'CarVinCode',
      'VehicleRegistration', 'VehicleCertification',
      'EduFormula', 'EduOralCalculation', 'EduPaperOcr', 'EduPaperCut',
      'EduQuestionOcr', 'EduPaperStructed',
      'MultiLanguage', 'English', 'Thai', 'Janpanese', 'Korean', 'Latin', 'Russian',
      'CovidTestReport'
    ];
    for (const ocrType of types) {
      expect(() => InputType.parse({ ...validBase, ocrType })).not.toThrow();
    }
  });

  it('should parse valid input and return correct values', () => {
    const result = InputType.parse({ ...validBase, ocrType: 'Invoice' });
    expect(result.accessKeyId).toBe('test-id');
    expect(result.ocrType).toBe('Invoice');
  });
});
