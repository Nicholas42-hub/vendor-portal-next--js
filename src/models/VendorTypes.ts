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

// Yes/No options
export const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// Type for payment terms
export type payment_terms = 
  | "20 EOM"
  | "30 DAYS"
  | "60 DAYS"
  | "90 DAYS"
  | "30 EOM"
  | "60 EOM"
  | "90 EOM"
  | "";

// Business unit options
export const businessUnitOptions = [
  { value: "", label: "Select an option", disabled: true },
  { value: "Travel Essentials", label: "Travel Essentials" },
  { value: "Food Services", label: "Food Services" },
  { value: "Specialty", label: "Specialty" },
  { value: "Duty Free", label: "Duty Free" },
  { value: "Finance", label: "Finance" },
  { value: "IT", label: "IT" },
];

// Type for rebate time periods
export type TimePeriod = "month" | "quarter" | "year" | "";

// Vendor type options
export const vendorTypeOptions = [
  { value: "", label: "Select an option", disabled: true },
  { value: "STOCK", label: "Stock" },
  { value: "OVERHEADS", label: "Overheads" },
  { value: "OVERHEADANDSTOCK", label: "Overhead and Stock" },
];

// Currencies list
export const currencies = [
  { value: "AUD", label: "AUD" },
  { value: "NZD", label: "NZD" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "CNY", label: "CNY" },
];

// Trading entities data
export const tradingEntities: Array<{ id: TradingEntity; label: string }> = [
  { id: "ALAW", label: "The Trustee for Lagardere / AWPL Trust (ALAW)" },
  {
    id: "AUDF",
    label: "Duty Free Stores Australia Pty Ltd (AUDF) (CNS T1 stores only)",
  },
  { id: "AUTE", label: "Newslink Pty Ltd (AUTE) (CNS T1 stores only)" },
  { id: "NZAW", label: "AWPL Retail Solutions Ltd (NZAW)" },
  { id: "AUPG", label: "The Purely Group Pty Ltd (AUPG)" },
  { id: "AUAW", label: "The Trustee for AWPL Tango Trust (AUAW)" },
  { id: "NZDF", label: "Duty Free Stores Wellington Ltd (NZDF)" },
  { id: "NZTE", label: "LS Travel Retail New Zealand Ltd (NZTE)" },
  { id: "LSAP", label: "Lagardere Services Asia Pacific Pty Ltd (LSAP)" },
];

// Type for General Details section - updated to match database fields
export interface GeneralDetailsData {
  tradingEntities: TradingEntity[];
  vendor_home_country: string;
  primary_trading_business_unit: string;
  email: string;
  business_name: string;
  trading_name?: string;
  vendor_type: string;
  contact_person?: string;
  contact_phone?: string;
  website_url?: string;
  postal_address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  is_gst_registered?: string;
  abn?: string;
  gst?: string;
}

// Type for Trading Terms section - updated to match database fields
export interface TradingTermsData {
  quotes_obtained: YesNo;
  quotes_obtained_reason?: string;
  quotes_pdf_url?: File | null;
  back_order: YesNo;
}

// Type for Supply Terms section - updated to match database fields
export interface SupplyTermsData {
  exclusive_supply: YesNo;
  sale_or_return: YesNo;
  auth_required: YesNo;
  delivery_notice: number;
  min_order_value: number;
  min_order_quantity: number;
  max_order_value: number;
  other_comments?: string;
}

// Type for Financial Terms section - updated to match database fields
export interface FinancialTermsData {
  payment_terms: string;
  order_expiry_days: number;
  gross_margin: string;
  invoice_discount: YesNo;
  invoice_discount_value?: string;
  settlement_discount: YesNo;
  settlement_discount_value?: string;
  settlement_discount_days?: string;
  flat_rebate: YesNo;
  flat_rebate_percent?: string;
  flat_rebate_dollar?: string;
  flat_rebate_term?: TimePeriod;
  growth_rebate: YesNo;
  growth_rebate_percent?: string;
  growth_rebate_dollar?: string;
  growth_rebate_term?: TimePeriod;
  marketing_rebate: YesNo;
  marketing_rebate_percent?: string;
  marketing_rebate_dollar?: string;
  marketing_rebate_term?: TimePeriod;
  promotional_fund: YesNo;
  promotional_fund_value?: string;
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
  business_name: string;
  email: string;
  similarity: number; // 0.0 to 1.0
  matchedCriteria: string[];
}

// SupplierFormData with field names aligned to database
export interface SupplierFormData {
  business_name: string;
  trading_name: string;
  country: string;
  is_gst_registered: string;
  abn?: string;
  gst?: string;
  postal_address: string; // Changed from address to postal_address
  website_url: string; // Changed from website to website_url
  city: string;
  state: string;
  postcode: string;
  primary_contact_email: string;
  contact_phone: string; // Changed from telephone to contact_phone
  po_email: string;
  return_order_email: string;
  trading_entities: string[];
  has_tax_id: string;
  ANB_GST: string;
  // Payment method
  payment_method: string;

  // AU specific fields
  au_invoice_currency?: string;
  au_bank_country?: string;
  au_bank_name?: string; // Added to match database
  au_bank_address?: string;
  au_bank_currency_code?: string;
  au_bank_clearing_code?: string;
  au_remittance_email?: string;
  au_bsb?: string;
  au_account?: string;

  // NZ specific fields
  nz_invoice_currency?: string;
  nz_bank_country?: string;
  nz_bank_name?: string; // Added to match database
  nz_bank_address?: string;
  nz_bank_currency_code?: string;
  nz_bank_clearing_code?: string;
  nz_remittance_email?: string;
  nz_bsb?: string;
  nz_account?: string;

  // Overseas banking
  overseas_iban_switch?: string;
  overseas_iban?: string;
  overseas_swift?: string;

  // BPay
  biller_code?: string;
  ref_code?: string;

  // Terms agreement
  iAgree: boolean;
}

// Time period options
export const timePeriodOptions = [
  { value: "", label: "Month/Quarter/Year", disabled: true },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

// Payment terms options
export const payment_termsOptions = [
  { value: "", label: "Select an option", disabled: true },
  { value: "20 EOM", label: "20 EOM" },
  { value: "30 DAYS", label: "30 Days" },
  { value: "60 DAYS", label: "60 Days" },
  { value: "90 DAYS", label: "90 Days" },
  { value: "30 EOM", label: "30 EOM" },
  { value: "60 EOM", label: "60 EOM" },
  { value: "90 EOM", label: "90 EOM" },
];


