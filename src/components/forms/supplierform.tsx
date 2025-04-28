"use client";
import { Session } from "next-auth";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/label";
import { Popup } from "../ui/Popup";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/lib/countries";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { ConditionalInput } from "../ui/ConditionalInput";
import { SubmitButton } from "../ui/SubmitButton";
import { styled } from "@mui/material/styles";
const FormSubmitContainer = styled("div")({
  marginTop: "20px",
  width: "100%",
  display: "flex",
  justifyContent: "flex-end",
});
// Define interfaces for trading entities
interface TradingEntity {
  TradingEntityId: string;
  entityName: string;
  entityCountry: string;
  paymentCountry?: string; // Add this line
}
// Define types for the form data
interface SupplierFormData {
  business_name: string;
  trading_name: string;
  country: string;
  gst_registered: string;
  abn?: string;
  gst?: string;
  address: string;
  website: string;
  city: string;
  state: string;
  postcode: string;
  primary_contact_email: string;
  telephone: string;
  po_email: string;
  return_order_email: string;
  trading_entities: string[];
  has_tax_id: string;
  ABN_GST: string;
  // Payment method
  au_payment_method: string;
  nz_payment_method: string;
  // AU specific fields
  au_invoice_currency?: string;
  au_bank_country?: string;
  au_bank_address?: string;
  au_bank_currency_code?: string;
  au_bank_clearing_code?: string;
  au_remittance_email?: string;
  au_bsb?: string;
  au_account?: string;
  au_biller_code: string;
  au_ref_code: string;

  // NZ specific fields
  nz_invoice_currency?: string;
  nz_bank_country?: string;
  nz_bank_address?: string;
  nz_bank_currency_code?: string;
  nz_bank_clearing_code?: string;
  nz_remittance_email?: string;
  nz_bsb?: string;
  nz_account?: string;
  nz_biller_code: string;
  nz_ref_code: string;

  // Overseas banking
  au_iban_switch?: string;
  au_iban?: string;
  au_swift?: string;

  nz_iban_switch?: string;
  nz_iban?: string;
  nz_swift?: string;

  // Terms agreement
  iAgree: boolean;
}

// Define validation errors type
interface FormErrors {
  [key: string]: string;
}

// Update the props interface for SupplierForm
interface SupplierFormProps {
  isEditable?: boolean;
  email?: string;
  onDataChange?: (data: SupplierFormData) => void;
  hideSubmitButton?: boolean; // New prop to control submit button visibility
  initialData: {};
}

export default function SupplierFormExternal({
  isEditable = true,
  email: propEmail,
  onDataChange,
  hideSubmitButton = false, // Add default value of false
  initialData = {},
}: SupplierFormProps) {
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get("email");
  const email = propEmail || urlEmail;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tradingEntities, setTradingEntities] = useState<TradingEntity[]>([]);
  const [hasAuEntities, setHasAuEntities] = useState(false);
  const [hasNzEntities, setHasNzEntities] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [bankStatement, setBankStatement] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [vendorCountry, setVendorCountry] = useState<string>("");
  // Initial form state
  // Initialize formData with defaults, merged with any initialData provided
  const [formData, setFormData] = useState<SupplierFormData>(() => {
    // Default form data
    const defaultData: SupplierFormData = {
      business_name: "",
      trading_name: "",
      country: "",
      gst_registered: "",
      address: "",
      website: "",
      city: "",
      state: "",
      postcode: "",
      primary_contact_email: email || "",
      telephone: "",
      po_email: email || "",
      return_order_email: email || "",
      trading_entities: [],
      au_payment_method: "Bank Transfer",
      nz_payment_method: "Bank Transfer",
      au_biller_code: "",
      au_ref_code: "",
      nz_biller_code: "",
      nz_ref_code: "",
      iAgree: false,
      has_tax_id: "",
      ABN_GST: "",
    };

    // Merge with initial data if provided
    return { ...defaultData, ...initialData };
  });
  // Currencies list
  const currencies = [
    { value: "AUD", label: "AUD" },
    { value: "NZD", label: "NZD" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
    { value: "CNY", label: "CNY" },
  ];
  // Add these functions to your component, near other validation functions

  // Bank field validation functions
  const validateBSB = (
    value: string | undefined
  ): { isValid: boolean; errorMessage: string } => {
    if (!value || value.trim() === "") {
      return {
        isValid: false,
        errorMessage: "BSB is required and must be in numerical format.",
      };
    }

    // Strip all non-numeric characters
    const numericValue = value.replace(/\D/g, "");

    // Check if the length is exactly 6 digits after removing non-numeric characters
    if (numericValue.length !== 6) {
      return {
        isValid: false,
        errorMessage: "BSB must be exactly 6 digits.",
      };
    }

    return { isValid: true, errorMessage: "" };
  };

  const validateAccount = (
    value: string | undefined
  ): { isValid: boolean; errorMessage: string } => {
    if (!value || value.trim() === "") {
      return {
        isValid: false,
        errorMessage:
          "Account number is required and must be in numerical format.",
      };
    }

    // Strip all non-numeric characters
    const numericValue = value.replace(/\D/g, "");

    // Check if the length is exactly 10 digits after removing non-numeric characters
    if (numericValue.length !== 10) {
      return {
        isValid: false,
        errorMessage: "Account must be exactly 10 digits.",
      };
    }

    return { isValid: true, errorMessage: "" };
  };

  const validateIBAN = (
    value: string | undefined
  ): { isValid: boolean; errorMessage: string } => {
    if (!value || value.trim() === "") {
      return {
        isValid: false,
        errorMessage: "IBAN is required.",
      };
    }

    // Remove spaces and convert to uppercase for validation
    const cleanValue = value.replace(/\s/g, "").toUpperCase();

    // IBAN format validation (2 letters followed by up to 32 alphanumeric characters)
    const ibanRegex = /^[A-Z]{2}[0-9A-Z]{2,32}$/;

    if (!ibanRegex.test(cleanValue)) {
      return {
        isValid: false,
        errorMessage:
          "Invalid IBAN format. Must start with 2 letters followed by alphanumeric characters.",
      };
    }

    return { isValid: true, errorMessage: "" };
  };

  const validateSWIFT = (
    value: string | undefined
  ): { isValid: boolean; errorMessage: string } => {
    if (!value || value.trim() === "") {
      return {
        isValid: false,
        errorMessage: "SWIFT code is required.",
      };
    }

    // SWIFT code format validation (8 or 11 alphanumeric characters)
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

    if (!swiftRegex.test(value.toUpperCase())) {
      return {
        isValid: false,
        errorMessage: "Invalid SWIFT code format. Must be 8 or 11 characters.",
      };
    }

    return { isValid: true, errorMessage: "" };
  };

  // Update the handleInputBlur function to include banking validation
  const handleInputBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Only validate if there's a value
    if (value) {
      let error = "";

      // Email validation for email fields
      if (
        name === "po_email" ||
        name === "return_order_email" ||
        name === "primary_contact_email" ||
        name === "au_remittance_email" ||
        name === "nz_remittance_email"
      ) {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!emailRegex.test(value)) {
          error = "Please enter a valid email address";
        }
      }

      // Banking field validations
      if (name === "au_bsb" || name === "nz_bsb") {
        const result = validateBSB(value);
        if (!result.isValid) {
          error = result.errorMessage;
        } else {
          // Update form data with clean numeric value
          const numericValue = value.replace(/\D/g, "");
          setFormData((prev) => ({ ...prev, [name]: numericValue }));
        }
      }

      if (name === "au_account" || name === "nz_account") {
        const result = validateAccount(value);
        if (!result.isValid) {
          error = result.errorMessage;
        } else {
          // Update form data with clean numeric value
          const numericValue = value.replace(/\D/g, "");
          setFormData((prev) => ({ ...prev, [name]: numericValue }));
        }
      }

      if (name === "au_iban" || name === "nz_iban") {
        const result = validateIBAN(value);
        if (!result.isValid) {
          error = result.errorMessage;
        }
      }

      if (name === "au_swift" || name === "nz_swift") {
        const result = validateSWIFT(value);
        if (!result.isValid) {
          error = result.errorMessage;
        }
      }

      // Update errors state if there's an error
      if (error) {
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      } else {
        // Clear error if validation passes
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  // Get vendor trading entities on component mount
  useEffect(() => {
    if (session?.accessToken) {
      fetchTradingEntities();
    }
  }, [session]);

  // Fetch trading entities
  const fetchTradingEntities = async () => {
    try {
      setIsLoading(true);
      if (!email) {
        console.error("No email available in URL");
        return;
      }

      const response = await axios.get(`/api/supplier-onboarding/${email}`);

      const { vendorInfo, tradingEntities } = response.data;

      console.log(vendorInfo);
      setTradingEntities(tradingEntities);

      const auEntities = tradingEntities.filter(
        (entity: TradingEntity) => entity.paymentCountry === "Australia"
      );
      const nzEntities = tradingEntities.filter(
        (entity: TradingEntity) => entity.paymentCountry === "New Zealand"
      );

      setHasAuEntities(auEntities.length > 0);
      setHasNzEntities(nzEntities.length > 0);

      setFormData((prev) => ({
        ...prev,
        business_name: vendorInfo.business_name,
      }));
      setVendorCountry(vendorCountry);
    } catch (error) {
      console.error("Error fetching trading entities:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // Populate form with user data
  useEffect(() => {
    if (session?.user) {
      const user = (session as Session).user;

      if (user) {
        setFormData((prev) => ({
          ...prev,
          primary_contact_email: email || "",
          po_email: email || "",
          return_order_email: email || "",
        }));
      }
    }
  }, [session]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    // For checkbox type inputs
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      // Handle BSB and Account number formatting in real-time
      if (name === "au_bsb" || name === "nz_bsb") {
        // Only allow numeric input for BSB
        const numericValue = value.replace(/\D/g, "");
        if (numericValue.length <= 6) {
          // Limit to 6 digits
          setFormData((prev) => ({
            ...prev,
            [name]: numericValue,
          }));
        }
      } else if (name === "au_account" || name === "nz_account") {
        // Only allow numeric input for account numbers
        const numericValue = value.replace(/\D/g, "");
        if (numericValue.length <= 10) {
          // Limit to 10 digits
          setFormData((prev) => ({
            ...prev,
            [name]: numericValue,
          }));
        }
      } else if (name === "address" && value.length > 100) {
        // For address field, enforce 100 character limit
        return;
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle trading entity selection
  const handleTradingEntityChange = (entityId: string) => {
    const currentEntities = [...formData.trading_entities];
    const index = currentEntities.indexOf(entityId);

    if (index === -1) {
      // Add entity
      currentEntities.push(entityId);
    } else {
      // Remove entity
      currentEntities.splice(index, 1);
    }

    setFormData((prev) => ({
      ...prev,
      trading_entities: currentEntities,
    }));

    // Update AU/NZ entity flags
    const selectedEntities = tradingEntities.filter((entity) =>
      currentEntities.includes(entity.TradingEntityId)
    );

    const hasAu = selectedEntities.some(
      (entity) => entity.entityCountry === "Australia"
    );
    const hasNz = selectedEntities.some(
      (entity) => entity.entityCountry === "New Zealand"
    );

    setHasAuEntities(hasAu);
    setHasNzEntities(hasNz);
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setBankStatement(file);
        setFileError("");
      } else {
        setBankStatement(null);
        setFileError("Please upload a PDF file");
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Required fields validation
    const requiredFields = [
      "business_name",
      "trading_name",
      "country",
      "gst_registered",
      "city",
      "state",
      "postcode",
      "primary_contact_email",
      "telephone",
      "po_email",
      "return_order_email",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof SupplierFormData]) {
        newErrors[field] = "This field is required";
      }
    });

    // Add region-specific payment method validation
    if (hasAuEntities && !formData.au_payment_method) {
      newErrors["au_payment_method"] = "This field is required";
    }
    if (hasNzEntities && !formData.nz_payment_method) {
      newErrors["nz_payment_method"] = "This field is required";
    }

    // Email validation with proper regex pattern
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const emailFields = [
      "primary_contact_email",
      "po_email",
      "return_order_email",
    ];

    // Add conditional email fields
    if (hasAuEntities) emailFields.push("au_remittance_email");
    if (hasNzEntities) emailFields.push("nz_remittance_email");

    emailFields.forEach((field) => {
      const value = formData[field as keyof SupplierFormData] as string;
      if (value) {
        if (!emailRegex.test(value)) {
          newErrors[field] = "Please enter a valid email address";
        }
      } else if (field !== "au_remittance_email" || hasAuEntities) {
        // Only mark conditional fields as required when the condition is met
        newErrors[field] = "This field is required";
      }
    });

    // Country-specific tax ID validations
    if (formData.country === "Australia" && formData.has_tax_id === "Yes") {
      if (!formData.abn) {
        newErrors["abn"] = "ABN is required";
      } else if (!/^\d{11}$/.test(formData.abn)) {
        newErrors["abn"] = "ABN must be 11 digits";
      }
    }

    if (formData.country === "New Zealand" && formData.has_tax_id === "Yes") {
      if (!formData.gst) {
        newErrors["gst"] = "GST number is required";
      }
    }

    // Validate invoice currencies when trading entities are selected
    if (hasAuEntities && !formData.au_invoice_currency) {
      newErrors["au_invoice_currency"] =
        "Invoice currency is required for Australian entities";
    }

    if (hasNzEntities && !formData.nz_invoice_currency) {
      newErrors["nz_invoice_currency"] =
        "Invoice currency is required for New Zealand entities";
    }

    // AU payment validation
    if (hasAuEntities && formData.au_payment_method === "Bank Transfer") {
      // Required AU banking fields
      const requiredAuFields = [
        "au_bank_country",
        "au_bank_address",
        "au_bank_currency_code",
        "au_remittance_email",
      ];

      requiredAuFields.forEach((field) => {
        if (!formData[field as keyof SupplierFormData]) {
          newErrors[field] = "This field is required";
        }
      });

      // Australian domestic banking
      if (formData.au_bank_country === "Australia") {
        if (!formData.au_bsb) {
          newErrors["au_bsb"] = "BSB is required";
        } else {
          const bsbResult = validateBSB(formData.au_bsb);
          if (!bsbResult.isValid) {
            newErrors["au_bsb"] = bsbResult.errorMessage;
          }
        }

        if (!formData.au_account) {
          newErrors["au_account"] = "Account number is required";
        } else {
          const accountResult = validateAccount(formData.au_account);
          if (!accountResult.isValid) {
            newErrors["au_account"] = accountResult.errorMessage;
          }
        }
      }
    } else if (hasAuEntities && formData.au_payment_method === "Bpay") {
      // Required AU Bpay fields
      const requiredAuBpayFields = ["au_biller_code", "au_ref_code"];

      requiredAuBpayFields.forEach((field) => {
        if (!formData[field as keyof SupplierFormData]) {
          newErrors[field] = "This field is required";
        }
      });

      // Validate AU Bpay fields format
      if (!/^\d+$/.test(formData.au_biller_code)) {
        newErrors["au_biller_code"] = "Biller code must contain only numbers";
      }

      if (!/^\d+$/.test(formData.au_ref_code)) {
        newErrors["au_ref_code"] = "Reference code must contain only numbers";
      }
    }

    // NZ payment validation
    if (hasNzEntities && formData.nz_payment_method === "Bank Transfer") {
      // Required NZ banking fields
      const requiredNzFields = [
        "nz_bank_country",
        "nz_bank_address",
        "nz_bank_currency_code",
        "nz_remittance_email",
      ];

      requiredNzFields.forEach((field) => {
        if (!formData[field as keyof SupplierFormData]) {
          newErrors[field] = "This field is required";
        }
      });

      // New Zealand domestic banking
      if (formData.nz_bank_country === "New Zealand") {
        if (!formData.nz_bsb) {
          newErrors["nz_bsb"] = "BSB is required";
        } else {
          const bsbResult = validateBSB(formData.nz_bsb);
          if (!bsbResult.isValid) {
            newErrors["nz_bsb"] = bsbResult.errorMessage;
          }
        }

        if (!formData.nz_account) {
          newErrors["nz_account"] = "Account number is required";
        } else {
          const accountResult = validateAccount(formData.nz_account);
          if (!accountResult.isValid) {
            newErrors["nz_account"] = accountResult.errorMessage;
          }
        }
      }
    } else if (hasNzEntities && formData.nz_payment_method === "Bpay") {
      // Required NZ Bpay fields
      const requiredNzBpayFields = ["nz_biller_code", "nz_ref_code"];

      requiredNzBpayFields.forEach((field) => {
        if (!formData[field as keyof SupplierFormData]) {
          newErrors[field] = "This field is required";
        }
      });

      // Validate NZ Bpay fields format
      if (!/^\d+$/.test(formData.nz_biller_code)) {
        newErrors["nz_biller_code"] = "Biller code must contain only numbers";
      }

      if (!/^\d+$/.test(formData.nz_ref_code)) {
        newErrors["nz_ref_code"] = "Reference code must contain only numbers";
      }
    }

    // Azure-compliant banking validation with correct country-specific field naming
    // AU Overseas banking validation
    if (formData.au_bank_country && formData.au_bank_country !== "Australia") {
      if (!formData.au_iban_switch) {
        newErrors["au_iban_switch"] =
          "Please select IBAN or SWIFT for AU banking";
      } else if (formData.au_iban_switch === "IBAN") {
        const ibanResult = validateIBAN(formData.au_iban);
        if (!ibanResult.isValid) {
          newErrors["au_iban"] = ibanResult.errorMessage;
        }
      } else if (formData.au_iban_switch === "SWIFT") {
        const swiftResult = validateSWIFT(formData.au_swift);
        if (!swiftResult.isValid) {
          newErrors["au_swift"] = swiftResult.errorMessage;
        }
      }
    }

    // NZ Overseas banking validation
    if (
      formData.nz_bank_country &&
      formData.nz_bank_country !== "New Zealand"
    ) {
      if (!formData.nz_iban_switch) {
        newErrors["nz_iban_switch"] =
          "Please select IBAN or SWIFT for NZ banking";
      } else if (formData.nz_iban_switch === "IBAN") {
        const ibanResult = validateIBAN(formData.nz_iban);
        if (!ibanResult.isValid) {
          newErrors["nz_iban"] = ibanResult.errorMessage;
        }
      } else if (formData.nz_iban_switch === "SWIFT") {
        const swiftResult = validateSWIFT(formData.nz_swift);
        if (!swiftResult.isValid) {
          newErrors["nz_swift"] = swiftResult.errorMessage;
        }
      }
    }

    // Bank statement validation
    if (!bankStatement) {
      setFileError("Bank statement is required");
    } else {
      setFileError("");
    }

    // Terms agreement validation
    if (!formData.iAgree) {
      newErrors["iAgree"] = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    const hasErrors = Object.keys(newErrors).length > 0 || fileError !== "";
    return !hasErrors;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");

    // Validate the form first
    const isValid = validateForm();
    if (!isValid) {
      // Scroll to the first error
      const firstErrorElement = document.querySelector(".border-red-500");
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    // If valid, proceed with confirmation
    setShowConfirmation(true);
  };

  // Handle confirmation
  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    setShowConfirmation(false);

    try {
      // Submit form data to the API with authentication token
      const response = await axios.put(
        `/api/supplier-onboarding/${email}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setShowSuccess(true);
      } else {
        alert(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // Enhanced error handling
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 403) {
          alert(
            "You don't have permission to submit this form. Please contact support."
          );
        } else if (error.response.status === 401) {
          alert("Your session has expired. Please log in again.");
          // Consider redirecting to login page
        } else {
          alert(
            `Error (${error.response.status}): ${
              error.response.data.message || "An error occurred"
            }`
          );
        }
      } else {
        alert("An error occurred while submitting the form. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle success close
  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push("/");
  };

  // Group trading entities by country
  const auTradingEntities = tradingEntities.filter(
    (entity) => entity.entityCountry === "Australia"
  );

  const nzTradingEntities = tradingEntities.filter(
    (entity) => entity.entityCountry === "New Zealand"
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Supplier {isEditable ? "Onboarding Form" : "Details"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Supplier Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl  font-semibold mb-6">1. Supplier Details</h2>

            <div className="space-y-6 bg-white rounded-md">
              {/* Business Name (Read-only from Vendor Creation page) */}
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <ConditionalInput
                  isEditable={isEditable}
                  type="text"
                  name="business_name"
                  onChange={handleSelectChange}
                  onBlur={handleInputBlur}
                  value={formData.business_name}
                  placeholder="Business Name"
                />
              </div>

              {/* Trading Name */}
              <div className="space-y-2">
                <Label htmlFor="trading_name">
                  Trading Name (if different to Business Name)
                  {isEditable && <span className="text-red-500">*</span>}
                </Label>
                <ConditionalInput
                  isEditable={isEditable}
                  type="text"
                  name="trading_name"
                  value={formData.trading_name || ""}
                  onChange={handleSelectChange}
                  onBlur={handleInputBlur}
                  required={isEditable}
                  placeholder="Trading Name"
                  className={errors.trading_name ? "border-red-500" : ""}
                />
                {errors.trading_name && isEditable && (
                  <p className="text-red-500 text-sm">{errors.trading_name}</p>
                )}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <ConditionalInput
                  isEditable={isEditable}
                  type="text"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleSelectChange}
                  placeholder="https://example.com"
                />
              </div>

              {/* GST Registered - MOVED ABOVE COUNTRY */}
              <div className="space-y-2">
                <Label htmlFor="gst_registered">
                  Registered for GST?<span className="text-red-500">*</span>
                </Label>
                <ConditionalInput
                  isEditable={isEditable}
                  type="select"
                  name="gst_registered"
                  value={formData.gst_registered}
                  onChange={handleSelectChange}
                  onBlur={handleInputBlur}
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  required={true}
                  className={errors.gst_registered ? "border-red-500" : ""}
                  placeholder="Select Yes or No"
                />
                {errors.gst_registered && (
                  <p className="text-red-500 text-sm">
                    {errors.gst_registered}
                  </p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">
                  Country<span className="text-red-500">*</span>
                </Label>
                <ConditionalInput
                  isEditable={isEditable}
                  type="select"
                  name="country"
                  value={formData.country}
                  onChange={handleSelectChange}
                  onBlur={handleInputBlur}
                  options={countries.map((country) => ({
                    value: country,
                    label: country,
                  }))}
                  required={true}
                  className={errors.country ? "border-red-500" : ""}
                  placeholder="Select a country"
                />
                {errors.country && (
                  <p className="text-red-500 text-sm">{errors.country}</p>
                )}
              </div>

              {/* Has tax id - MOVED TO FULL WIDTH */}
              {formData.country &&
                formData.country !== "New Zealand" &&
                formData.country !== "Australia" && (
                  <div className="space-y-2">
                    <Label htmlFor="has_tax_id">
                      If you have an ABN or NZ GST, please provide your details
                      below.
                    </Label>
                    <ConditionalInput
                      isEditable={isEditable}
                      type="select"
                      name="has_tax_id"
                      value={formData.has_tax_id}
                      onChange={handleSelectChange}
                      onBlur={handleInputBlur}
                      options={[
                        { value: "Yes", label: "Yes" },
                        { value: "No", label: "No" },
                      ]}
                      required={Boolean(
                        formData.country &&
                          !["New Zealand", "Australia"].includes(
                            formData.country
                          )
                      )}
                      className={errors.has_tax_id ? "border-red-500" : ""}
                      placeholder="Select Yes or No"
                    />
                    {errors.has_tax_id && (
                      <p className="text-red-500 text-sm">
                        {errors.has_tax_id}
                      </p>
                    )}
                  </div>
                )}

              {/* ABN or GST */}
              {formData.country &&
                formData.country !== "New Zealand" &&
                formData.country !== "Australia" &&
                formData.has_tax_id === "Yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="ABN_GST">ABN or GST</Label>
                    <ConditionalInput
                      isEditable={isEditable}
                      type="select"
                      name="ABN_GST"
                      value={formData.ABN_GST}
                      onChange={handleSelectChange}
                      options={[
                        { value: "ABN", label: "ABN" },
                        { value: "GST", label: "GST" },
                      ]}
                      className={errors.ABN_GST ? "border-red-500" : ""}
                      placeholder="Select ABN or GST"
                    />
                    {errors.ABN_GST && (
                      <p className="text-red-500 text-sm">{errors.ABN_GST}</p>
                    )}
                  </div>
                )}

              {/* GST - Only for New Zealand */}
              {(formData.country === "New Zealand" ||
                (formData.country !== "New Zealand" &&
                  formData.ABN_GST === "GST" &&
                  formData.has_tax_id === "Yes")) && (
                <div className="space-y-2">
                  <Label htmlFor="gst">
                    New Zealand Goods & Services Tax Number (GST)
                    <span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="gst"
                    value={formData.gst || ""}
                    onChange={handleSelectChange}
                    inputMode="numeric"
                    className={errors.gst ? "border-red-500" : ""}
                  />
                  {errors.gst && (
                    <p className="text-red-500 text-sm">{errors.gst}</p>
                  )}
                </div>
              )}

              {/* ABN - Only for Australia */}
              {(formData.country === "Australia" ||
                (formData.country !== "Australia" &&
                  formData.ABN_GST === "ABN" &&
                  formData.has_tax_id === "Yes")) && (
                <div className="space-y-2">
                  <Label htmlFor="abn">
                    Australian Business Number (ABN)
                    <span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="abn"
                    value={formData.abn || ""}
                    onChange={handleSelectChange}
                    inputMode="numeric"
                    maxLength={11}
                    className={errors.abn ? "border-red-500" : ""}
                  />
                  {errors.abn && (
                    <p className="text-red-500 text-sm">{errors.abn}</p>
                  )}
                </div>
              )}

              {/* Address - with 100 character limit */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <ConditionalInput
                  isEditable={isEditable}
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleSelectChange}
                  placeholder="Enter your address (max 100 characters)"
                  maxLength={100}
                  className={errors.address ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-500">
                  {formData.address.length}/100 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleSelectChange}
                    required={true}
                    className={errors.city ? "border-red-500" : ""}
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm">{errors.city}</p>
                  )}
                </div>

                {/* State */}
                <div className="space-y-2">
                  <Label htmlFor="state">
                    State<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleSelectChange}
                    required={true}
                    className={errors.state ? "border-red-500" : ""}
                    placeholder="Enter state"
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm">{errors.state}</p>
                  )}
                </div>

                {/* Postcode */}
                <div className="space-y-2">
                  <Label htmlFor="postcode">
                    Postcode<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleSelectChange}
                    inputMode="numeric"
                    required={true}
                    className={errors.postcode ? "border-red-500" : ""}
                    placeholder="Enter postcode"
                  />
                  {errors.postcode && (
                    <p className="text-red-500 text-sm">{errors.postcode}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 gap-6">
                {/* Primary Contact Email */}
                <div className="space-y-2">
                  <Label htmlFor="primary_contact_email">
                    Primary Contact Email<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="email"
                    name="primary_contact_email"
                    value={formData.primary_contact_email}
                    onChange={handleSelectChange}
                    onBlur={handleInputBlur}
                    required={true}
                    placeholder="example@domain.com"
                    className={
                      errors.primary_contact_email ? "border-red-500" : ""
                    }
                  />
                  {errors.primary_contact_email && (
                    <p className="text-red-500 text-sm">
                      {errors.primary_contact_email}
                    </p>
                  )}
                </div>

                {/* Telephone */}
                <div className="space-y-2">
                  <Label htmlFor="telephone">
                    Telephone<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleSelectChange}
                    inputMode="numeric"
                    required={true}
                    className={errors.telephone ? "border-red-500" : ""}
                    placeholder="Enter telephone number"
                  />
                  {errors.telephone && (
                    <p className="text-red-500 text-sm">{errors.telephone}</p>
                  )}
                </div>

                {/* PO Email */}
                <div className="space-y-2">
                  <Label htmlFor="po_email">
                    PO Email<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="email"
                    name="po_email"
                    value={formData.po_email || ""}
                    onChange={handleSelectChange}
                    onBlur={handleInputBlur}
                    required={true}
                    placeholder="example@domain.com"
                    className={errors.po_email ? "border-red-500" : ""}
                  />
                  {errors.po_email && (
                    <p className="text-red-500 text-sm">{errors.po_email}</p>
                  )}
                </div>

                {/* Return Order Email */}
                <div className="space-y-2">
                  <Label htmlFor="return_order_email">
                    Return Order Email<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="email"
                    name="return_order_email"
                    value={formData.return_order_email}
                    onChange={handleSelectChange}
                    onBlur={handleInputBlur}
                    required={true}
                    placeholder="example@domain.com"
                    className={
                      errors.return_order_email ? "border-red-500" : ""
                    }
                  />
                  {errors.return_order_email && (
                    <p className="text-red-500 text-sm">
                      {errors.return_order_email}
                    </p>
                  )}
                </div>
              </div>

              {/* Invoice Currency sections based on trading entities */}
              {(hasAuEntities || hasNzEntities) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AU Invoice Currency */}
                  {hasAuEntities && (
                    <div className="space-y-2">
                      <Label htmlFor="au_invoice_currency">
                        Select the Invoice currency when trading with our AU
                        based entity(ies)
                        <span className="text-red-500">*</span>
                      </Label>
                      <ConditionalInput
                        isEditable={isEditable}
                        type="select"
                        name="au_invoice_currency"
                        value={formData.au_invoice_currency || ""}
                        onChange={handleSelectChange}
                        onBlur={handleInputBlur}
                        options={currencies.map((currency) => ({
                          value: currency.value,
                          label: currency.label,
                        }))}
                        required={true}
                        className={
                          errors.au_invoice_currency ? "border-red-500" : ""
                        }
                        placeholder="Select a currency"
                      />
                      {errors.au_invoice_currency && (
                        <p className="text-red-500 text-sm">
                          {errors.au_invoice_currency}
                        </p>
                      )}
                    </div>
                  )}

                  {/* NZ Invoice Currency */}
                  {hasNzEntities && (
                    <div className="space-y-2">
                      <Label htmlFor="nz_invoice_currency">
                        Select the Invoice currency when trading with NZ based
                        entity(ies)
                        <span className="text-red-500">*</span>
                      </Label>
                      <ConditionalInput
                        isEditable={isEditable}
                        type="select"
                        name="nz_invoice_currency"
                        value={formData.nz_invoice_currency || ""}
                        onChange={handleSelectChange}
                        options={currencies.map((currency) => ({
                          value: currency.value,
                          label: currency.label,
                        }))}
                        required={true}
                        onBlur={handleInputBlur}
                        className={
                          errors.nz_invoice_currency ? "border-red-500" : ""
                        }
                        placeholder="Select a currency"
                      />
                      {errors.nz_invoice_currency && (
                        <p className="text-red-500 text-sm">
                          {errors.nz_invoice_currency}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Banking Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">2. Banking Details</h2>

            {/* AU Payment Container - Always shown when AU entities exist */}
            {hasAuEntities && (
              <div className="bg-white p-4 rounded-md border mb-6">
                <h3 className="font-medium mb-4">
                  Payment details for Australian entities
                </h3>

                {/* AU Payment Method Selection - Now inside the container */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="au_payment_method">
                    Payment Method<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="select"
                    name="au_payment_method"
                    value={formData.au_payment_method || ""}
                    onChange={handleSelectChange}
                    options={[
                      { value: "Bank Transfer", label: "Bank Transfer" },
                      { value: "Bpay", label: "Bpay" },
                    ]}
                    onBlur={handleInputBlur}
                    required={hasAuEntities}
                    className={errors.au_payment_method ? "border-red-500" : ""}
                    placeholder="Select Payment Method for Australia"
                  />
                  {errors.au_payment_method && (
                    <p className="text-red-500 text-sm">
                      {errors.au_payment_method}
                    </p>
                  )}
                </div>

                {/* BPay Fields - Conditionally rendered inside the container */}
                {formData.au_payment_method === "Bpay" && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">BPay details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="au_biller_code">
                          Biller Code<span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="text"
                          name="au_biller_code"
                          value={formData.au_biller_code || ""}
                          onChange={handleSelectChange}
                          onBlur={handleInputBlur}
                          pattern="\\d+"
                          inputMode="numeric"
                          className={
                            errors.au_biller_code ? "border-red-500" : ""
                          }
                        />
                        {errors.au_biller_code && (
                          <p className="text-red-500 text-sm">
                            {errors.au_biller_code}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Numbers only</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="au_ref_code">
                          Reference Code<span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="text"
                          name="au_ref_code"
                          value={formData.au_ref_code || ""}
                          onChange={handleSelectChange}
                          onBlur={handleInputBlur}
                          pattern="\\d+"
                          inputMode="numeric"
                          className={errors.au_ref_code ? "border-red-500" : ""}
                        />
                        {errors.au_ref_code && (
                          <p className="text-red-500 text-sm">
                            {errors.au_ref_code}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Numbers only</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Fields - Conditionally rendered inside the container */}
                {formData.au_payment_method === "Bank Transfer" && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Bank Transfer details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="au_bank_country">
                          Bank Country<span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="select"
                          name="au_bank_country"
                          value={formData.au_bank_country || ""}
                          onChange={handleSelectChange}
                          options={countries.map((country) => ({
                            value: country,
                            label: country,
                          }))}
                          className={
                            errors.au_bank_country ? "border-red-500" : ""
                          }
                          placeholder="Select a country"
                        />
                        {errors.au_bank_country && (
                          <p className="text-red-500 text-sm">
                            {errors.au_bank_country}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="au_bank_address">
                          Bank Address<span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="text"
                          name="au_bank_address"
                          value={formData.au_bank_address || ""}
                          onChange={handleSelectChange}
                          className={
                            errors.au_bank_address ? "border-red-500" : ""
                          }
                        />
                        {errors.au_bank_address && (
                          <p className="text-red-500 text-sm">
                            {errors.au_bank_address}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="au_bank_currency_code">
                          Bank Currency Code
                          <span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="select"
                          name="au_bank_currency_code"
                          value={formData.au_bank_currency_code || ""}
                          onChange={handleSelectChange}
                          options={currencies.map((currency) => ({
                            value: currency.value,
                            label: currency.label,
                          }))}
                          className={
                            errors.au_bank_currency_code ? "border-red-500" : ""
                          }
                          placeholder="Select a currency"
                        />
                        {errors.au_bank_currency_code && (
                          <p className="text-red-500 text-sm">
                            {errors.au_bank_currency_code}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="au_bank_clearing_code">
                          Bank Clearing Code
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="text"
                          name="au_bank_clearing_code"
                          value={formData.au_bank_clearing_code || ""}
                          onChange={handleSelectChange}
                          className={
                            errors.au_bank_clearing_code ? "border-red-500" : ""
                          }
                        />
                        {errors.au_bank_clearing_code && (
                          <p className="text-red-500 text-sm">
                            {errors.au_bank_clearing_code}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="au_remittance_email">
                          Remittance Email
                          <span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="email"
                          name="au_remittance_email"
                          value={formData.au_remittance_email || ""}
                          onChange={handleSelectChange}
                          onBlur={handleInputBlur}
                          placeholder="example@domain.com"
                          className={
                            errors.au_remittance_email ? "border-red-500" : ""
                          }
                        />
                        {errors.au_remittance_email && (
                          <p className="text-red-500 text-sm">
                            {errors.au_remittance_email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* AU Domestic Banking - For Australian banks */}
                    {formData.au_bank_country === "Australia" && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="au_bsb">
                            BSB<span className="text-red-500">*</span>
                          </Label>
                          <ConditionalInput
                            isEditable={isEditable}
                            type="text"
                            name="au_bsb"
                            value={formData.au_bsb || ""}
                            onChange={handleSelectChange}
                            maxLength={6}
                            onBlur={handleInputBlur}
                            inputMode="numeric"
                            className={errors.au_bsb ? "border-red-500" : ""}
                          />
                          {errors.au_bsb && (
                            <p className="text-red-500 text-sm">
                              {errors.au_bsb}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="au_account">
                            Account Number
                            <span className="text-red-500">*</span>
                          </Label>
                          <ConditionalInput
                            isEditable={isEditable}
                            type="text"
                            name="au_account"
                            value={formData.au_account || ""}
                            onChange={handleSelectChange}
                            onBlur={handleInputBlur}
                            maxLength={10}
                            inputMode="numeric"
                            className={
                              errors.au_account ? "border-red-500" : ""
                            }
                          />
                          {errors.au_account && (
                            <p className="text-red-500 text-sm">
                              {errors.au_account}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* NZ Domestic Banking - For New Zealand banks */}
                    {formData.au_bank_country === "New Zealand" && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="au_bsb">
                            NZ Bank Code<span className="text-red-500">*</span>
                          </Label>
                          <ConditionalInput
                            isEditable={isEditable}
                            type="text"
                            name="au_bsb"
                            value={formData.au_bsb || ""}
                            onChange={handleSelectChange}
                            onBlur={handleInputBlur}
                            maxLength={6}
                            inputMode="numeric"
                            className={errors.au_bsb ? "border-red-500" : ""}
                          />
                          {errors.au_bsb && (
                            <p className="text-red-500 text-sm">
                              {errors.au_bsb}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="au_account">
                            NZ Account Number
                            <span className="text-red-500">*</span>
                          </Label>
                          <ConditionalInput
                            isEditable={isEditable}
                            type="text"
                            name="au_account"
                            value={formData.au_account || ""}
                            onChange={handleSelectChange}
                            onBlur={handleInputBlur}
                            maxLength={10}
                            inputMode="numeric"
                            className={
                              errors.au_account ? "border-red-500" : ""
                            }
                          />
                          {errors.au_account && (
                            <p className="text-red-500 text-sm">
                              {errors.au_account}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Overseas Banking - For non-AU/NZ banks */}
                    {formData.au_bank_country &&
                      formData.au_bank_country !== "Australia" &&
                      formData.au_bank_country !== "New Zealand" && (
                        <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4">
                          <div className="space-y-2 mb-4">
                            <Label htmlFor="au_iban_switch">
                              IBAN or SWIFT
                              <span className="text-red-500">*</span>
                            </Label>
                            <ConditionalInput
                              isEditable={isEditable}
                              type="select"
                              name="au_iban_switch"
                              value={formData.au_iban_switch || ""}
                              onChange={handleSelectChange}
                              options={[
                                { value: "IBAN", label: "IBAN" },
                                { value: "SWIFT", label: "SWIFT" },
                              ]}
                              className={
                                errors.au_iban_switch ? "border-red-500" : ""
                              }
                              placeholder="Select an option"
                            />
                            {errors.au_iban_switch && (
                              <p className="text-red-500 text-sm">
                                {errors.au_iban_switch}
                              </p>
                            )}

                            {formData.au_iban_switch === "IBAN" && (
                              <div className="space-y-2">
                                <Label htmlFor="au_iban">
                                  IBAN<span className="text-red-500">*</span>
                                </Label>
                                <ConditionalInput
                                  isEditable={isEditable}
                                  type="text"
                                  name="au_iban"
                                  value={formData.au_iban || ""}
                                  onChange={handleSelectChange}
                                  onBlur={handleInputBlur}
                                  className={
                                    errors.au_iban ? "border-red-500" : ""
                                  }
                                />
                                {errors.au_iban && (
                                  <p className="text-red-500 text-sm">
                                    {errors.au_iban}
                                  </p>
                                )}
                              </div>
                            )}

                            {formData.au_iban_switch === "SWIFT" && (
                              <div className="space-y-2">
                                <Label htmlFor="au_swift">
                                  SWIFT<span className="text-red-500">*</span>
                                </Label>
                                <ConditionalInput
                                  isEditable={isEditable}
                                  type="text"
                                  name="au_swift"
                                  value={formData.au_swift || ""}
                                  onChange={handleSelectChange}
                                  onBlur={handleInputBlur}
                                  className={
                                    errors.au_swift ? "border-red-500" : ""
                                  }
                                />
                                {errors.au_swift && (
                                  <p className="text-red-500 text-sm">
                                    {errors.au_swift}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* NZ Payment Container - Always shown when NZ entities exist */}
            {hasNzEntities && (
              <div className="bg-white p-4 rounded-md border mb-6">
                <h3 className="font-medium mb-4">
                  Payment details for New Zealand entities
                </h3>

                {/* NZ Payment Method Selection - Inside the container */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="nz_payment_method">
                    Payment Method<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="select"
                    name="nz_payment_method"
                    value={formData.nz_payment_method || ""}
                    onChange={handleSelectChange}
                    options={[
                      { value: "Bank Transfer", label: "Bank Transfer" },
                      { value: "Bpay", label: "Bpay" },
                    ]}
                    required={hasNzEntities}
                    className={errors.nz_payment_method ? "border-red-500" : ""}
                    placeholder="Select Payment Method for New Zealand"
                  />
                  {errors.nz_payment_method && (
                    <p className="text-red-500 text-sm">
                      {errors.nz_payment_method}
                    </p>
                  )}
                </div>

                {/* BPay Fields - Conditionally rendered inside the container */}
                {formData.nz_payment_method === "Bpay" && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">BPay details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nz_biller_code">
                          Biller Code<span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="text"
                          name="nz_biller_code"
                          value={formData.nz_biller_code || ""}
                          onChange={handleSelectChange}
                          pattern="\\d+"
                          inputMode="numeric"
                          className={
                            errors.nz_biller_code ? "border-red-500" : ""
                          }
                        />
                        {errors.nz_biller_code && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_biller_code}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Numbers only</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nz_ref_code">
                          Reference Code<span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="text"
                          name="nz_ref_code"
                          value={formData.nz_ref_code || ""}
                          onChange={handleSelectChange}
                          pattern="\\d+"
                          inputMode="numeric"
                          className={errors.nz_ref_code ? "border-red-500" : ""}
                        />
                        {errors.nz_ref_code && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_ref_code}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">Numbers only</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Fields - Conditionally rendered inside the container */}
                {formData.nz_payment_method === "Bank Transfer" && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Bank Transfer details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nz_bank_country">
                          Bank Country<span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="select"
                          name="nz_bank_country"
                          value={formData.nz_bank_country || ""}
                          onChange={handleSelectChange}
                          options={countries.map((country) => ({
                            value: country,
                            label: country,
                          }))}
                          className={
                            errors.nz_bank_country ? "border-red-500" : ""
                          }
                          placeholder="Select a country"
                        />
                        {errors.nz_bank_country && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_bank_country}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nz_bank_address">
                          Bank Address<span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="text"
                          name="nz_bank_address"
                          value={formData.nz_bank_address || ""}
                          onChange={handleSelectChange}
                          className={
                            errors.nz_bank_address ? "border-red-500" : ""
                          }
                        />
                        {errors.nz_bank_address && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_bank_address}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nz_bank_currency_code">
                          Bank Currency Code
                          <span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="select"
                          name="nz_bank_currency_code"
                          value={formData.nz_bank_currency_code || ""}
                          onChange={handleSelectChange}
                          options={currencies.map((currency) => ({
                            value: currency.value,
                            label: currency.label,
                          }))}
                          className={
                            errors.nz_bank_currency_code ? "border-red-500" : ""
                          }
                          placeholder="Select a currency"
                        />
                        {errors.nz_bank_currency_code && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_bank_currency_code}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nz_bank_clearing_code">
                          Bank Clearing Code
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="text"
                          name="nz_bank_clearing_code"
                          value={formData.nz_bank_clearing_code || ""}
                          onChange={handleSelectChange}
                          className={
                            errors.nz_bank_clearing_code ? "border-red-500" : ""
                          }
                        />
                        {errors.nz_bank_clearing_code && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_bank_clearing_code}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nz_remittance_email">
                          Remittance Email
                          <span className="text-red-500">*</span>
                        </Label>
                        <ConditionalInput
                          isEditable={isEditable}
                          type="email"
                          name="nz_remittance_email"
                          value={formData.nz_remittance_email || ""}
                          onChange={handleSelectChange}
                          onBlur={handleInputBlur}
                          placeholder="example@domain.com"
                          className={
                            errors.nz_remittance_email ? "border-red-500" : ""
                          }
                        />
                        {errors.nz_remittance_email && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_remittance_email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* NZ Domestic Banking - For New Zealand banks */}
                    {formData.nz_bank_country === "New Zealand" && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="nz_bsb">
                            NZ Bank Code<span className="text-red-500">*</span>
                          </Label>
                          <ConditionalInput
                            isEditable={isEditable}
                            type="text"
                            name="nz_bsb"
                            value={formData.nz_bsb || ""}
                            onChange={handleSelectChange}
                            maxLength={6}
                            onBlur={handleInputBlur}
                            inputMode="numeric"
                            className={errors.nz_bsb ? "border-red-500" : ""}
                          />
                          {errors.nz_bsb && (
                            <p className="text-red-500 text-sm">
                              {errors.nz_bsb}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nz_account">
                            NZ Account Number
                            <span className="text-red-500">*</span>
                          </Label>
                          <ConditionalInput
                            isEditable={isEditable}
                            type="text"
                            name="nz_account"
                            value={formData.nz_account || ""}
                            onChange={handleSelectChange}
                            maxLength={10}
                            onBlur={handleInputBlur}
                            inputMode="numeric"
                            className={
                              errors.nz_account ? "border-red-500" : ""
                            }
                          />
                          {errors.nz_account && (
                            <p className="text-red-500 text-sm">
                              {errors.nz_account}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AU Domestic Banking - For Australian banks */}
                    {formData.nz_bank_country === "Australia" && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="nz_bsb">
                            BSB<span className="text-red-500">*</span>
                          </Label>
                          <ConditionalInput
                            isEditable={isEditable}
                            type="text"
                            name="nz_bsb"
                            value={formData.nz_bsb || ""}
                            onChange={handleSelectChange}
                            maxLength={6}
                            onBlur={handleInputBlur}
                            inputMode="numeric"
                            className={errors.nz_bsb ? "border-red-500" : ""}
                          />
                          {errors.nz_bsb && (
                            <p className="text-red-500 text-sm">
                              {errors.nz_bsb}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nz_account">
                            Account Number
                            <span className="text-red-500">*</span>
                          </Label>
                          <ConditionalInput
                            isEditable={isEditable}
                            type="text"
                            name="nz_account"
                            value={formData.nz_account || ""}
                            onChange={handleSelectChange}
                            maxLength={10}
                            onBlur={handleInputBlur}
                            inputMode="numeric"
                            className={
                              errors.nz_account ? "border-red-500" : ""
                            }
                          />
                          {errors.nz_account && (
                            <p className="text-red-500 text-sm">
                              {errors.nz_account}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* NZ Overseas Banking - Conditionally rendered */}
                    {formData.nz_bank_country &&
                      formData.nz_bank_country !== "New Zealand" &&
                      formData.nz_bank_country !== "Australia" && (
                        <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4">
                          <div className="space-y-2 mb-4">
                            <Label htmlFor="nz_iban_switch">
                              IBAN or SWIFT
                              <span className="text-red-500">*</span>
                            </Label>
                            <ConditionalInput
                              isEditable={isEditable}
                              type="select"
                              name="nz_iban_switch"
                              value={formData.nz_iban_switch || ""}
                              onChange={handleSelectChange}
                              onBlur={handleInputBlur}
                              options={[
                                { value: "IBAN", label: "IBAN" },
                                { value: "SWIFT", label: "SWIFT" },
                              ]}
                              className={
                                errors.nz_iban_switch ? "border-red-500" : ""
                              }
                              placeholder="Select an option"
                            />
                            {errors.nz_iban_switch && (
                              <p className="text-red-500 text-sm">
                                {errors.nz_iban_switch}
                              </p>
                            )}

                            {formData.nz_iban_switch === "IBAN" && (
                              <div className="space-y-2">
                                <Label htmlFor="nz_iban">
                                  IBAN<span className="text-red-500">*</span>
                                </Label>
                                <ConditionalInput
                                  isEditable={isEditable}
                                  type="text"
                                  name="nz_iban"
                                  value={formData.nz_iban || ""}
                                  onChange={handleSelectChange}
                                  onBlur={handleInputBlur}
                                  className={
                                    errors.nz_iban ? "border-red-500" : ""
                                  }
                                />
                                {errors.nz_iban && (
                                  <p className="text-red-500 text-sm">
                                    {errors.nz_iban}
                                  </p>
                                )}
                              </div>
                            )}

                            {formData.nz_iban_switch === "SWIFT" && (
                              <div className="space-y-2">
                                <Label htmlFor="nz_swift">
                                  SWIFT<span className="text-red-500">*</span>
                                </Label>
                                <ConditionalInput
                                  isEditable={isEditable}
                                  type="text"
                                  name="nz_swift"
                                  value={formData.nz_swift || ""}
                                  onBlur={handleInputBlur}
                                  onChange={handleSelectChange}
                                  className={
                                    errors.nz_swift ? "border-red-500" : ""
                                  }
                                />
                                {errors.nz_swift && (
                                  <p className="text-red-500 text-sm">
                                    {errors.nz_swift}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* Add Bank Statement Upload */}
            {((hasAuEntities &&
              formData.au_payment_method === "Bank Transfer") ||
              (hasNzEntities &&
                formData.nz_payment_method === "Bank Transfer")) && (
              <div className="bg-white p-4 rounded-md border mt-4">
                <h3 className="font-medium mb-4">Bank Statement</h3>
                <div className="space-y-2">
                  <Label htmlFor="bank_statement">
                    Upload Bank Statement (PDF only)
                    <span className="text-red-500">*</span>
                  </Label>
                  {isEditable ? (
                    <div className="space-y-2">
                      <Input
                        id="bank_statement"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className={fileError ? "border-red-500" : ""}
                      />
                      {bankStatement && (
                        <p className="text-sm text-green-600">
                          File selected: {bankStatement.name}
                        </p>
                      )}
                      {fileError && (
                        <p className="text-red-500 text-sm">{fileError}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Please upload a PDF copy of your bank statement or
                        document showing your bank details
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {bankStatement ? bankStatement.name : "No file uploaded"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Consent Statement */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">3. Consent Statement</h2>

            <div className="flex flex-col items-start">
              <button
                type="button"
                className="text-blue-600 underline cursor-pointer"
                onClick={() => setShowTerms(!showTerms)}
              >
                Please click to view the terms and conditions
                <span className="text-red-500">*</span>
              </button>

              {showTerms && (
                <div className="w-full bg-white border rounded-md p-4 mt-4 mb-4">
                  <div className="h-80 overflow-y-auto border p-4 mb-4">
                    <iframe
                      src="/Supplierterm.pdf"
                      width="100%"
                      height="100%"
                      title="Terms and Conditions"
                      className="border-0"
                    ></iframe>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="iAgree"
                      checked={formData.iAgree}
                      onCheckedChange={(checked: boolean | "indeterminate") => {
                        setFormData((prev) => ({
                          ...prev,
                          iAgree: checked === true,
                        }));
                        // Clear error when checked
                        if (checked && errors.iAgree) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.iAgree;
                            return newErrors;
                          });
                        }
                      }}
                      className={errors.iAgree ? "border-red-500" : ""}
                    />
                    <Label htmlFor="iAgree" className="font-medium">
                      I acknowledge the terms and conditions
                      <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  {errors.iAgree && (
                    <p className="text-red-500 text-sm mt-1">{errors.iAgree}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button - only show when form is editable and not hidden */}
          {isEditable && !hideSubmitButton && (
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Onboarding Form"
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>

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
          <p>Please confirm you want to submit this form.</p>
        </div>
      </Popup>

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Thank you!</h2>
            <p className="mb-6">
              Your form has been successfully submitted. Thanks!
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleSuccessClose}
                className="bg-green-600 hover:bg-green-700"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
