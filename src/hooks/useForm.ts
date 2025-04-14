// src/hooks/useForm.ts
import { useState, useCallback } from "react";

// This type represents a section of the form with key-value pairs
export interface FormSection {
  [key: string]: string | number | boolean | string[] | File | null | undefined;
}

// This type represents the entire form data structure
export interface FormData {
  [section: string]: FormSection;
}

// This type represents the errors object structure
// Note: using string | undefined allows us to clear errors
export interface ErrorsType {
  [section: string]: {
    [field: string]: string | undefined;
  };
}

// Type for the validation function passed to useForm
export type ValidateFunction = (data: FormData) => ErrorsType;

// Type for the submission function passed to useForm
export type SubmitFunction = (data: FormData) => Promise<boolean>;

/**
 * Custom hook for form handling with validation and submission
 * @param validateFn Function to validate the form data
 * @param submitFn Function to submit the form data when valid
 * @param initialData Initial form data
 */
export const useForm = (
  validateFn: ValidateFunction,
  submitFn: SubmitFunction,
  initialData: FormData = {} as FormData
) => {
  // State for form data and validation
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<ErrorsType>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);

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

  // Handle input changes in form fields
  const handleChange = (
    section: string, 
    field: string, 
    value: string | number | boolean | string[] | File | null
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Clear error when field is changed
    if (errors[section]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: undefined
        }
      }));
    }
  };

  // Special handler for checkbox inputs
  const handleCheckboxChange = (
    section: string,
    field: string,
    value: string,
    checked: boolean
  ) => {
    setFormData(prev => {
      const currentValues = [...(prev[section][field] || [])];
      
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
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: currentValues
        }
      };
    });

    // Clear error when field is changed
    if (errors[section]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: undefined
        }
      }));
    }
  };

  // Special handler for file inputs
  const handleFileChange = (section: string, field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: file
      }
    }));
    
    // Clear error when file is changed
    if (errors[section]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: undefined
        }
      }));
    }
  };
  
  // Mark field as touched when it loses focus
  const handleBlur = (section: string, field: string) => {
    setTouched(prev => ({
      ...prev,
      [`${section}.${field}`]: true
    }));
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
      Object.keys(formData[section]).forEach(field => {
        allTouched[`${section}.${field}`] = true;
      });
    });
    
    setTouched(allTouched);
    return false;
  };
  
  // Reset form to initial state
  const resetForm = () => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValid(true);
  };
  
  // Return all form handling functions and state
  return {
    formData,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleCheckboxChange,
    handleFileChange,
    handleBlur,
    handleSubmit,
    validateFormData,
    resetForm
  };
};

export default useForm;