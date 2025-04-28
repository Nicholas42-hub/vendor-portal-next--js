// src/services/ValidationService.ts - Enhanced version
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
      bankDetails: {} // Add this to match your ErrorsType structure
    };

    // Validate General Details
    ValidationService.validateGeneralDetails(data.generalDetails, errors.generalDetails);

    // Vendor type helps determine which validations to apply
    const vendorType = data.generalDetails?.vendor_type as VendorType;

    // Validate Trading Terms based on vendor type
    ValidationService.validateTradingTerms(
      data.tradingTerms, 
      vendorType, 
      errors.tradingTerms
    );

    // Validate Supply Terms
    ValidationService.validateSupplyTerms(data.supplyTerms, errors.supplyTerms);

    // Validate Financial Terms based on vendor type
    ValidationService.validateFinancialTerms(
      data.financialTerms, 
      vendorType, 
      errors.financialTerms
    );

    // Log validation results for debugging
    console.log("Validation results:", {
      generalDetailsErrors: Object.keys(errors.generalDetails).length > 0,
      tradingTermsErrors: Object.keys(errors.tradingTerms).length > 0,
      supplyTermsErrors: Object.keys(errors.supplyTerms).length > 0,
      financialTermsErrors: Object.keys(errors.financialTerms).length > 0
    });

    return errors;
  }

  // Validate General Details section
  static validateGeneralDetails(
    data: VendorData["generalDetails"], 
    errors: { [field: string]: string | undefined }
  ) {
    // Required fields
    if (!data.vendor_home_country) {
      errors.vendor_home_country = "Vendor Home Country is required";
    }

    if (!data.primary_trading_business_unit) {
      errors.primary_trading_business_unit = "Primary Trading Business Unit is required";
    }

    if (!data.email) {
      errors.email = "Email is required";
    } else if (!ValidationService.isValidEmail(data.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!data.business_name) {
      errors.business_name = "Business Name is required";
    }

    if (!data.vendor_type) {
      errors.vendor_type = "Vendor Type is required";
    }

    // Trading entities (at least one must be selected)
    if (!data.tradingEntities || data.tradingEntities.length === 0) {
      errors.tradingEntities = "At least one Trading Entity must be selected";
    }
  }

  // Validate Trading Terms section
  static validateTradingTerms(
    data: VendorData["tradingTerms"], 
    vendorType: VendorType, 
    errors: { [field: string]: string | undefined }
  ) {
    // Add base validation regardless of vendorType
    // This ensures errors are shown even when vendorType is undefined

    
    // For empty forms, vendorType might be undefined
    if (!vendorType) {
      errors.vendor_type_missing = "Vendor type must be selected to continue";
      return; // Exit early since other validations depend on vendor type
    }

    // Validate quotes only for OVERHEADS or OVERHEADANDSTOCK
    if (vendorType === "OVERHEADS" || vendorType === "OVERHEADANDSTOCK") {
      if (!data.quotes_obtained) {
        errors.quotes_obtained = "Please specify if quotes were obtained";
      } else if (data.quotes_obtained === "yes") {
        // If quotes were obtained, the PDF should be provided
        if (!data.quotes_pdf_url) {
          errors.quotes_pdf_url = "Please upload quotes PDF";
        }
      } else if (data.quotes_obtained === "no") {
        // If quotes were not obtained, a reason should be provided
        if (!data.quotes_obtained_reason) {
          errors.quotes_obtained_reason = "Please provide a reason why quotes were not obtained";
        }
      }
    }

    // Back Order validation for STOCK or OVERHEADANDSTOCK is already covered by the base validation above
  }

  // Validate Supply Terms section
  static validateSupplyTerms(
    data: VendorData["supplyTerms"], 
    errors: { [field: string]: string | undefined }
  ) {
    // Required fields
    if (!data.exclusive_supply) {
      errors.exclusive_supply = "Please specify if this is an exclusive supply";
    }

    if (!data.sale_or_return) {
      errors.sale_or_return = "Please specify if this is a sale or return";
    }

    if (!data.auth_required) {
      errors.auth_required = "Please specify if authorization is required for returns";
    }

    // Numeric fields must be present and valid
    if (data.delivery_notice === undefined || data.delivery_notice === null) {
      errors.delivery_notice = "Lead time in working days is required";
    } else if (data.delivery_notice < 0) {
      errors.delivery_notice = "Delivery notice cannot be negative";
    }

    if (data.min_order_value === undefined || data.min_order_value === null) {
      errors.min_order_value = "Minimum order value is required";
    } else if (data.min_order_value < 0) {
      errors.min_order_value = "Minimum order value cannot be negative";
    }

    if (data.min_order_quantity === undefined || data.min_order_quantity === null) {
      errors.min_order_quantity = "Minimum order quantity is required";
    } else if (data.min_order_quantity < 0) {
      errors.min_order_quantity = "Minimum order quantity cannot be negative";
    }

    if (data.max_order_value === undefined || data.max_order_value === null) {
      errors.max_order_value = "Maximum order value is required";
    } else if (data.max_order_value < 0) {
      errors.max_order_value = "Maximum order value cannot be negative";
    }

    // Validate max_order_value > min_order_value if both are provided
    if (data.max_order_value > 0 && data.min_order_value > 0 && data.max_order_value < data.min_order_value) {
      errors.max_order_value = "Maximum order value must be greater than minimum order value";
    }
  }

  // Validate Financial Terms section
  static validateFinancialTerms(
    data: VendorData["financialTerms"], 
    vendorType: VendorType, 
    errors: { [field: string]: string | undefined }
  ) {
    // Required fields for all vendor types
    if (!data.payment_terms) {
      errors.payment_terms = "Payment terms are required";
    }

    // Invoice Discount
    if (!data.invoice_discount) {
      errors.invoice_discount = "Please specify if there is an invoice discount";
    } else if (data.invoice_discount === "yes" && !data.invoice_discount_value) {
      errors.invoice_discount_value = "Invoice discount value is required";
    }

    // Settlement Discount
    if (!data.settlement_discount) {
      errors.settlement_discount = "Please specify if there is a settlement discount";
    } else if (data.settlement_discount === "yes") {
      if (!data.settlement_discount_value) {
        errors.settlement_discount_value = "Settlement discount value is required";
      }
      if (!data.settlement_discount_days) {
        errors.settlement_discount_days = "Settlement discount days are required";
      }
    }

    // Order Expiry Days - only for STOCK or OVERHEADANDSTOCK
    if (vendorType === "STOCK" || vendorType === "OVERHEADANDSTOCK") {
      if (data.order_expiry_days === undefined || data.order_expiry_days === null || data.order_expiry_days <= 0) {
        errors.order_expiry_days = "Order expiry days must be greater than 0";
      }

      if (!data.gross_margin) {
        errors.gross_margin = "Gross margin is required for stock vendors";
      }
    
      // Flat Rebate
      if (!data.flat_rebate) {
        errors.flat_rebate = "Please specify if there is a flat rebate";
      } else if (data.flat_rebate === "yes") {
        if (!data.flat_rebate_percent && !data.flat_rebate_dollar) {
          errors.flat_rebate_percent = "Either percent or dollar value is required";
          errors.flat_rebate_dollar = "Either percent or dollar value is required";
        }
        if (!data.flat_rebate_term) {
          errors.flat_rebate_term = "Flat rebate term is required";
        }
      }

      // Growth Rebate
      if (!data.growth_rebate) {
        errors.growth_rebate = "Please specify if there is a growth rebate";
      } else if (data.growth_rebate === "yes") {
        if (!data.growth_rebate_percent && !data.growth_rebate_dollar) {
          errors.growth_rebate_percent = "Either percent or dollar value is required";
          errors.growth_rebate_dollar = "Either percent or dollar value is required";
        }
        if (!data.growth_rebate_term) {
          errors.growth_rebate_term = "Growth rebate term is required";
        }
      }

      // Marketing Rebate
      if (!data.marketing_rebate) {
        errors.marketing_rebate = "Please specify if there is a marketing rebate";
      } else if (data.marketing_rebate === "yes") {
        if (!data.marketing_rebate_percent && !data.marketing_rebate_dollar) {
          errors.marketing_rebate_percent = "Either percent or dollar value is required";
          errors.marketing_rebate_dollar = "Either percent or dollar value is required";
        }
        if (!data.marketing_rebate_term) {
          errors.marketing_rebate_term = "Marketing rebate term is required";
        }
      }
    }

    // Promotional Fund
    if (data.promotional_fund === "yes" && !data.promotional_fund_value) {
      errors.promotional_fund_value = "Promotional fund value is required";
    }
  }

  // Helper method to validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  }
}