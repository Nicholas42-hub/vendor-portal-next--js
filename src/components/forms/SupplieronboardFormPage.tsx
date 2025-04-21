//src/components/forms/SupplierOnboardingForm.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { styled } from "@mui/material/styles";
import {
  VendorType,
  SimilarVendor,
  SupplierFormData,
} from "../../models/VendorTypes";
import { SupplierForm } from "./SupplierOnboardingSection";
import useForm from "../../hooks/useForm";
import { ValidationService } from "../../services/ValidationService";
import { Popup } from "../ui/Popup";
import { SubmitButton } from "../ui/SubmitButton";
import axios from "axios";

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

interface SupplierOnboardingFormProps {}

// Helper function for type-safe property access
function getSectionErrors(sectionErrors: Record<string, string | undefined>) {
  return Object.values(sectionErrors).some((error) => !!error);
}

export const SupplierOnboardingForm: React.FC<
  SupplierOnboardingFormProps
> = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showSimilarityWarning, setShowSimilarityWarning] =
    useState<boolean>(false);
  const [similarVendors, setSimilarVendors] = useState<SimilarVendor[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState<boolean>(true);

  // Create ref for the form container
  const supplierFormDataRef = useRef<HTMLDivElement>(null);

  // Initialize form with empty data
  const initialFormData: SupplierFormData = {
    business_name: "",
    trading_name: "",
    country: "",
    gst_registered: "",
    abn: "",
    gst: "",
    address: "",
    website: "",
    city: "",
    state: "",
    postcode: "",
    primary_contact_email: "",
    telephone: "",
    po_email: "",
    return_order_email: "",
    trading_entities: [],
    has_tax_id: "",
    ANB_GST: "",
    payment_method: "",
    au_invoice_currency: "",
    au_bank_country: "",
    au_bank_address: "",
    au_bank_currency_code: "",
    au_bank_clearing_code: "",
    au_remittance_email: "",
    au_bsb: "",
    au_account: "",
    nz_invoice_currency: "",
    nz_bank_country: "",
    nz_bank_address: "",
    nz_bank_currency_code: "",
    nz_bank_clearing_code: "",
    nz_remittance_email: "",
    nz_bsb: "",
    nz_account: "",
    overseas_iban_switch: "",
    overseas_iban: "",
    overseas_swift: "",
    biller_code: "",
    ref_code: "",
    iAgree: false,
  };

  // Submit supplier data to API
  async function submitSupplierData(data: SupplierFormData): Promise<boolean> {
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

        // Scroll to the top of the form
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        // Also attempt to scroll to the form
        if (supplierFormDataRef.current) {
          supplierFormDataRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }

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
    submitSupplierData,
    initialFormData
  );

  // Helper function to get all form field paths (adjusted for SupplierFormData)
  const getAllFieldsArray = (): Array<[string, string]> => {
    const fields: Array<[string, string]> = [];

    // Add all fields from the form data
    Object.keys(formData).forEach((field) => {
      fields.push([field, field]);
    });

    return fields;
  };

  // Helper function to check if there are any validation errors
  const hasValidationErrors = (validationErrors: any): boolean => {
    return Object.values(validationErrors).some((error) => !!error);
  };

  // Toggle form editability
  const toggleEditable = () => {
    setIsEditable(!isEditable);
  };

  // Handle confirmation from the popup
  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    setShowConfirmation(false);

    try {
      console.log("Submitting form data:", formData);

      // Make the API call to submit the form
      const response = await axios.post("/api/supplier-onboarding", formData);

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
            `${response.data.message} (Supplier: ${response.data.existingVendor.business_name})`
          );
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

  // Handle supplier form changes
  const supplierFormChange = (field: string, value: any) => {
    handleChange(field, value);
  };

  return (
    <FormContainer>
      {/* Add toggle button for editability */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={toggleEditable}
          className={`px-4 py-2 rounded-md ${
            isEditable
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
        >
          {isEditable ? "Make Form Read-Only" : "Enable Editing"}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {validationError && <ErrorMessage>{validationError}</ErrorMessage>}

        {/* Supplier Form Section */}
        <div ref={supplierFormDataRef}>
          <SupplierForm
            data={formData}
            errors={errors}
            touched={touched}
            onChange={supplierFormChange}
            onCheckboxChange={handleCheckboxChange}
            onBlur={handleBlur}
            validateField={validateField}
            isEditable={isEditable}
          />
        </div>

        {/* Submit Button */}
        <FormSubmitContainer>
          <SubmitButton
            text="Send a supplier portal invite"
            loadingText="Processing..."
            isLoading={isLoading}
            type="submit"
            variant="primary"
            fullWidth={true}
            disabled={!isEditable}
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
            This will send an invitation to the supplier to complete their
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
        title="Potential Similar Suppliers Found"
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
            We found existing suppliers that are similar to the one you're
            trying to create:
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
          <p>Do you still want to proceed with creating this supplier?</p>
        </div>
      </Popup>
    </FormContainer>
  );
};

export default SupplierOnboardingForm;
