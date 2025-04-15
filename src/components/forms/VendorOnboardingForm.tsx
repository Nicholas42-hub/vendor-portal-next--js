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
import axios from "axios"; // Add axios import

// Define styled components
const FormContainer = styled("div")({
  maxWidth: "1400px",
  width: "100%",
  margin: "0 auto",
  padding: "20px",
  fontFamily:
    '-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
});

const FormSubmitContainer = styled("div")({
  marginTop: "20px",
  width: "100%",
});

const ErrorMessage = styled("div")({
  color: "#ff0000",
  padding: "15px",
  marginBottom: "20px",
  backgroundColor: "#ffecec",
  borderRadius: "5px",
  borderLeft: "5px solid #ff0000",
  fontSize: "14px",
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
      vendorHomeCountry: "",
      primaryTradingBusinessUnit: "",
      email: "",
      businessName: "",
      vendorType: "",
    },
    tradingTerms: {
      quotesObtained: "",
      quotesObtainedReason: "",
      quotesPdf: null,
      backOrder: "",
    },
    supplyTerms: {
      exclusiveSupply: "",
      saleOrReturn: "",
      authRequired: "",
      deliveryNotice: 0,
      minOrderValue: 0,
      minOrderQuantity: 0,
      maxOrderValue: 0,
      otherComments: "",
    },
    financialTerms: {
      paymentTerms: "",
      orderExpiryDays: 0,
      grossMargin: "",
      invoiceDiscount: "",
      invoiceDiscountValue: "",
      settlementDiscount: "",
      settlementDiscountValue: "",
      settlementDiscountDays: "",
      flatRebate: "",
      flatRebatePercent: "",
      flatRebateDollar: "",
      flatRebateTerm: "",
      growthRebate: "",
      growthRebatePercent: "",
      growthRebateDollar: "",
      growthRebateTerm: "",
      marketingRebate: "",
      marketingRebatePercent: "",
      marketingRebateDollar: "",
      marketingRebateTerm: "",
      promotionalFund: "",
      promotionalFundValue: "",
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

  // Helper function to scroll to the first section with errors
  const scrollToFirstError = (validationErrors: any): void => {
    // Type-safe checking to find first section with errors
    if (
      validationErrors.generalDetails &&
      getSectionErrors(validationErrors.generalDetails) &&
      generalDetailsRef.current
    ) {
      generalDetailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (
      validationErrors.tradingTerms &&
      getSectionErrors(validationErrors.tradingTerms) &&
      tradingTermsRef.current
    ) {
      tradingTermsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (
      validationErrors.supplyTerms &&
      getSectionErrors(validationErrors.supplyTerms) &&
      supplyTermsRef.current
    ) {
      supplyTermsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (
      validationErrors.financialTerms &&
      getSectionErrors(validationErrors.financialTerms) &&
      financialTermsRef.current
    ) {
      financialTermsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
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
  const vendorType = formData.generalDetails.vendorType || "";

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        {validationError && <ErrorMessage>{validationError}</ErrorMessage>}

        {/* General Details Section */}
        <div ref={generalDetailsRef}>
          <GeneralDetailsSection
            data={formData.generalDetails}
            errors={errors.generalDetails || {}}
            touched={touched}
            onChange={handleGeneralDetailsChange}
            onCheckboxChange={(field, value, checked) =>
              handleCheckboxChange("generalDetails", field, value, checked)
            }
            onBlur={(field) => handleBlur("generalDetails", field)}
          />
        </div>

        {/* Trading Terms Section */}
        <div ref={tradingTermsRef}>
          <TradingTermsSection
            data={formData.tradingTerms}
            vendorType={vendorType as VendorType}
            errors={errors.tradingTerms || {}}
            touched={touched}
            onChange={handleTradingTermsChange}
            onBlur={(field) => handleBlur("tradingTerms", field)}
            onFileChange={handleTradingTermsFileChange}
          />
        </div>

        {/* Supply Terms Section */}
        <div ref={supplyTermsRef}>
          <SupplyTermsSection
            data={formData.supplyTerms}
            errors={errors.supplyTerms || {}}
            touched={touched}
            onChange={handleSupplyTermsChange}
            onBlur={(field) => handleBlur("supplyTerms", field)}
          />
        </div>

        {/* Financial Terms Section */}
        <div ref={financialTermsRef}>
          <FinancialTermsSection
            data={formData.financialTerms}
            vendorType={vendorType as VendorType}
            errors={errors.financialTerms || {}}
            touched={touched}
            onChange={handleFinancialTermsChange}
            onBlur={(field) => handleBlur("financialTerms", field)}
          />
        </div>

        {/* Submit Button */}
        <FormSubmitContainer>
          <SubmitButton
            text="Send a vendor portal invite"
            loadingText="Processing..."
            isLoading={isLoading}
            type="submit"
            variant="primary"
            fullWidth={true}
          />
        </FormSubmitContainer>
      </form>

      {/* Confirmation Popup */}
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

      {/* Success Popup */}
      <Popup
        isOpen={showSuccess}
        title="Thank you!"
        message="The invitation has been successfully shared. Thanks!"
        confirmText="OK"
        onConfirm={handleSuccessClose}
        isConfirmation={false}
      />

      {/* Similar Vendors Warning Popup */}
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
                <strong>{vendor.businessName}</strong>
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
