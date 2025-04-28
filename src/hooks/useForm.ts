// src/hooks/useForm.ts - Improved version to fix validation issues
import { useState, useCallback, useRef } from "react";
import { VendorData } from "../models/VendorTypes";
import axios from "axios";

// Types for form handling
type FormSection = {
  [key: string]: any;
};

type FormData = VendorData | Record<string, any>;

type ErrorsType = {
  [K in keyof VendorData]: {
    [field: string]: string | undefined;
  };
};

type ValidateFunction = (data: FormData) => ErrorsType | Record<string, any>;
type SubmitFunction = (data: FormData) => Promise<boolean>;

/**
 * Improved useForm hook with better field focusing and validation
 */
export const useForm = (
  validateFn: ValidateFunction,
  submitFn: SubmitFunction,
  initialData: FormData
) => {
  // State for form data and validation
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<ErrorsType>({} as ErrorsType);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [isChecking, setIsChecking] = useState<Record<string, boolean>>({});
  
  // Create refs to track field elements for focusing
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // Register a field element ref
  const registerFieldRef = useCallback((fieldPath: string, element: HTMLElement | null) => {
    if (element) {
      fieldRefs.current[fieldPath] = element;
    }
  }, []);

  // Validate form data and update errors
  const validateFormData = useCallback(() => {
    const validationErrors = validateFn(formData);
    setErrors(validationErrors);
    
    // Determine if form is valid (no errors in any section)
    const hasErrors = Object.values(validationErrors).some(
      sectionErrors => Object.values(sectionErrors).some(error => !!error)
    );
    
    setIsValid(!hasErrors);
    return validationErrors;
  }, [formData, validateFn]);

  // Validate a specific field with async validation
  const validateField = useCallback(async (section: keyof FormData, field: string) => {
    // Special case for email field to check if it exists in the database
    if (section === 'generalDetails' && field === 'email') {
      const email = formData.generalDetails.email;
      
      // Skip validation if email is empty or invalid format
      if (!email || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
        return;
      }
      
      try {
        // Set checking state for this field
        setIsChecking(prev => ({ ...prev, [`${String(section)}.${field}`]: true }));
        
        // Call API to check if email exists
        const response = await axios.get(`/api/vendor-onboarding-form?email=${encodeURIComponent(email)}`);
        
        if (response.data.exists) {
          // Update errors if email already exists
          setErrors(prev => ({
            ...prev,
            [section]: {
              ...(prev[section] as Record<string, string | undefined>),
              [field]: `A vendor with email "${email}" already exists.`
            }
          }));
        } else {
          // Clear error if email is available
          setErrors(prev => ({
            ...prev,
            [section]: {
              ...(prev[section] as Record<string, string | undefined>),
              [field]: undefined
            }
          }));
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        // Reset checking state
        setIsChecking(prev => ({ ...prev, [`${String(section)}.${field}`]: false }));
      }
    }
    
    // Run the standard validation for all fields
    validateFormData();
  }, [formData, validateFormData]);

  // Handle input changes in form fields
  const handleChange = (section: keyof FormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [field]: value
      }
    }));

    // Clear error when field is changed
    if (errors[section]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...(prev[section] as Record<string, string | undefined>),
          [field]: undefined
        }
      }));
    }
  };

  // Special handler for checkbox inputs
  const handleCheckboxChange = (
    section: keyof FormData,
    field: string,
    value: string,
    checked: boolean
  ) => {
    setFormData(prev => {
      // Create a safe copy of the section
      const sectionData = { ...prev[section] } as Record<string, any>;
      
      // Create a safe copy of the current array values
      const currentValues = Array.isArray(sectionData[field]) 
        ? [...sectionData[field]] 
        : [];
      
      if (checked) {
        // Add value if checked and not already in array
        if (!currentValues.includes(value)) {
          currentValues.push(value);
        }
      } else {
        // Remove value if unchecked
        const index = currentValues.indexOf(value);
        if (index !== -1) {
          currentValues.splice(index, 1);
        }
      }
      
      // Return the updated form data
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: currentValues
        }
      };
    });

    // Clear error when field is changed
    if (errors[section]?.[field]) {
      setErrors(prev => {
        // Create a safe copy of the error section
        const sectionErrors = { ...(prev[section] || {}) } as Record<string, string | undefined>;
        
        // Set the field error to undefined
        sectionErrors[field] = undefined;
        
        return {
          ...prev,
          [section]: sectionErrors
        };
      });
    }
  };

  // Special handler for file inputs
  const handleFileChange = (section: keyof FormData, field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [field]: file
      }
    }));
    
    // Clear error when file is changed
    if (errors[section]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...(prev[section] as Record<string, string | undefined>),
          [field]: undefined
        }
      }));
    }
  };
  
  // Mark field as touched when it loses focus
  const handleBlur = (section: keyof FormData, field: string) => {
    const fieldPath = `${String(section)}.${field}`;
    
    setTouched(prev => ({
      ...prev,
      [fieldPath]: true
    }));
    
    // Validate the field when it loses focus
    validateField(section, field);
  };
  
  // Improved focus on first error field
  const focusFirstErrorField = useCallback((validationErrors: any) => {
    // Define sections in order of appearance on the form
    const sectionOrder = ['generalDetails', 'tradingTerms', 'supplyTerms', 'financialTerms'];
    
    // Loop through sections in order
    for (const section of sectionOrder) {
      const sectionErrors = validationErrors[section];
      if (!sectionErrors) continue;
      
      // Find first field with error in this section
      const errorField = Object.keys(sectionErrors).find(field => 
        sectionErrors[field] !== undefined
      );
      
      if (errorField) {
        const fieldPath = `${section}.${errorField}`;
        console.log(`First error found at ${fieldPath}: ${sectionErrors[errorField]}`);
        
        // Try to focus the field
        setTimeout(() => {
          // First try using our refs system
          const element = fieldRefs.current[fieldPath];
          if (element) {
            console.log(`Focusing element via ref for ${fieldPath}`);
            if ('focus' in element && typeof element.focus === 'function') {
              element.focus();
              return true;
            }
          }
          
          // Fallback to querySelector methods
          let fieldElement = document.getElementById(errorField) ||
                            document.getElementById(`${section}-${errorField}`) ||
                            document.querySelector(`[name="${errorField}"]`) ||
                            document.querySelector(`[id="${section}.${errorField}"]`);
          
          if (!fieldElement) {
            // If still not found, try searching for label + neighboring input
            const label = document.querySelector(`label[for="${errorField}"]`);
            if (label && label.nextElementSibling) {
              fieldElement = label.nextElementSibling as HTMLElement;
            }
          }
          
          if (fieldElement) {
            console.log(`Focusing element via DOM query for ${fieldPath}`);
            try {
              // Try to focus and scroll to the element
              if ('focus' in fieldElement && typeof fieldElement.focus === 'function') {
                fieldElement.focus({preventScroll: false});
                fieldElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
                return true;
              }
            } catch (e) {
              console.error(`Could not focus element for ${fieldPath}:`, e);
            }
          } else {
            // Last resort - try to scroll to the section container
            const sectionContainer = document.getElementById(`${section}-section`);
            if (sectionContainer) {
              console.log(`Scrolling to section for ${section}`);
              sectionContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
              return true;
            }
          }
        }, 100);
        
        return true; // Exit after finding first error
      }
    }
    
    return false; // No errors found
  }, []);
  
  // Handle form submission with improved error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form before submission
    const validationErrors = validateFormData();
    
    // Check if form has any errors
    const hasErrors = Object.values(validationErrors).some(
      sectionErrors => Object.values(sectionErrors).some(error => !!error)
    );
    
    if (!hasErrors) {
      setIsSubmitting(true);
      try {
        const result = await submitFn(formData);
        setIsSubmitting(false);
        return result;
      } catch (error) {
        setIsSubmitting(false);
        console.error("Form submission error:", error);
        return false;
      }
    }
    
    // Mark all fields as touched to show all errors
    const allTouched: Record<string, boolean> = {};
    
    Object.keys(formData).forEach(section => {
      const sectionData = (formData[section as keyof FormData] as Record<string, any>);
      Object.keys(sectionData).forEach(field => {
        allTouched[`${section}.${field}`] = true;
      });
    });
    
    setTouched(allTouched);
    
    // Focus the first field with an error
    focusFirstErrorField(validationErrors);
    
    return false;
  };
  
  // Reset form to initial state
  const resetForm = () => {
    setFormData(initialData);
    setErrors({} as ErrorsType);
    setTouched({});
    setIsSubmitting(false);
    setIsValid(true);
    setIsChecking({});
  };
  
  // Return all form handling functions and state
  return {
    formData,
    errors,
    touched,
    isValid,
    isSubmitting,
    isChecking,
    handleChange,
    handleCheckboxChange,
    handleFileChange,
    handleBlur,
    handleSubmit,
    validateFormData,
    validateField,
    resetForm,
    registerFieldRef,
    focusFirstErrorField
  };
};

export default useForm;