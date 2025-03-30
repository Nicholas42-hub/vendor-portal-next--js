import React, { useState, useEffect } from "react";
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
import { FabricService } from "../../services/FabricService";
import { Popup } from "../ui/Popup";
import { SubmitButton } from "../ui/SubmitButton";

// Create services
const validationService = new ValidationService();
const fabricService = new FabricService();

// Define styled components
const FormContainer = styled("div")({
  maxWidth: "1000px",
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

interface VendorOnboardingFormProps {}

export const VendorOnboardingForm: React.FC<VendorOnboardingFormProps> = () => {
  const [parentVendors, setParentVendors] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showSimilarityWarning, setShowSimilarityWarning] =
    useState<boolean>(false);
  const [similarVendors, setSimilarVendors] = useState<SimilarVendor[]>([]);

  // Initialize form with validation
  const {
    formData,
    errors,
    touched,
    isValid,
    handleChange,
    handleCheckboxChange,
    handleBlur,
    handleSubmit,
    resetForm,
  } = useForm(ValidationService.validateForm, submitVendorData);

  // Fetch parent vendors on component mount
  useEffect(() => {
    const fetchParentVendors = async () => {
      try {
        const vendors = await fabricService.getParentVendors();
        setParentVendors(vendors);
      } catch (error) {
        console.error("Error fetching parent vendors:", error);
      }
    };

    fetchParentVendors();
  }, []);

  // Submit vendor data to Fabric
  async function submitVendorData(data: VendorData): Promise<boolean> {
    setIsLoading(true);
    try {
      // Check for similar vendors
      const similarityResult = await fabricService.checkSimilarVendors(
        data.generalDetails
      );

      if (similarityResult.hasSimilarVendors) {
        setSimilarVendors(similarityResult.similarVendors);
        setShowSimilarityWarning(true);
        setIsLoading(false);
        return false;
      }

      // Show confirmation popup
      setShowConfirmation(true);
      setIsLoading(false);
      return false; // Don't proceed yet, wait for confirmation
    } catch (error) {
      console.error("Error in submission process:", error);
      setIsLoading(false);
      return false;
    }
  }

  // Handle confirmation from the popup
  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    setShowConfirmation(false);

    try {
      const isChildVendor = formData.generalDetails.childVendor === "yes";
      const result = await fabricService.submitVendorData(
        formData,
        isChildVendor
      );

      if (result) {
        setShowSuccess(true);
        resetForm();
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error submitting form:", error);
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
  };

  // Handle trading terms section changes
  const handleTradingTermsChange = (field: string, value: any) => {
    handleChange("tradingTerms", field, value);
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
  const isChildVendor = formData.generalDetails.childVendor === "yes";

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        {/* General Details Section */}
        <GeneralDetailsSection
          data={formData.generalDetails}
          errors={errors.generalDetails || {}}
          touched={touched}
          onChange={handleGeneralDetailsChange}
          onCheckboxChange={(field, value, checked) =>
            handleCheckboxChange("generalDetails", field, value, checked)
          }
          onBlur={(field) => handleBlur("generalDetails", field)}
          parentVendors={parentVendors}
        />

        {/* Trading Terms Section */}
        <TradingTermsSection
          data={formData.tradingTerms}
          vendorType={vendorType as VendorType}
          errors={errors.tradingTerms || {}}
          touched={touched}
          onChange={handleTradingTermsChange}
          onBlur={(field) => handleBlur("tradingTerms", field)}
        />

        {/* Supply Terms Section */}
        <SupplyTermsSection
          data={formData.supplyTerms}
          errors={errors.supplyTerms || {}}
          touched={touched}
          onChange={handleSupplyTermsChange}
          onBlur={(field) => handleBlur("supplyTerms", field)}
        />

        {/* Financial Terms Section */}
        <FinancialTermsSection
          data={formData.financialTerms}
          vendorType={vendorType as VendorType}
          errors={errors.financialTerms || {}}
          touched={touched}
          onChange={handleFinancialTermsChange}
          onBlur={(field) => handleBlur("financialTerms", field)}
        />

        {/* Submit Buttons */}
        <FormSubmitContainer>
          {isChildVendor ? (
            <SubmitButton
              text="Send to Approval Flow"
              loadingText="Processing..."
              isLoading={isLoading}
              disabled={!isValid}
              type="submit"
              variant="approval"
              fullWidth={true}
            />
          ) : (
            <SubmitButton
              text="Send a vendor portal invite"
              loadingText="Processing..."
              isLoading={isLoading}
              disabled={!isValid}
              type="submit"
              variant="primary"
              fullWidth={true}
            />
          )}
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
