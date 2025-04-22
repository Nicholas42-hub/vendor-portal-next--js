// src/hooks/useForm.ts - Enhanced version
import { useState, useCallback } from "react";
import { VendorData } from "../models/VendorTypes";
import axios from "axios";

// This type represents a section of the form with key-value pairs
type FormSection = {
  [key: string]: any;
};

// This type represents the entire form data structure
type FormData = VendorData | Record<string, any>;

// This type represents the errors object structure
type ErrorsType = {
  [K in keyof VendorData]: {
    [field: string]: string | undefined;
  };
};

// Type for the validation function passed to useForm
type ValidateFunction = (data: FormData) => ErrorsType | Record<string, any>;

// Type for the submission function passed to useForm
type SubmitFunction = (data: FormData) => Promise<boolean>;

/**
 * Custom hook for form handling with validation and submission
 * @param validateFn Function to validate the form data
 * @param submitFn Function to submit the form data when valid
 * @param initialData Initial form data
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
    setTouched(prev => ({
      ...prev,
      [`${String(section)}.${field}`]: true
    }));
    
    // Validate the field when it loses focus
    validateField(section, field);
  };
  
  // Handle form submission
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
      const result = await submitFn(formData);
      setIsSubmitting(false);
      return result;
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
    resetForm
  };
};

export default useForm;