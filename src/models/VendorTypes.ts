// src/models/VendorTypes.ts

// Type for trading entities
export type TradingEntity = string;

// Type for business units
export type BusinessUnit = 
  | "Travel Essentials"
  | "Food Services"
  | "Specialty"
  | "Duty Free"
  | "Finance"
  | "IT";

// Type for vendor types
export type VendorType = 
  | "STOCK" 
  | "OVERHEADS" 
  | "OVERHEADANDSTOCK"
  | "";

// Type for yes/no answers
export type YesNo = "yes" | "no" | "";

// Type for payment terms
export type PaymentTerms = 
  | "20 EOM"
  | "30 DAYS"
  | "60 DAYS"
  | "90 DAYS"
  | "30 EOM"
  | "60 EOM"
  | "90 EOM"
  | "";

// Type for rebate time periods
export type TimePeriod = "month" | "quarter" | "year" | "";

// Type for General Details section
export interface GeneralDetailsData {
  tradingEntities: TradingEntity[];
  vendorHomeCountry: string;
  primaryTradingBusinessUnit: string;
  email: string;
  businessName: string;
  tradingName?: string;
  vendorType: string;
}

// Type for Trading Terms section
export interface TradingTermsData {
  quotesObtained: YesNo;
  quotesObtainedReason?: string;
  quotesPdf: File | null;
  backOrder: YesNo;
}

// Type for Supply Terms section
export interface SupplyTermsData {
  exclusiveSupply: YesNo;
  saleOrReturn: YesNo;
  authRequired: YesNo;
  deliveryNotice: number;
  minOrderValue: number;
  minOrderQuantity: number;
  maxOrderValue: number;
  otherComments?: string;
}

// Type for Financial Terms section
export interface FinancialTermsData {
  paymentTerms: string;
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

// Type for the complete vendor data form
export interface VendorData {
  generalDetails: GeneralDetailsData;
  tradingTerms: TradingTermsData;
  supplyTerms: SupplyTermsData;
  financialTerms: FinancialTermsData;
}

// Type for similar vendor warning
export interface SimilarVendor {
  businessName: string;
  email: string;
  similarity: number; // 0.0 to 1.0
  matchedCriteria: string[];
}