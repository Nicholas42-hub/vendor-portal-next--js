import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { VendorData, GeneralDetails, TradingTerms, SupplyTerms, FinancialTerms } from '../models/VendorTypes';

// Initial state for the form
const initialVendorData: VendorData = {
  generalDetails: {
    tradingEntities: [],
    vendorHomeCountry: '',
    primaryTradingBusinessUnit: '' as any,
    email: '',
    businessName: '',
    vendorType: '' as any,
    childVendor: '',
    parentVendor: '',
  },
  tradingTerms: {
    quotesObtained: '',
    quotesObtainedReason: '',
    backOrder: '',
  },
  supplyTerms: {
    exclusiveSupply: '',
    saleOrReturn: '',
    authRequired: '',
    deliveryNotice: 0,
    minOrderValue: 0,
    minOrderQuantity: 0,
    maxOrderValue: 0,
    otherComments: '',
  },
  financialTerms: {
    paymentTerms: '',
    orderExpiryDays: 0,
    grossMargin: '',
    invoiceDiscount: '',
    invoiceDiscountValue: '',
    settlementDiscount: '',
    settlementDiscountValue: '',
    settlementDiscountDays: '',
    flatRebate: '',
    flatRebatePercent: '',
    flatRebateDollar: '',
    flatRebateTerm: '',
    growthRebate: '',
    growthRebatePercent: '',
    growthRebateDollar: '',
    growthRebateTerm: '',
    marketingRebate: '',
    marketingRebatePercent: '',
    marketingRebateDollar: '',
    marketingRebateTerm: '',
    promotionalFund: '',
    promotionalFundValue: '',
  },
};

// Validation errors type
type ValidationErrors = {
  [K in keyof VendorData]: {
    [Field in keyof VendorData[K]]?: string;
  };
};

interface UseFormReturn {
  formData: VendorData;
  errors: ValidationErrors;
  touched: { [key: string]: boolean };
  isValid: boolean;
  handleChange: (section: keyof VendorData, field: string, value: any) => void;
  handleCheckboxChange: (section: keyof VendorData, field: string, value: string, checked: boolean) => void;
  handleBlur: (section: keyof VendorData, field: string) => void;
  handleSubmit: (e: FormEvent) => Promise<boolean>;
  resetForm: () => void;
}

export const useForm = (validateForm: (data: VendorData) => ValidationErrors, onSubmit: (data: VendorData) => Promise<boolean>): UseFormReturn => {
  const [formData, setFormData] = useState<VendorData>(initialVendorData);
  const [errors, setErrors] = useState<ValidationErrors>({
    generalDetails: {},
    tradingTerms: {},
    supplyTerms: {},
    financialTerms: {},
  });
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isValid, setIsValid] = useState(false);

  // Validate form whenever formData changes
  useEffect(() => {
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    
    // Check if form is valid (no errors)
    const hasErrors = Object.values(validationErrors).some(
      sectionErrors => Object.keys(sectionErrors).length > 0
    );
    setIsValid(!hasErrors);
  }, [formData, validateForm]);

  // Handle changes to form fields
  const handleChange = (section: keyof VendorData, field: string, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value,
      },
    }));
  };

  // Handle checkbox changes specifically (checkboxes can be multi-select)
  const handleCheckboxChange = (section: keyof VendorData, field: string, value: string, checked: boolean) => {
    setFormData(prevData => {
      if (field === 'tradingEntities') {
        const currentEntities = [...(prevData.generalDetails.tradingEntities || [])];
        if (checked) {
          currentEntities.push(value as any);
        } else {
          const index = currentEntities.indexOf(value as any);
          if (index > -1) {
            currentEntities.splice(index, 1);
          }
        }
        
        return {
          ...prevData,
          generalDetails: {
            ...prevData.generalDetails,
            tradingEntities: currentEntities,
          },
        };
      }
      
      return prevData;
    });
  };

  // Track which fields have been touched (for validation UX)
  const handleBlur = (section: keyof VendorData, field: string) => {
    setTouched(prev => ({
      ...prev,
      [`${section}.${field}`]: true,
    }));
  };

  // Submit the form
  const handleSubmit = async (e: FormEvent): Promise<boolean> => {
    e.preventDefault();
    
    // Mark all fields as touched to show all validation errors
    const allTouched: { [key: string]: boolean } = {};
    Object.keys(formData).forEach(section => {
      Object.keys((formData as any)[section]).forEach(field => {
        allTouched[`${section}.${field}`] = true;
      });
    });
    setTouched(allTouched);
    
    // Only submit if valid
    if (isValid) {
      try {
        return await onSubmit(formData);
      } catch (error) {
        console.error('Form submission error:', error);
        return false;
      }
    }
    
    return false;
  };

  // Reset the form to initial state
  const resetForm = () => {
    setFormData(initialVendorData);
    setTouched({});
  };

  return {
    formData,
    errors,
    touched,
    isValid,
    handleChange,
    handleCheckboxChange,
    handleBlur,
    handleSubmit,
    resetForm,
  };
};