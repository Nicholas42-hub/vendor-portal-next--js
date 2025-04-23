// src/services/ValidationService.ts
import { VendorData, VendorType, SupplierFormData } from "../models/VendorTypes";

// Type for validation errors
type ValidationErrors = {
  [key: string]: string | undefined;
};

export class ValidationService {
  // Main validation method for the entire vendor form
  static validateForm(data: VendorData): any {
    const errors: any = {
      generalDetails: {},
      tradingTerms: {},
      supplyTerms: {},
      financialTerms: {},
    };

    // Validate General Details if defined
    if (data.generalDetails) {
      ValidationService.validateGeneralDetails(data.generalDetails, errors.generalDetails);
    }

    // Validate Trading Terms based on vendor type if defined
    if (data.tradingTerms && data.generalDetails?.vendorType) {
      ValidationService.validateTradingTerms(
        data.tradingTerms, 
        data.generalDetails.vendorType as VendorType, 
        errors.tradingTerms
      );
    }

    // Validate Supply Terms if defined
    if (data.supplyTerms) {
      ValidationService.validateSupplyTerms(data.supplyTerms, errors.supplyTerms);
    }

    // Validate Financial Terms based on vendor type if defined
    if (data.financialTerms && data.generalDetails?.vendorType) {
      ValidationService.validateFinancialTerms(
        data.financialTerms, 
        data.generalDetails.vendorType as VendorType, 
        errors.financialTerms
      );
    }

    return errors;
  }

  // New validation method for the supplier form
  static validateSupplierForm(data: SupplierFormData): ValidationErrors {
    const errors: ValidationErrors = {};

    if (!data.business_name || typeof data.business_name !== 'string' || data.business_name.trim() === '') {
      errors.business_name = 'Business name is required';
    }

    // Trading Name validation (optional)
    if (data.trading_name && typeof data.trading_name === 'string' && data.trading_name.trim() === '') {
      errors.trading_name = 'Trading name cannot be empty if provided';
    }

    // Country validation
    if (!data.country) {
      errors.country = "Country is required";
    }

    // GST Registered validation
    if (!data.gst_registered) {
      errors.gst_registered = "GST registration status is required";
    }

    // Validate Tax ID fields based on country
    if (data.country === "Australia" || data.ANB_GST === "ABN") {
      if (!data.abn) {
        errors.abn = "ABN is required";
      } else if (!/^\d{11}$/.test(data.abn)) {
        errors.abn = "ABN must be exactly 11 digits";
      }
    }

    if (data.country === "New Zealand" || data.ANB_GST === "GST") {
      if (!data.gst) {
        errors.gst = "GST number is required";
      }
    }

    // Address validation - optional but with max length
    if (data.address && data.address.length > 100) {
      errors.address = "Address must be less than 100 characters";
    }

    // Required location fields
    if (typeof data.city !== 'string' || data.city.trim() === '') {
      errors.city = "City is required";
    }

    if (typeof data.state !== 'string' || data.state.trim() === '') {
      errors.state = "State is required";
    }

    if (typeof data.postcode !== 'string' || data.postcode.trim() === '') {
      errors.postcode = "Postcode is required";
    }

    // Contact information validation
    if (!data.primary_contact_email) {
      errors.primary_contact_email = "Primary Contact Email is required";
    } else if (!ValidationService.isValidEmail(data.primary_contact_email)) {
      errors.primary_contact_email = "Please enter a valid email address";
    }

    if (!data.telephone?.trim()) {
      errors.telephone = "Telephone is required";
    }

    if (!data.po_email) {
      errors.po_email = "PO Email is required";
    } else if (!ValidationService.isValidEmail(data.po_email)) {
      errors.po_email = "Please enter a valid email address";
    }

    if (!data.return_order_email) {
      errors.return_order_email = "Return Order Email is required";
    } else if (!ValidationService.isValidEmail(data.return_order_email)) {
      errors.return_order_email = "Please enter a valid email address";
    }

    const tradingEntities = Array.isArray(data.trading_entities) ? data.trading_entities : [];

    // Trading Entities validation
    if (!tradingEntities.length) {
      errors.trading_entities = "At least one Trading Entity must be selected";
    }
  
    // AU/NZ Invoice Currency validation (if trading entities are selected)
    const hasAuEntities = tradingEntities.some(entity => 
      ['ALAW', 'AUDF', 'AUTE', 'AUPG', 'AUAW', 'LSAP'].includes(entity)
    );
    
    const hasNzEntities = tradingEntities.some(entity => 
      ['NZAW', 'NZDF', 'NZTE'].includes(entity)
    );
  
    if (hasAuEntities && !data.au_invoice_currency) {
      errors.au_invoice_currency = "Invoice currency is required for Australian entities";
    }
  
    if (hasNzEntities && !data.nz_invoice_currency) {
      errors.nz_invoice_currency = "Invoice currency is required for New Zealand entities";
    }

    // Payment Method validation
    if (!data.payment_method) {
      errors.payment_method = "Payment Method is required";
    }

    // Bank Transfer validation
    if (data.payment_method === "Bank Transfer") {
      // AU Banking validation
      if (hasAuEntities) {
        if (!data.au_bank_country) {
          errors.au_bank_country = "Bank country is required";
        }
        
        if (!data.au_bank_address?.trim()) {
          errors.au_bank_address = "Bank address is required";
        }
        
        if (!data.au_bank_currency_code) {
          errors.au_bank_currency_code = "Bank currency code is required";
        }
        
        if (!data.au_remittance_email) {
          errors.au_remittance_email = "Remittance email is required";
        } else if (!ValidationService.isValidEmail(data.au_remittance_email)) {
          errors.au_remittance_email = "Please enter a valid email address";
        }
        
        // AU domestic banking
        if (data.au_bank_country === "Australia") {
          if (!data.au_bsb) {
            errors.au_bsb = "BSB is required";
          } else if (!/^\d{6}$/.test(data.au_bsb)) {
            errors.au_bsb = "BSB must be exactly 6 digits";
          }
          
          if (!data.au_account) {
            errors.au_account = "Account number is required";
          } else if (!/^\d{10}$/.test(data.au_account)) {
            errors.au_account = "Account number must be exactly 10 digits";
          }
        }
      }
      
      // NZ Banking validation
      if (hasNzEntities) {
        if (!data.nz_bank_country) {
          errors.nz_bank_country = "Bank country is required";
        }
        
        if (!data.nz_bank_address?.trim()) {
          errors.nz_bank_address = "Bank address is required";
        }
        
        if (!data.nz_bank_currency_code) {
          errors.nz_bank_currency_code = "Bank currency code is required";
        }
        
        if (!data.nz_remittance_email) {
          errors.nz_remittance_email = "Remittance email is required";
        } else if (!ValidationService.isValidEmail(data.nz_remittance_email)) {
          errors.nz_remittance_email = "Please enter a valid email address";
        }
        
        // NZ domestic banking
        if (data.nz_bank_country === "New Zealand") {
          if (!data.nz_bsb) {
            errors.nz_bsb = "BSB is required";
          } else if (!/^\d{6}$/.test(data.nz_bsb)) {
            errors.nz_bsb = "BSB must be exactly 6 digits";
          }
          
          if (!data.nz_account) {
            errors.nz_account = "Account number is required";
          } else if (!/^\d{10}$/.test(data.nz_account)) {
            errors.nz_account = "Account number must be exactly 10 digits";
          }
        }
      }
      
      // Overseas banking validation
      const hasOverseasBank = 
        (data.au_bank_country && data.au_bank_country !== "Australia" && data.au_bank_country !== "New Zealand") ||
        (data.nz_bank_country && data.nz_bank_country !== "Australia" && data.nz_bank_country !== "New Zealand");

      if (hasOverseasBank) {
        if (!data.overseas_iban_switch) {
          errors.overseas_iban_switch = "Please select IBAN or SWIFT";
        } else {
          if (data.overseas_iban_switch === "IBAN" && !data.overseas_iban) {
            errors.overseas_iban = "IBAN is required";
          }
          
          if (data.overseas_iban_switch === "SWIFT" && !data.overseas_swift) {
            errors.overseas_swift = "SWIFT is required";
          }
        }
      }
    }
    
    // BPay validation
    if (data.payment_method === "Bpay") {
      if (!data.biller_code) {
        errors.biller_code = "Biller code is required";
      } else if (!/^\d+$/.test(data.biller_code)) {
        errors.biller_code = "Biller code must contain only numbers";
      }
      
      if (!data.ref_code) {
        errors.ref_code = "Reference code is required";
      } else if (!/^\d+$/.test(data.ref_code)) {
        errors.ref_code = "Reference code must contain only numbers";
      }
    }
    
    // Terms agreement validation
    if (!data.iAgree) {
      errors.iAgree = "You must agree to the terms and conditions";
    }

    return errors;
  }

  // Validate individual supplier form field
  static validateSupplierFormField(fieldName: string, value: any, data: SupplierFormData): string | undefined {
    // Create a temporary errors object to hold validation result
    const errors: { [key: string]: string | undefined } = {};
    
    switch (fieldName) {
      case "business_name":
        if (!value || typeof value !== 'string' || value.trim() === '') {
          return 'Business name is required';
        }
        break;
        
      case "trading_name":
        if (value && typeof value === 'string' && value.trim() === '') {
          return 'Trading name cannot be empty if provided';
        }
        break;
        
      case "country":
        if (!value) {
          return 'Country is required';
        }
        break;
        
      case "gst_registered":
        if (!value) {
          return 'GST registration status is required';
        }
        break;
        
      case "abn":
        if (data.country === "Australia" || data.ANB_GST === "ABN") {
          if (!value) {
            return 'ABN is required';
          } else if (!/^\d{11}$/.test(value)) {
            return 'ABN must be exactly 11 digits';
          }
        }
        break;
        
      case "gst":
        if (data.country === "New Zealand" || data.ANB_GST === "GST") {
          if (!value) {
            return 'GST number is required';
          }
        }
        break;
        
      case "address":
        if (value && value.length > 100) {
          return 'Address must be less than 100 characters';
        }
        break;
        
      case "city":
        if (typeof value !== 'string' || value.trim() === '') {
          return 'City is required';
        }
        break;
        
      case "state":
        if (typeof value !== 'string' || value.trim() === '') {
          return 'State is required';
        }
        break;
        
      case "postcode":
        if (typeof value !== 'string' || value.trim() === '') {
          return 'Postcode is required';
        }
        break;
        
      case "primary_contact_email":
        if (!value) {
          return 'Primary Contact Email is required';
        } else if (!this.isValidEmail(value)) {
          return 'Please enter a valid email address';
        }
        break;
        
      case "telephone":
        if (!value?.trim()) {
          return 'Telephone is required';
        }
        break;
        
      case "po_email":
        if (!value) {
          return 'PO Email is required';
        } else if (!this.isValidEmail(value)) {
          return 'Please enter a valid email address';
        }
        break;
        
      case "return_order_email":
        if (!value) {
          return 'Return Order Email is required';
        } else if (!this.isValidEmail(value)) {
          return 'Please enter a valid email address';
        }
        break;
        
      case "trading_entities":
        const tradingEntities = Array.isArray(value) ? value : [];
        if (!tradingEntities.length) {
          return 'At least one Trading Entity must be selected';
        }
        break;
        
      case "au_invoice_currency":
        // Check if there are AU entities before validating
        const hasAuEntities = Array.isArray(data.trading_entities) && 
          data.trading_entities.some(id => ['ALAW', 'AUDF', 'AUTE', 'AUPG', 'AUAW', 'LSAP'].includes(id));
          
        if (hasAuEntities && !value) {
          return 'Invoice currency is required for Australian entities';
        }
        break;
        
      case "nz_invoice_currency":
        // Check if there are NZ entities before validating
        const hasNzEntities = Array.isArray(data.trading_entities) &&
          data.trading_entities.some(id => ['NZAW', 'NZDF', 'NZTE'].includes(id));
          
        if (hasNzEntities && !value) {
          return 'Invoice currency is required for New Zealand entities';
        }
        break;
        
      case "payment_method":
        if (!value) {
          return 'Payment Method is required';
        }
        break;
        
      // Add more field validations as needed...
        
      case "iAgree":
        if (!value) {
          return 'You must agree to the terms and conditions';
        }
        break;
    }
    
    return undefined; // No error
  }

  // Validate General Details section
  private static validateGeneralDetails(
    data: VendorData["generalDetails"], 
    errors: { [field: string]: string | undefined }
  ) {
    // Required fields
    if (!data.vendorHomeCountry) {
      errors.vendorHomeCountry = "Vendor Home Country is required";
    }

    if (!data.primaryTradingBusinessUnit) {
      errors.primaryTradingBusinessUnit = "Primary Trading Business Unit is required";
    }

    if (!data.email) {
      errors.email = "Email is required";
    } else if (!ValidationService.isValidEmail(data.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!data.businessName) {
      errors.businessName = "Business Name is required";
    }

    if (!data.vendorType) {
      errors.vendorType = "Vendor Type is required";
    }

    // Trading entities (at least one must be selected)
    if (data.tradingEntities.length === 0) {
      errors.tradingEntities = "At least one Trading Entity must be selected";
    }
  }

  // Validate Trading Terms section
  private static validateTradingTerms(
    data: VendorData["tradingTerms"], 
    vendorType: VendorType, 
    errors: { [field: string]: string | undefined }
  ) {
    // Validate quotes only for OVERHEADS or OVERHEADANDSTOCK
    if (vendorType === "OVERHEADS" || vendorType === "OVERHEADANDSTOCK") {
      if (!data.quotesObtained) {
        errors.quotesObtained = "Please specify if quotes were obtained";
      } else if (data.quotesObtained === "yes") {
        // If quotes were obtained, the PDF should be provided
        if (!data.quotesPdf) {
          errors.quotesPdf = "Please upload quotes PDF";
        }
      } else if (data.quotesObtained === "no") {
        // If quotes were not obtained, a reason should be provided
        if (!data.quotesObtainedReason) {
          errors.quotesObtainedReason = "Please provide a reason why quotes were not obtained";
        }
      }
    }

    // Back Order validation for STOCK or OVERHEADANDSTOCK
    if (vendorType === "STOCK" || vendorType === "OVERHEADANDSTOCK") {
      if (!data.backOrder) {
        errors.backOrder = "Please specify if back orders are allowed";
      }
    }
  }

  // Validate Supply Terms section
  private static validateSupplyTerms(
    data: VendorData["supplyTerms"], 
    errors: { [field: string]: string | undefined }
  ) {
    // Required fields
    if (!data.exclusiveSupply) {
      errors.exclusiveSupply = "Please specify if this is an exclusive supply";
    }

    if (!data.saleOrReturn) {
      errors.saleOrReturn = "Please specify if this is a sale or return";
    }

    if (!data.authRequired) {
      errors.authRequired = "Please specify if authorization is required for returns";
    }

    // Numeric fields
    if (data.delivery_notice < 0) {
      errors.delivery_notice = "Delivery notice cannot be negative";
    }

    if (data.minOrderValue < 0) {
      errors.minOrderValue = "Minimum order value cannot be negative";
    }

    if (data.minOrderQuantity < 0) {
      errors.minOrderQuantity = "Minimum order quantity cannot be negative";
    }

    if (data.maxOrderValue < 0) {
      errors.maxOrderValue = "Maximum order value cannot be negative";
    }

    // Validate maxOrderValue > minOrderValue if both are provided
    if (data.maxOrderValue > 0 && data.minOrderValue > 0 && data.maxOrderValue < data.minOrderValue) {
      errors.maxOrderValue = "Maximum order value must be greater than minimum order value";
    }
  }

  // Validate Financial Terms section
  private static validateFinancialTerms(
    data: VendorData["financialTerms"], 
    vendorType: VendorType, 
    errors: { [field: string]: string | undefined }
  ) {
    // Required fields
    if (!data.paymentTerms) {
      errors.paymentTerms = "Payment terms are required";
    }

    // Order Expiry Days - only for STOCK or OVERHEADANDSTOCK
    if (vendorType === "STOCK" || vendorType === "OVERHEADANDSTOCK") {
      if (data.orderExpiryDays <= 0) {
        errors.orderExpiryDays = "Order expiry days must be greater than 0";
      }

      if (!data.grossMargin) {
        errors.grossMargin = "Gross margin is required for stock vendors";
      }
    }

    // Invoice Discount
    if (!data.invoiceDiscount) {
      errors.invoiceDiscount = "Please specify if there is an invoice discount";
    } else if (data.invoiceDiscount === "yes" && !data.invoiceDiscountValue) {
      errors.invoiceDiscountValue = "Invoice discount value is required";
    }

    // Settlement Discount
    if (!data.settlementDiscount) {
      errors.settlementDiscount = "Please specify if there is a settlement discount";
    } else if (data.settlementDiscount === "yes") {
      if (!data.settlementDiscountValue) {
        errors.settlementDiscountValue = "Settlement discount value is required";
      }
      if (!data.settlementDiscountDays) {
        errors.settlementDiscountDays = "Settlement discount days are required";
      }
    }

    // Rebates - only for STOCK or OVERHEADANDSTOCK
    if (vendorType === "STOCK" || vendorType === "OVERHEADANDSTOCK") {
      // Flat Rebate
      if (!data.flatRebate) {
        errors.flatRebate = "Please specify if there is a flat rebate";
      } else if (data.flatRebate === "yes") {
        if (!data.flatRebatePercent && !data.flatRebateDollar) {
          errors.flatRebatePercent = "Either percent or dollar value is required";
          errors.flatRebateDollar = "Either percent or dollar value is required";
        }
        if (!data.flatRebateTerm) {
          errors.flatRebateTerm = "Flat rebate term is required";
        }
      }

      // Growth Rebate
      if (!data.growthRebate) {
        errors.growthRebate = "Please specify if there is a growth rebate";
      } else if (data.growthRebate === "yes") {
        if (!data.growthRebatePercent && !data.growthRebateDollar) {
          errors.growthRebatePercent = "Either percent or dollar value is required";
          errors.growthRebateDollar = "Either percent or dollar value is required";
        }
        if (!data.growthRebateTerm) {
          errors.growthRebateTerm = "Growth rebate term is required";
        }
      }

      // Marketing Rebate
      if (!data.marketingRebate) {
        errors.marketingRebate = "Please specify if there is a marketing rebate";
      } else if (data.marketingRebate === "yes") {
        if (!data.marketingRebatePercent && !data.marketingRebateDollar) {
          errors.marketingRebatePercent = "Either percent or dollar value is required";
          errors.marketingRebateDollar = "Either percent or dollar value is required";
        }
        if (!data.marketingRebateTerm) {
          errors.marketingRebateTerm = "Marketing rebate term is required";
        }
      }
    }

    // Promotional Fund
    if (data.promotionalFund === "yes" && !data.promotionalFundValue) {
      errors.promotionalFundValue = "Promotional fund value is required";
    }
  }

  // Helper method to validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  }
}