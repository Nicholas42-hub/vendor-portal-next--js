export type TradingEntity = 
  | 'ALAW' 
  | 'AUDF' 
  | 'AUTE' 
  | 'NZAW' 
  | 'AUPG' 
  | 'AUAW' 
  | 'NZDF' 
  | 'NZTE' 
  | 'LSAP';

export type Country = string;

export type BusinessUnit = 
  | 'Travel Essentials' 
  | 'Food Services' 
  | 'Specialty' 
  | 'Duty Free'
  | 'Finance'
  | 'IT';

export type VendorType = 'STOCK' | 'OVERHEADS' | 'OVERHEADANDSTOCK';

export type YesNo = 'yes' | 'no' | '';

export type PaymentTerms = 
  | '20 EOM' 
  | '30 DAYS' 
  | '60 DAYS' 
  | '90 DAYS' 
  | '30 EOM' 
  | '60 EOM' 
  | '90 EOM'
  | '';

export type TimePeriod = 'month' | 'quarter' | 'year' | '';

export interface GeneralDetails {
  tradingEntities: TradingEntity[];
  vendorHomeCountry: Country;
  primaryTradingBusinessUnit: BusinessUnit;
  email: string;
  businessName: string;
  vendorType: VendorType;
  childVendor?: YesNo;
  parentVendor?: string;
}

export interface TradingTerms {
  quotesObtained: YesNo;
  quotesObtainedReason?: string;
  backOrder?: YesNo;
}

export interface SupplyTerms {
  exclusiveSupply: YesNo;
  saleOrReturn: YesNo;
  authRequired: YesNo;
  deliveryNotice: number;
  minOrderValue: number;
  minOrderQuantity: number;
  maxOrderValue: number;
  otherComments?: string;
}

export interface FinancialTerms {
  paymentTerms: PaymentTerms;
  orderExpiryDays: number;
  grossMargin: string;
  invoiceDiscount: YesNo;
  invoiceDiscountValue?: string;
  settlementDiscount: YesNo;
  settlementDiscountValue?: string;
  settlementDiscountDays?: string;
  flatRebate: YesNo;
  flatRebatePercent?: string;
  flatRebateDollar?: string;
  flatRebateTerm?: TimePeriod;
  growthRebate: YesNo;
  growthRebatePercent?: string;
  growthRebateDollar?: string;
  growthRebateTerm?: TimePeriod;
  marketingRebate: YesNo;
  marketingRebatePercent?: string;
  marketingRebateDollar?: string;
  marketingRebateTerm?: TimePeriod;
  promotionalFund: YesNo;
  promotionalFundValue?: string;
}

export interface VendorData {
  generalDetails: GeneralDetails;
  tradingTerms: TradingTerms;
  supplyTerms: SupplyTerms;
  financialTerms: FinancialTerms;
}

export interface SimilarVendor {
  businessName: string;
  email: string;
  similarity: number;
  matchedCriteria: string[];
}