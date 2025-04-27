// src/components/forms/VendorOnboardingForm.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { styled } from "@mui/material/styles";
import {
  VendorData,
  TradingEntity,
  BusinessUnit,
  VendorType,
  SimilarVendor,
  GeneralDetailsData,
  TradingTermsData,
  SupplyTermsData,
  FinancialTermsData,
} from "../../models/VendorTypes";
import { GeneralDetailsSection } from "./GeneralDetailSection";
import { TradingTermsSection } from "./TradingTermSection";
import { SupplyTermsSection } from "./SupplyTermSection";
import { FinancialTermsSection } from "./FinancialTermSection";
import useForm from "../../hooks/useForm";
import { ValidationService } from "../../services/ValidationService";
import { Popup } from "../ui/Popup";
import { SubmitButton } from "../ui/SubmitButton";
import axios from "axios";

// Define custom colors to match the template
const customColors = {
  primary: "#141E5D",
  primaryLight: "rgba(240, 245, 250, 1)",
  primaryText: "rgba(0, 51, 102, 1)",
  requiredAsterisk: "#F01E73",
  buttonPrimary: "#003063",
  buttonHover: "#002364",
};

// Define styled components with updated styling
const FormContainer = styled("div")({
  maxWidth: "1400px",
  width: "100%",
  margin: "0 auto",
  padding: "20px",
  fontFamily:
    '-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
});

const FormSection = styled("div")({
  backgroundColor: "#f9fafb", // Light gray background for sections
  padding: "24px",
  marginBottom: "24px",
  borderRadius: "0.5rem",
  border: "1px solid #f0f0f0",
});

const SectionTitle = styled("h2")({
  fontSize: "1.25rem",
  fontWeight: "600",
  marginBottom: "1.5rem",
  color: customColors.primaryText,
});

const FormSubmitContainer = styled("div")({
  marginTop: "20px",
  width: "100%",
  display: "flex",
  justifyContent: "flex-end",
});

const ErrorMessage = styled("div")({
  color: "white",
  padding: "15px",
  marginBottom: "20px",
  backgroundColor: "rgba(244, 67, 54, 0.9)",
  borderRadius: "5px",
  borderLeft: "5px solid #D32F2F",
  fontSize: "14px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
});

interface VendorOnboardingFormProps {}

// Helper function for type-safe property access
function getSectionErrors(sectionErrors: Record<string, string | undefined>) {
  return Object.values(sectionErrors).some((error) => !!error);
}

export const VendorOnboardingForm: React.FC<VendorOnboardingFormProps> = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showSimilarityWarning, setShowSimilarityWarning] =
    useState<boolean>(false);
  const [similarVendors, setSimilarVendors] = useState<SimilarVendor[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Create refs for each section
  const generalDetailsRef = useRef<HTMLDivElement>(null);
  const tradingTermsRef = useRef<HTMLDivElement>(null);
  const supplyTermsRef = useRef<HTMLDivElement>(null);
  const financialTermsRef = useRef<HTMLDivElement>(null);

  // Initialize form with empty data
  const initialFormData: VendorData = {
    generalDetails: {
      tradingEntities: [],
      vendor_home_country: "",
      primary_trading_business_unit: "",
      email: "",
      business_name: "",
      vendor_type: "",
    },
    tradingTerms: {
      quotes_obtained: "",
      quotes_obtained_reason: "",
      quotes_pdf_url: null,
      back_order: "",
    },
    supplyTerms: {
      exclusive_supply: "",
      sale_or_return: "",
      auth_required: "",
      delivery_notice: 0,
      min_order_value: 0,
      min_order_quantity: 0,
      max_order_value: 0,
      other_comments: "",
    },
    financialTerms: {
      payment_terms: "",
      order_expiry_days: 0,
      gross_margin: "",
      invoice_discount: "",
      invoice_discount_value: "",
      settlement_discount: "",
      settlement_discount_value: "",
      settlement_discount_days: "",
      flat_rebate: "",
      flat_rebate_percent: "",
      flat_rebate_dollar: "",
      flat_rebate_term: "",
      growth_rebate: "",
      growth_rebate_percent: "",
      growth_rebate_dollar: "",
      growth_rebate_term: "",
      marketing_rebate: "",
      marketing_rebate_percent: "",
      marketing_rebate_dollar: "",
      marketing_rebate_term: "",
      promotional_fund: "",
      promotional_fund_value: "",
    },
  };

  // Submit vendor data to API
  async function submitVendorData(data: VendorData): Promise<boolean> {
    setIsLoading(true);
    try {
      // Run validation ourselves
      const validationErrors = validateFormData();

      // Check if there are any validation errors
      if (hasValidationErrors(validationErrors)) {
        setIsLoading(false);
        // Mark all fields as touched to show validation errors
        const allFields = getAllFieldsArray();
        allFields.forEach((fieldPath) => {
          handleBlur(...fieldPath);
        });

        // Explicitly scroll to the top of the form to show the first elements
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        // Also attempt to scroll to the first error section
        setTimeout(() => {
          scrollToFirstError(validationErrors);
        }, 100);

        // Set a validation error message
        setValidationError(
          "Please complete all required fields before submitting the form."
        );

        // Hide the error message after 5 seconds
        setTimeout(() => {
          setValidationError(null);
        }, 5000);

        return false;
      }

      // Check if email exists before proceeding
      const email = data.generalDetails.email;
      if (email) {
        try {
          const emailCheckResponse = await axios.get(
            `/api/vendor-onboarding-form/?email=${encodeURIComponent(email)}`
          );

          if (emailCheckResponse.data && emailCheckResponse.data.exists) {
            setIsLoading(false);

            // Email exists, show validation error
            setValidationError(
              `A vendor with email "${email}" already exists. Please use a different email.`
            );

            // Scroll to email field
            if (generalDetailsRef.current) {
              generalDetailsRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }

            return false;
          }
        } catch (emailCheckError) {
          console.error(
            "Error checking email before submission:",
            emailCheckError
          );
          // Continue with form submission even if email check fails
          // The server will perform final validation
        }
      }

      // Clear any previous validation error
      setValidationError(null);

      // Show confirmation popup
      setShowConfirmation(true);
      setIsLoading(false);
      return false; // Don't proceed yet, wait for confirmation
    } catch (error) {
      console.error("Error in submission process:", error);

      // Show a user-friendly error message
      setValidationError(
        "There was an error processing your form. Please try again or contact support."
      );

      // Hide the error message after 5 seconds
      setTimeout(() => {
        setValidationError(null);
      }, 5000);

      setIsLoading(false);
      return false;
    }
  }

  // Initialize form with validation
  const {
    formData,
    errors,
    touched,
    isValid,
    handleChange,
    handleCheckboxChange,
    handleFileChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validateFormData,
    validateField,
  } = useForm(
    ValidationService.validateForm,
    submitVendorData,
    initialFormData
  );

  // Helper function to get all form field paths
  const getAllFieldsArray = (): Array<[keyof VendorData, string]> => {
    const fields: Array<[keyof VendorData, string]> = [];

    // General Details fields
    Object.keys(formData.generalDetails).forEach((field) => {
      fields.push(["generalDetails", field]);
    });

    // Trading Terms fields
    Object.keys(formData.tradingTerms).forEach((field) => {
      fields.push(["tradingTerms", field]);
    });

    // Supply Terms fields
    Object.keys(formData.supplyTerms).forEach((field) => {
      fields.push(["supplyTerms", field]);
    });

    // Financial Terms fields
    Object.keys(formData.financialTerms).forEach((field) => {
      fields.push(["financialTerms", field]);
    });

    return fields;
  };

  // Helper function to check if there are any validation errors
  const hasValidationErrors = (validationErrors: any): boolean => {
    // Type-safe checking of validation errors
    if (
      validationErrors.generalDetails &&
      getSectionErrors(validationErrors.generalDetails)
    ) {
      return true;
    }

    if (
      validationErrors.tradingTerms &&
      getSectionErrors(validationErrors.tradingTerms)
    ) {
      return true;
    }

    if (
      validationErrors.supplyTerms &&
      getSectionErrors(validationErrors.supplyTerms)
    ) {
      return true;
    }

    if (
      validationErrors.financialTerms &&
      getSectionErrors(validationErrors.financialTerms)
    ) {
      return true;
    }

    return false;
  };

  // Improved scrollToFirstError function
  const scrollToFirstError = (errors: any) => {
    console.log("Validation errors:", errors);

    // Define the sections in order of appearance on the form
    const sections = [
      { name: "generalDetails", ref: generalDetailsRef },
      { name: "tradingTerms", ref: tradingTermsRef },
      { name: "supplyTerms", ref: supplyTermsRef },
      { name: "financialTerms", ref: financialTermsRef },
    ];

    // Check each section in order
    for (const section of sections) {
      const sectionErrors = errors[section.name];
      if (sectionErrors && Object.values(sectionErrors).some((e) => !!e)) {
        console.log(`Found errors in ${section.name}:`, sectionErrors);

        // Scroll to section
        if (section.ref.current) {
          section.ref.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          // Try to find the first field with error
          const fieldNames = Object.keys(sectionErrors);
          for (const field of fieldNames) {
            if (sectionErrors[field]) {
              console.log(`First error field: ${field}`);

              // Try multiple selectors to find the element
              const element =
                document.getElementById(field) ||
                document.querySelector(`[name="${field}"]`) ||
                document.querySelector(`[id="${section.name}.${field}"]`);

              if (element) {
                console.log("Found element, focusing:", element);
                setTimeout(() => {
                  try {
                    element.focus();
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  } catch (e) {
                    console.error("Could not focus element:", e);
                  }
                }, 500);
              } else {
                console.warn(`Could not find element for field: ${field}`);
              }
              return; // Exit after finding first field with error
            }
          }
          return; // Exit even if we couldn't find a specific field
        }
      }
    }
  };

  // Handle confirmation from the popup
  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    setShowConfirmation(false);

    try {
      console.log("Submitting form data:", formData);

      // Format the data for API submission
      const submissionData = {
        generalDetails: formData.generalDetails,
        tradingTerms: formData.tradingTerms,
        supplyTerms: formData.supplyTerms,
        financialTerms: formData.financialTerms,
      };

      // Make the API call to submit the form
      const response = await axios.post(
        "/api/vendor-onboarding-form",
        submissionData
      );

      if (response.data.success) {
        console.log("Form submitted successfully:", response.data);
        setShowSuccess(true);
        resetForm();
      } else {
        console.warn("Form submission returned error:", response.data.message);

        // Check if this is an email already exists error
        if (response.data.existingVendor) {
          // Set the error with more specific information about the existing vendor
          setValidationError(
            `${response.data.message} (Vendor: ${response.data.existingVendor.business_name})`
          );

          // Scroll to the email field in the general details section
          if (generalDetailsRef.current) {
            generalDetailsRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        } else {
          setValidationError(
            `There was an issue submitting the form: ${response.data.message}`
          );
        }

        setTimeout(() => {
          setValidationError(null);
        }, 7000); // Give more time to read email duplication errors
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error submitting form:", error);

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      setValidationError(`Failed to submit the form: ${errorMessage}`);

      setTimeout(() => {
        setValidationError(null);
      }, 5000);

      setIsLoading(false);
      return false;
    }
  };

  // Handle successful submission
  const handleSuccessClose = () => {
    setShowSuccess(false);
    resetForm();
    window.scrollTo(0, 0);
  };

  // Handle general details section changes
  const handleGeneralDetailsChange = (field: string, value: any) => {
    handleChange("generalDetails", field, value);

    // Check if email exists when email field is changed
    if (field === "email" && value && ValidationService.isValidEmail(value)) {
      checkEmailExists(value);
    }
  };

  // Check if email already exists in the database
  const checkEmailExists = async (email: string) => {
    try {
      const response = await axios.get(
        `/api/vendor-onboarding-form/?email=${encodeURIComponent(email)}`
      );

      if (response.data && response.data.exists) {
        // Email exists, show validation error
        setValidationError(
          `A vendor with email "${email}" already exists. Please use a different email.`
        );

        // Scroll to the email field
        if (generalDetailsRef.current) {
          generalDetailsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } else {
        // Clear validation error if it was an email error
        if (validationError && validationError.includes("vendor with email")) {
          setValidationError(null);
        }
      }
    } catch (error) {
      console.error("Error checking email:", error);
      // Don't set error - we'll catch it during submission if it still exists
    }
  };

  // Handle trading terms section changes
  const handleTradingTermsChange = (field: string, value: any) => {
    handleChange("tradingTerms", field, value);
  };

  // Handle file uploads for trading terms
  const handleTradingTermsFileChange = (field: string, file: File | null) => {
    handleFileChange("tradingTerms", field, file);
  };

  // Handle supply terms section changes
  const handleSupplyTermsChange = (field: string, value: any) => {
    handleChange("supplyTerms", field, value);
  };

  // Handle financial terms section changes
  const handleFinancialTermsChange = (field: string, value: any) => {
    handleChange("financialTerms", field, value);
  };

  // Determine the vendor type for conditional rendering
  const vendorType = formData.generalDetails.vendor_type || "";

  // Add global CSS for styling form elements
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
      .MuiFormLabel-root, .MuiInputLabel-root {
        color: #333333 !important;
        font-weight: 500 !important;
        font-size: 0.875rem !important;
        margin-bottom: 0.25rem !important;
      }
      
      .MuiInputBase-root, .MuiOutlinedInput-root {
        background-color: white !important;
        border-radius: 0.375rem !important;
      }
      
      .MuiOutlinedInput-notchedOutline {
        border-color: #d1d5db !important;
      }
      
      .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
        border-color: #9ca3af !important;
      }
      
      .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
        border-color: ${customColors.primary} !important;
        border-width: 2px !important;
      }
      
      .required-field::after {
        content: '*';
        color: ${customColors.requiredAsterisk};
        margin-left: 4px;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <FormContainer>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}

      <form onSubmit={handleSubmit}>
        {/* General Details Section */}
        <FormSection ref={generalDetailsRef}>
          <GeneralDetailsSection
            data={formData.generalDetails}
            errors={
              Object.fromEntries(
                Object.entries(errors.generalDetails || {}).filter(
                  ([_, v]) => v !== undefined
                )
              ) as { [key: string]: string }
            }
            touched={touched}
            onChange={handleGeneralDetailsChange}
            onCheckboxChange={(field, value, checked) =>
              handleCheckboxChange("generalDetails", field, value, checked)
            }
            onBlur={(field) => handleBlur("generalDetails", field)}
            validateField={(field) => validateField("generalDetails", field)}
          />
        </FormSection>

        {/* Trading Terms Section */}
        <FormSection ref={tradingTermsRef}>
          <TradingTermsSection
            data={formData.tradingTerms}
            vendorType={vendorType as VendorType}
            errors={errors.tradingTerms || {}}
            touched={touched}
            onChange={handleTradingTermsChange}
            onBlur={(field) => handleBlur("tradingTerms", field)}
            onFileChange={handleTradingTermsFileChange}
          />
        </FormSection>

        {/* Supply Terms Section */}
        <FormSection ref={supplyTermsRef}>
          <SupplyTermsSection
            data={formData.supplyTerms}
            errors={errors.supplyTerms || {}}
            touched={touched}
            onChange={handleSupplyTermsChange}
            onBlur={(field) => handleBlur("supplyTerms", field)}
          />
        </FormSection>

        {/* Financial Terms Section */}
        <FormSection ref={financialTermsRef}>
          <FinancialTermsSection
            data={formData.financialTerms}
            vendorType={vendorType as VendorType}
            errors={errors.financialTerms || {}}
            touched={touched}
            onChange={handleFinancialTermsChange}
            onBlur={(field) => handleBlur("financialTerms", field)}
          />
        </FormSection>

        {/* Submit Button */}
        <FormSubmitContainer>
          <SubmitButton
            text="Send a vendor portal invite"
            loadingText="Processing..."
            isLoading={isLoading}
            type="submit"
            variant="primary"
            fullWidth={false}
            customStyle={{
              backgroundColor: customColors.buttonPrimary,
              color: "white",
              borderRadius: "6px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              "&:hover": {
                backgroundColor: customColors.buttonHover,
                transform: "translateY(-1px)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              },
            }}
          />
        </FormSubmitContainer>
      </form>

      {/* Popups remain unchanged */}
      <Popup
        isOpen={showConfirmation}
        title="Would you like to proceed?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmation(false)}
        isConfirmation={true}
      >
        <div style={{ margin: "15px 0" }}>
          <p>
            This will send an invitation to the vendor to complete their
            onboarding process. Are you sure you want to continue?
          </p>
        </div>
      </Popup>

      <Popup
        isOpen={showSuccess}
        title="Thank you!"
        message="The invitation has been successfully shared. Thanks!"
        confirmText="OK"
        onConfirm={handleSuccessClose}
        isConfirmation={false}
      />

      <Popup
        isOpen={showSimilarityWarning}
        title="Potential Similar Vendors Found"
        onConfirm={() => {
          setShowSimilarityWarning(false);
          setShowConfirmation(true);
        }}
        onCancel={() => setShowSimilarityWarning(false)}
        confirmText="Yes, Proceed"
        cancelText="No, Cancel"
        isConfirmation={true}
      >
        <div style={{ textAlign: "left", marginBottom: "20px" }}>
          <p>
            We found existing vendors that are similar to the one you're trying
            to create:
          </p>
          <ul style={{ maxHeight: "200px", overflowY: "auto" }}>
            {similarVendors.map((vendor, index) => (
              <li key={index} style={{ marginBottom: "10px" }}>
                <strong>{vendor.business_name}</strong>
                <br />
                Email: {vendor.email}
                <br />
                Similarity: {Math.round(vendor.similarity * 100)}%
                <br />
                Matches: {vendor.matchedCriteria.join(", ")}
              </li>
            ))}
          </ul>
          <p>Do you still want to proceed with creating this vendor?</p>
        </div>
      </Popup>
    </FormContainer>
  );
};

export default VendorOnboardingForm;
