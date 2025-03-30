import { VendorData } from '../models/VendorTypes';

type ValidationErrors = {
  [K in keyof VendorData]: {
    [Field in keyof VendorData[K]]?: string;
  };
};

export class ValidationService {
  /**
   * Validate supply terms section
   */
  private static validateSupplyTerms(supplyTerms: VendorData['supplyTerms']): ValidationErrors['supplyTerms'] {
    const errors: ValidationErrors['supplyTerms'] = {};

    // Exclusive supply validation
    if (!supplyTerms.exclusiveSupply) {
      errors.exclusiveSupply = 'Please select whether this is an exclusive supply';
    }

    // Sale or return validation
    if (!supplyTerms.saleOrReturn) {
      errors.saleOrReturn = 'Please select whether this is sale or return';
    }

    // Auth required for returns validation
    if (!supplyTerms.authRequired) {
      errors.authRequired = 'Please select whether authorization is required for returns';
    }

    // Delivery notice validation
    if (!supplyTerms.deliveryNotice) {
      errors.deliveryNotice = 'Lead time is required';
    } else if (supplyTerms.deliveryNotice < 0) {
      errors.deliveryNotice = 'Lead time cannot be negative';
    }

    // Min order value validation
    if (!supplyTerms.minOrderValue) {
      errors.minOrderValue = 'Minimum order value is required';
    } else if (supplyTerms.minOrderValue < 0) {
      errors.minOrderValue = 'Minimum order value cannot be negative';
    }

    // Min order quantity validation
    if (!supplyTerms.minOrderQuantity) {
      errors.minOrderQuantity = 'Minimum order quantity is required';
    } else if (supplyTerms.minOrderQuantity < 0) {
      errors.minOrderQuantity = 'Minimum order quantity cannot be negative';
    }

    // Max order value validation
    if (!supplyTerms.maxOrderValue) {
      errors.maxOrderValue = 'Maximum order value is required';
    } else if (supplyTerms.maxOrderValue < 0) {
      errors.maxOrderValue = 'Maximum order value cannot be negative';
    } else if (supplyTerms.maxOrderValue < supplyTerms.minOrderValue) {
      errors.maxOrderValue = 'Maximum order value must be greater than minimum order value';
    }

    return errors;
  }

  /**
   * Validate financial terms section
   */
  private static validateFinancialTerms(
    financialTerms: VendorData['financialTerms'],
    vendorType: VendorData['generalDetails']['vendorType']
  ): ValidationErrors['financialTerms'] {
    const errors: ValidationErrors['financialTerms'] = {};

    // Payment terms validation
    if (!financialTerms.paymentTerms) {
      errors.paymentTerms = 'Payment terms are required';
    }

    // Order expiry days validation - only for STOCK or OVERHEADANDSTOCK
    if ((vendorType === 'STOCK' || vendorType === 'OVERHEADANDSTOCK')) {
      if (!financialTerms.orderExpiryDays) {
        errors.orderExpiryDays = 'Order expiry days are required';
      } else if (financialTerms.orderExpiryDays < 0) {
        errors.orderExpiryDays = 'Order expiry days cannot be negative';
      }
    }

    // Gross margin validation - required for all vendor types
    if (!financialTerms.grossMargin) {
      errors.grossMargin = 'Gross margin is required';
    } else if (isNaN(parseFloat(financialTerms.grossMargin.replace('%', '')))) {
      errors.grossMargin = 'Gross margin must be a number';
    }

    // Invoice discount validation
    if (!financialTerms.invoiceDiscount) {
      errors.invoiceDiscount = 'Please select whether there is an invoice discount';
    } else if (financialTerms.invoiceDiscount === 'yes' && !financialTerms.invoiceDiscountValue) {
      errors.invoiceDiscountValue = 'Please enter the invoice discount value';
    }

    // Settlement discount validation
    if (!financialTerms.settlementDiscount) {
      errors.settlementDiscount = 'Please select whether there is a settlement discount';
    } else if (financialTerms.settlementDiscount === 'yes') {
      if (!financialTerms.settlementDiscountValue) {
        errors.settlementDiscountValue = 'Please enter the settlement discount value';
      }
      if (!financialTerms.settlementDiscountDays) {
        errors.settlementDiscountDays = 'Please enter the settlement discount days';
      }
    }

    // For STOCK or OVERHEADANDSTOCK, validate rebate fields
    if (vendorType === 'STOCK' || vendorType === 'OVERHEADANDSTOCK') {
      // Flat rebate validation
      if (!financialTerms.flatRebate) {
        errors.flatRebate = 'Please select whether there is a flat rebate';
      } else if (financialTerms.flatRebate === 'yes') {
        // At least one of percent or dollar must be provided
        if (!financialTerms.flatRebatePercent && !financialTerms.flatRebateDollar) {
          errors.flatRebatePercent = 'Please enter either a percentage or dollar value';
        }
        if (!financialTerms.flatRebateTerm) {
          errors.flatRebateTerm = 'Please select a time period';
        }
      }

      // Growth rebate validation
      if (!financialTerms.growthRebate) {
        errors.growthRebate = 'Please select whether there is a growth rebate';
      } else if (financialTerms.growthRebate === 'yes') {
        // At least one of percent or dollar must be provided
        if (!financialTerms.growthRebatePercent && !financialTerms.growthRebateDollar) {
          errors.growthRebatePercent = 'Please enter either a percentage or dollar value';
        }
        if (!financialTerms.growthRebateTerm) {
          errors.growthRebateTerm = 'Please select a time period';
        }
      }

      // Marketing rebate validation
      if (!financialTerms.marketingRebate) {
        errors.marketingRebate = 'Please select whether there is a marketing rebate';
      } else if (financialTerms.marketingRebate === 'yes') {
        // At least one of percent or dollar must be provided
        if (!financialTerms.marketingRebatePercent && !financialTerms.marketingRebateDollar) {
          errors.marketingRebatePercent = 'Please enter either a percentage or dollar value';
        }
        if (!financialTerms.marketingRebateTerm) {
          errors.marketingRebateTerm = 'Please select a time period';
        }
      }
    }

    return errors;
  }


/**
* Validate the entire vendor form
*/
static validateForm(data: VendorData): ValidationErrors {
  return {
    generalDetails: ValidationService.validateGeneralDetails(data.generalDetails),
    tradingTerms: ValidationService.validateTradingTerms(data.tradingTerms, data.generalDetails.vendorType),
    supplyTerms: ValidationService.validateSupplyTerms(data.supplyTerms),
    financialTerms: ValidationService.validateFinancialTerms(data.financialTerms, data.generalDetails.vendorType),
  };
}
  /**
   * Validate general details section
   */
  private static validateGeneralDetails(generalDetails: VendorData['generalDetails']): ValidationErrors['generalDetails'] {
    const errors: ValidationErrors['generalDetails'] = {};

    // Trading Entities validation
    if (!generalDetails.tradingEntities || generalDetails.tradingEntities.length === 0) {
      errors.tradingEntities = 'Please select at least one trading entity';
    }

    // Vendor Home Country validation
    if (!generalDetails.vendorHomeCountry) {
      errors.vendorHomeCountry = 'Vendor Home Country is required';
    }

    // Primary Trading Business Unit validation
    if (!generalDetails.primaryTradingBusinessUnit) {
      errors.primaryTradingBusinessUnit = 'Primary Trading Business Unit is required';
    }

    // Email validation
    if (!generalDetails.email) {
      errors.email = 'Email is required';
    } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(generalDetails.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Business Name validation
    if (!generalDetails.businessName) {
      errors.businessName = 'Business Name is required';
    }

    // Vendor Type validation
    if (!generalDetails.vendorType) {
      errors.vendorType = 'Vendor Type is required';
    }

    // Parent Vendor validation (if applicable)
    if (generalDetails.childVendor === 'yes' && !generalDetails.parentVendor) {
      errors.parentVendor = 'Parent Vendor is required for child vendors';
    }

    return errors;
  }

  /**
   * Validate trading terms section
   */
  private static validateTradingTerms(
    tradingTerms: VendorData['tradingTerms'], 
    vendorType: VendorData['generalDetails']['vendorType']
  ): ValidationErrors['tradingTerms'] {
    const errors: ValidationErrors['tradingTerms'] = {};

    // Quotes Obtained validation - only required for OVERHEADS or OVERHEADANDSTOCK
    if ((vendorType === 'OVERHEADS' || vendorType === 'OVERHEADANDSTOCK') && !tradingTerms.quotesObtained) {
      errors.quotesObtained = 'Please select whether 2 quotes were obtained';
    }

    // Reason for no quotes - required if quotesObtained is 'no'
    if (tradingTerms.quotesObtained === 'no' && !tradingTerms.quotesObtainedReason) {
      errors.quotesObtainedReason = 'Please provide a reason';
    }

    return errors;
  }

}