// src/services/ValidationService.ts
import { VendorData, VendorType } from "../models/VendorTypes";
import { ErrorsType, ValidateFunction } from "../hooks/useForm";

// Reexport the ErrorsType from useForm
export type ValidationErrors = ErrorsType;

export class ValidationService {
  // Main validation method for the entire form that implements ValidateFunction
  static validateForm: ValidateFunction = (data: any): ValidationErrors => {
    const vendorData = data as unknown as VendorData;
    const errors: ValidationErrors = {
      generalDetails: {},
      tradingTerms: {},
      supplyTerms: {},
      financialTerms: {},
    };

    // Validate General Details if defined
    if (vendorData.generalDetails) {
      ValidationService.validateGeneralDetails(vendorData.generalDetails, errors.generalDetails);
    }

    // Validate Trading Terms based on vendor type if defined
    if (vendorData.tradingTerms && vendorData.generalDetails?.vendorType) {
      ValidationService.validateTradingTerms(
        vendorData.tradingTerms, 
        vendorData.generalDetails.vendorType as VendorType, 
        errors.tradingTerms
      );
    }

    // Validate Supply Terms if defined
    if (vendorData.supplyTerms) {
      ValidationService.validateSupplyTerms(vendorData.supplyTerms, errors.supplyTerms);
    }

    // Validate Financial Terms based on vendor type if defined
    if (vendorData.financialTerms && vendorData.generalDetails?.vendorType) {
      ValidationService.validateFinancialTerms(
        vendorData.financialTerms, 
        vendorData.generalDetails.vendorType as VendorType, 
        errors.financialTerms
      );
    }

    return errors;
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
    if (data.deliveryNotice < 0) {
      errors.deliveryNotice = "Delivery notice cannot be negative";
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