"use client";
import React, { useState, useEffect, useRef } from "react";
import { styled } from "@mui/material/styles";
import {
  VendorData,
  TradingEntity,
  BusinessUnit,
  VendorType,
  SimilarVendor,
} from "../../models/VendorTypes";
import { GeneralDetailsSection } from "./GeneralDetailSection";
import { TradingTermsSection } from "./TradingTermSection";
import { SupplyTermsSection } from "./SupplyTermSection";
import { FinancialTermsSection } from "./FinancialTermSection";
import { useForm } from "../../hooks/useForm";
import { ValidationService } from "../../services/ValidationService";
import { Popup } from "../ui/Popup";
import { SubmitButton } from "../ui/SubmitButton";

// Create services
const validationService = new ValidationService();
const fabricService = new FabricService();

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
  } = useForm(ValidationService.validateForm, submitVendorData);

  // Submit vendor data to Fabric
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

      // Clear any previous validation error
      setValidationError(null);

      // Skip vendor similarity check since the API doesn't support it currently
      console.log("Skipping vendor similarity check");

      /* 
      // Original code - will be re-enabled once API supports it
      try {
        // Check for similar vendors - but don't block submission if this fails
        const similarityResult = await fabricService.checkSimilarVendors(
          data.generalDetails
        );

        if (similarityResult.hasSimilarVendors) {
          setSimilarVendors(similarityResult.similarVendors);
          setShowSimilarityWarning(true);
          setIsLoading(false);
          return false;
        }
      } catch (similarityError) {
        console.error("Error checking for similar vendors:", similarityError);
        // Continue with form submission even if similarity check fails
      }
      */

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
    return Object.values(validationErrors).some(
      (sectionErrors) => Object.keys(sectionErrors as object).length > 0
    );
  };

  // Helper function to scroll to the first section with errors
  const scrollToFirstError = (validationErrors: any): void => {
    if (
      Object.keys(validationErrors.generalDetails).length > 0 &&
      generalDetailsRef.current
    ) {
      generalDetailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (
      Object.keys(validationErrors.tradingTerms).length > 0 &&
      tradingTermsRef.current
    ) {
      tradingTermsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (
      Object.keys(validationErrors.supplyTerms).length > 0 &&
      supplyTermsRef.current
    ) {
      supplyTermsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (
      Object.keys(validationErrors.financialTerms).length > 0 &&
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
      console.log("Submitting form data");

      // Always show success in demo mode
      const demoMode = true;

      if (demoMode) {
        // In demo mode, wait a bit to simulate API processing
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Demo mode: showing success without API call");
        setShowSuccess(true);
        resetForm();
        setIsLoading(false);
        return true;
      }

      // This is the actual API call that would be used in production
      const result = await fabricService.submitVendorData(formData);

      if (result) {
        console.log("Form submitted successfully");
        setShowSuccess(true);
        resetForm();
      } else {
        console.warn("Form submission returned false");
        setValidationError(
          "There was an issue submitting the form. Please try again or contact support."
        );

        setTimeout(() => {
          setValidationError(null);
        }, 5000);
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error submitting form:", error);

      setIsLoading(false);
      return true;
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
        title="Would you want to proceed?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmation(false)}
        isConfirmation={true}
      />

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
