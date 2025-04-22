"use client";
import React, { useState, useEffect, useRef } from "react";
import { styled } from "@mui/material/styles";
import { SupplierFormData, GeneralDetailsData } from "../../models/VendorTypes";
import { SupplierForm } from "./SupplierOnboardingSection";
import useForm from "../../hooks/useForm";
import { ValidationService } from "../../services/ValidationService";
import { Popup } from "../ui/Popup";
import { SubmitButton } from "../ui/SubmitButton";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

// Define interfaces for trading entities
export interface TradingEntity {
  TradingEntityId: string;
  entityName: string;
  entityCountry: string;
  paymentCountry: string; // Add this line
}

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

const SuccessMessage = styled("div")({
  color: "#4CAF50",
  padding: "15px",
  marginBottom: "20px",
  backgroundColor: "#E8F5E9",
  borderRadius: "5px",
  borderLeft: "5px solid #4CAF50",
  fontSize: "14px",
});

interface SupplierOnboardingFormProps {}

const SupplierOnboardingFormPage: React.FC<
  SupplierOnboardingFormProps
> = () => {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const router = useRouter();
  const [tradingEntities, setTradingEntities] = useState<TradingEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState<boolean>(true);
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [hasAuEntities, setHasAuEntities] = useState<boolean>(false);
  const [hasNzEntities, setHasNzEntities] = useState<boolean>(false);
  const [vendorCountry, setVendorCountry] = useState<string>("");
  // Create ref for the form container
  const formContainerRef = useRef<HTMLDivElement>(null);

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
    trading_entities: [], // Explicitly initialize as an empty array
    has_tax_id: "",
    ANB_GST: "",
    payment_method: "Bank Transfer",
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
    validateFormData,
    validateField,
  } = useForm(
    ValidationService.validateSupplierForm as any, // Type cast validation function
    submitSupplierData as any, // Type cast submit function
    initialFormData as any // Type cast initial data
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch vendor data on component mount if email is provided
  useEffect(() => {
    if (email && session?.accessToken) {
      fetchVendorData();
    } else if (status !== "loading") {
      setIsLoadingData(false);
    }
  }, [email, session, status]);

  // Update AU/NZ entity flags when trading entities change
  useEffect(() => {
    if (session?.accessToken) {
      fetchTradingEntities();
    }
  }, [session]);

  // Fetch trading entities
  // ... existing imports and code ...

  const fetchTradingEntities = async () => {
    try {
      setIsLoading(true);
      if (!email) {
        console.error("No email available in URL");
        return;
      }

      const response = await axios.get(`/api/supplier-onboarding/${email}`);
      const { vendorInfo, tradingEntities } = response.data;

      // Update trading entities state
      setTradingEntities(tradingEntities || []);

      // Filter entities by country
      const auEntities =
        tradingEntities?.filter(
          (entity: TradingEntity) => entity.paymentCountry === "Australia"
        ) || [];
      const nzEntities =
        tradingEntities?.filter(
          (entity: TradingEntity) => entity.paymentCountry === "New Zealand"
        ) || [];

      // Update entity flags
      setHasAuEntities(auEntities.length > 0);
      setHasNzEntities(nzEntities.length > 0);

      if (vendorInfo?.business_name) {
        // Updated to include section name as first argument
        if (vendorInfo.business_name)
          handleChange(
            "generalDetails",
            "business_name",
            vendorInfo.business_name
          );
      }

      // Update trading entities in form data
      tradingEntities?.forEach((entity: TradingEntity) => {
        if (entity.TradingEntityId) {
          handleCheckboxChange(
            "trading_entities",
            entity.TradingEntityId,
            true
          );
        }
      });
    } catch (error) {
      console.error("Error fetching trading entities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch vendor data from the API
  const fetchVendorData = async () => {
    if (!email) return;

    try {
      setIsLoadingData(true);
      const response = await axios.get(`/api/supplier-onboarding/${email}`);

      if (response.data && response.data.vendorInfo) {
        const vendorInfo = response.data.vendorInfo;
        const tradingEntities = response.data.tradingEntities || [];

        // Map trading entity IDs to an array, ensuring it's always a valid array
        let entityIds: string[] = [];
        try {
          if (Array.isArray(tradingEntities)) {
            entityIds = tradingEntities
              .filter(
                (entity) =>
                  entity &&
                  typeof entity === "object" &&
                  "TradingEntityId" in entity
              )
              .map((entity) => String(entity.TradingEntityId || ""))
              .filter((id) => id !== "");
          }
        } catch (e) {
          console.error("Error processing trading entities:", e);
          entityIds = [];
        }

        // Instead of using setFormData directly, use handleChange for each field
        if (vendorInfo.business_name)
          handleChange(
            "generalDetails",
            "business_name",
            vendorInfo.business_name
          );
        if (vendorInfo.trading_name)
          handleChange("trading_name", vendorInfo.trading_name);
        handleChange("primary_contact_email", email || "");
        handleChange("po_email", email || "");
        handleChange("return_order_email", email || "");

        // For trading entities, make sure we have a valid array
        const entityIdsArray = Array.isArray(entityIds) ? entityIds : [];

        // For trading entities, we need to set them one by one with handleCheckboxChange
        entityIdsArray.forEach((entityId) => {
          if (entityId) {
            handleCheckboxChange("trading_entities", entityId, true);
          }
        });

        // Set entity flags based on loaded entities
        setHasAuEntities(
          entityIds.some((id) =>
            ["ALAW", "AUDF", "AUTE", "AUPG", "AUAW", "LSAP"].includes(id)
          )
        );

        setHasNzEntities(
          entityIds.some((id) => ["NZAW", "NZDF", "NZTE"].includes(id))
        );
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      setValidationError("Failed to load vendor data. Please try again later.");

      // Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setValidationError(null);
      }, 5000);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Submit supplier data to API
  async function submitSupplierData(data: any): Promise<boolean> {
    const supplierData = data as SupplierFormData;
    setIsLoading(true);
    try {
      // Run validation
      const validationErrors = validateFormData();

      // Check if there are any validation errors
      if (
        Object.keys(validationErrors).some((key) => !!validationErrors[key])
      ) {
        setIsLoading(false);

        // Mark all fields as touched to show validation errors
        Object.keys(formData).forEach((field) => {
          handleBlur(field);
        });

        // Scroll to the top of the form
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        // Also attempt to scroll to the form container
        if (formContainerRef.current) {
          formContainerRef.current.scrollIntoView({
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

  // Toggle form editability
  const toggleEditable = () => {
    setIsEditable(!isEditable);
  };

  // Handle confirmation from the popup
  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    setShowConfirmation(false);

    try {
      if (!email) {
        throw new Error("Email parameter is required");
      }

      // Submit form data to the API
      const response = await axios.put(
        `/api/supplier-onboarding/${email}`,
        formData
      );

      if (response.data.success) {
        setSuccessMessage("Form submitted successfully!");
        setShowSuccess(true);

        // Auto-dismiss success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        console.warn("Form submission returned error:", response.data.message);
        setValidationError(
          `There was an issue submitting the form: ${response.data.message}`
        );

        setTimeout(() => {
          setValidationError(null);
        }, 7000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      setValidationError(`Failed to submit the form: ${errorMessage}`);

      setTimeout(() => {
        setValidationError(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful submission
  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push("/");
  };

  // Show terms and conditions popup
  const handleShowTerms = () => {
    setShowTerms(true);
  };

  // Show loading spinner while checking session or loading initial data
  if (status === "loading" || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    return null; // Will be redirected by the useEffect
  }

  return (
    <FormContainer ref={formContainerRef}>
      {/* Add toggle button for editability */}
      <div className="flex justify-between mb-4">
        <Button
          onClick={() => router.back()}
          className="bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          &larr; Back
        </Button>

        <Button
          onClick={toggleEditable}
          className={`${
            isEditable
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
        >
          {isEditable ? "Make Form Read-Only" : "Enable Editing"}
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Supplier Onboarding Form</h1>

      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

      <form onSubmit={handleSubmit}>
        {/* Supplier Form Section */}
        <SupplierForm
          data={formData}
          errors={errors}
          touched={touched}
          isChecking={{}}
          onChange={handleChange}
          onCheckboxChange={handleCheckboxChange}
          onBlur={handleBlur}
          validateField={validateField}
          isEditable={isEditable}
        />

        {/* Terms and Conditions Link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleShowTerms}
            className="text-blue-600 underline cursor-pointer"
          >
            View Terms and Conditions
          </button>
        </div>

        {/* Submit Button */}
        <FormSubmitContainer>
          <SubmitButton
            text="Submit Supplier Form"
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
        title="Confirm Form Submission"
        confirmText="Yes, Submit"
        cancelText="Cancel"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmation(false)}
        isConfirmation={true}
      >
        <div style={{ margin: "15px 0" }}>
          <p>
            Are you sure you want to submit this supplier onboarding form?
            Please confirm that all information is correct.
          </p>
        </div>
      </Popup>

      {/* Success Popup */}
      <Popup
        isOpen={showSuccess}
        title="Form Submitted Successfully"
        message="Your supplier onboarding form has been submitted successfully."
        confirmText="Return to Dashboard"
        onConfirm={handleSuccessClose}
        isConfirmation={false}
      />

      {/* Terms and Conditions Popup */}
      <Popup
        isOpen={showTerms}
        title="Terms and Conditions"
        confirmText="Close"
        onConfirm={() => setShowTerms(false)}
        isConfirmation={false}
      >
        <div style={{ maxHeight: "400px", overflow: "auto", padding: "10px" }}>
          <h3 className="font-bold mb-2">Supplier Terms and Conditions</h3>
          <p className="mb-4">
            Please read the following terms and conditions carefully before
            submitting the form. By checking the agreement box, you acknowledge
            that you have read, understood, and agree to be bound by these terms
            and conditions.
          </p>

          <h4 className="font-semibold mt-4 mb-2">1. General Terms</h4>
          <p className="mb-2">
            The supplier agrees to provide accurate information in this form and
            acknowledges that any false or misleading information may result in
            termination of the business relationship.
          </p>

          <h4 className="font-semibold mt-4 mb-2">2. Banking Information</h4>
          <p className="mb-2">
            The supplier confirms that all banking details provided are accurate
            and belong to the business entity named in this form. The supplier
            understands that incorrect banking details may result in payment
            delays.
          </p>

          <h4 className="font-semibold mt-4 mb-2">
            3. Privacy and Data Protection
          </h4>
          <p className="mb-2">
            The supplier acknowledges that the information provided will be
            stored in our systems and used for business purposes including but
            not limited to vendor management, payments, and communication.
          </p>

          <h4 className="font-semibold mt-4 mb-2">4. Compliance</h4>
          <p className="mb-2">
            The supplier agrees to comply with all applicable laws and
            regulations related to their business activities and the goods or
            services they provide.
          </p>
        </div>
      </Popup>
    </FormContainer>
  );
};

export default SupplierOnboardingFormPage;
