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
  ANB_GST: string;
  // Payment method
  payment_method: string;

  // AU specific fields
  au_invoice_currency?: string;
  au_bank_country?: string;
  au_bank_address?: string;
  au_bank_currency_code?: string;
  au_bank_clearing_code?: string;
  au_remittance_email?: string;
  au_bsb?: string;
  au_account?: string;

  // NZ specific fields
  nz_invoice_currency?: string;
  nz_bank_country?: string;
  nz_bank_address?: string;
  nz_bank_currency_code?: string;
  nz_bank_clearing_code?: string;
  nz_remittance_email?: string;
  nz_bsb?: string;
  nz_account?: string;

  // Overseas banking
  overseas_iban_switch?: string;
  overseas_iban?: string;
  overseas_swift?: string;

  // BPay
  biller_code?: string;
  ref_code?: string;

  // Terms agreement
  iAgree: boolean;
}

// Define validation errors type
interface FormErrors {
  [key: string]: string;
}

// Define props interface for SupplierForm
interface SupplierFormProps {
  isEditable?: boolean;
  email?: string;
  onDataChange?: (data: SupplierFormData) => void;
}

export default function SupplierFormExternal({
  isEditable = true,
  email: propEmail,
  onDataChange,
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
  const [formData, setFormData] = useState<SupplierFormData>({
    business_name: "",
    trading_name: "",
    country: "",
    gst_registered: "",
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
    payment_method: "Bank Transfer",
    iAgree: false,
    has_tax_id: "",
    ANB_GST: "",
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
  // Add this function to your component
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

      // Update errors state if there's an error
      if (error) {
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
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
      // For address field, enforce 100 character limit
      if (name === "address" && value.length > 100) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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

    // Required fields
    const requiredFields = [
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
      "payment_method",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof SupplierFormData]) {
        newErrors[field] = "This field is required";
      }
    });

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const emailFields = [
      "primary_contact_email",
      "po_email",
      "return_order_email",
    ];

    emailFields.forEach((field) => {
      const value = formData[field as keyof SupplierFormData] as string;
      if (value && !emailRegex.test(value)) {
        newErrors[field] = "Please enter a valid email address";
      }
    });

    // Trading entities validation
    if (formData.trading_entities.length === 0) {
      newErrors["trading_entities"] =
        "Please select at least one trading entity";
    }

    // Country-specific validations for GST/ABN
    if (vendorCountry === "Australia") {
      if (!formData.abn) {
        newErrors["abn"] = "ABN is required";
      } else if (!/^\d{11}$/.test(formData.abn)) {
        newErrors["abn"] = "ABN must be 11 digits";
      }
    }

    if (vendorCountry === "New Zealand") {
      if (!formData.gst) {
        newErrors["gst"] = "GST number is required";
      }
    }

    // AU invoice currency validation
    if (hasAuEntities && !formData.au_invoice_currency) {
      newErrors["au_invoice_currency"] =
        "Invoice currency is required for Australian entities";
    }

    // NZ invoice currency validation
    if (hasNzEntities && !formData.nz_invoice_currency) {
      newErrors["nz_invoice_currency"] =
        "Invoice currency is required for New Zealand entities";
    }

    // Payment method validations
    if (formData.payment_method === "Bank Transfer") {
      // AU Banking validation
      if (hasAuEntities) {
        if (!formData.au_bank_country) {
          newErrors["au_bank_country"] = "Bank country is required";
        }

        if (!formData.au_bank_address) {
          newErrors["au_bank_address"] = "Bank address is required";
        }

        if (!formData.au_bank_currency_code) {
          newErrors["au_bank_currency_code"] = "Bank currency code is required";
        }

        if (!formData.au_remittance_email) {
          newErrors["au_remittance_email"] = "Remittance email is required";
        }

        // AU domestic banking
        if (formData.au_bank_country === "Australia") {
          if (!formData.au_bsb) {
            newErrors["au_bsb"] = "BSB is required";
          } else if (!/^\d{6}$/.test(formData.au_bsb)) {
            newErrors["au_bsb"] = "BSB must be 6 digits";
          }

          if (!formData.au_account) {
            newErrors["au_account"] = "Account number is required";
          } else if (!/^\d{10}$/.test(formData.au_account)) {
            newErrors["au_account"] = "Account number must be 10 digits";
          }
        }
        // Overseas banking for AU entity
        else if (
          formData.au_bank_country &&
          formData.au_bank_country !== "Australia"
        ) {
          if (!formData.overseas_iban_switch) {
            newErrors["overseas_iban_switch"] = "Please select IBAN or SWIFT";
          } else if (formData.overseas_iban_switch === "IBAN") {
            if (!formData.overseas_iban) {
              newErrors["overseas_iban"] = "IBAN is required";
            }
          } else if (formData.overseas_iban_switch === "SWIFT") {
            if (!formData.overseas_swift) {
              newErrors["overseas_swift"] = "SWIFT is required";
            }
          }
        }
      }

      // NZ Banking validation
      if (hasNzEntities) {
        if (!formData.nz_bank_country) {
          newErrors["nz_bank_country"] = "Bank country is required";
        }

        if (!formData.nz_bank_address) {
          newErrors["nz_bank_address"] = "Bank address is required";
        }

        if (!formData.nz_bank_currency_code) {
          newErrors["nz_bank_currency_code"] = "Bank currency code is required";
        }

        if (!formData.nz_remittance_email) {
          newErrors["nz_remittance_email"] = "Remittance email is required";
        }

        // NZ domestic banking
        if (formData.nz_bank_country === "New Zealand") {
          if (!formData.nz_bsb) {
            newErrors["nz_bsb"] = "BSB is required";
          } else if (!/^\d{6}$/.test(formData.nz_bsb)) {
            newErrors["nz_bsb"] = "BSB must be 6 digits";
          }

          if (!formData.nz_account) {
            newErrors["nz_account"] = "Account number is required";
          } else if (!/^\d{10}$/.test(formData.nz_account)) {
            newErrors["nz_account"] = "Account number must be 10 digits";
          }
        }
        // Overseas banking for NZ entity
        else if (
          formData.nz_bank_country &&
          formData.nz_bank_country !== "New Zealand"
        ) {
          if (!formData.overseas_iban_switch) {
            newErrors["overseas_iban_switch"] = "Please select IBAN or SWIFT";
          } else if (formData.overseas_iban_switch === "IBAN") {
            if (!formData.overseas_iban) {
              newErrors["overseas_iban"] = "IBAN is required";
            }
          } else if (formData.overseas_iban_switch === "SWIFT") {
            if (!formData.overseas_swift) {
              newErrors["overseas_swift"] = "SWIFT is required";
            }
          }
        }
      }

      // Bank statement validation
      if (!bankStatement) {
        setFileError("Bank statement is required");
      }
    }
    // BPay validation
    else if (formData.payment_method === "Bpay") {
      if (!formData.biller_code) {
        newErrors["biller_code"] = "Biller code is required";
      } else if (!/^\d+$/.test(formData.biller_code)) {
        newErrors["biller_code"] = "Biller code must contain only numbers";
      }

      if (!formData.ref_code) {
        newErrors["ref_code"] = "Reference code is required";
      } else if (!/^\d+$/.test(formData.ref_code)) {
        newErrors["ref_code"] = "Reference code must contain only numbers";
      }
    }

    // Terms agreement validation
    if (!formData.iAgree) {
      newErrors["iAgree"] = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");

    setShowConfirmation(true);
  };

  // Handle confirmation
  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    setShowConfirmation(false);

    try {
      // Submit form data to the API
      const response = await axios.put(
        `/api/supplier-onboarding/${email}`,
        formData
      );

      if (response.data.success) {
        setShowSuccess(true);
      } else {
        alert(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form. Please try again.");
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
            <h2 className="text-xl font-semibold mb-6">1. Supplier Details</h2>

            {/* Business Name (Read-only from Vendor Creation page) */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="business_name">Business Name</Label>
              <ConditionalInput
                isEditable={false} // Always read-only
                type="text"
                name="business_name"
                value={formData.business_name}
                placeholder="Business Name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* GST Registered */}
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
              {/* Has tax id */}
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
                      required={
                        formData.country &&
                        formData.country !== "New Zealand" &&
                        formData.country !== "Australia"
                      }
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
                    <Label htmlFor="ANB_GST">ABN or GST</Label>
                    <ConditionalInput
                      isEditable={isEditable}
                      type="select"
                      name="ANB_GST"
                      value={formData.ANB_GST}
                      onChange={handleSelectChange}
                      options={[
                        { value: "ABN", label: "ABN" },
                        { value: "GST", label: "GST" },
                      ]}
                      className={errors.ANB_GST ? "border-red-500" : ""}
                      placeholder="Select ABN or GST"
                    />
                    {errors.ANB_GST && (
                      <p className="text-red-500 text-sm">{errors.ANB_GST}</p>
                    )}
                  </div>
                )}

              {/* GST - Only for New Zealand */}
              {(formData.country === "New Zealand" ||
                (formData.country !== "New Zealand" &&
                  formData.ANB_GST === "GST")) && (
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
                  formData.ANB_GST === "ABN")) && (
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
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address (max 100 characters)"
                  maxLength={100}
                  className={errors.address ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-500">
                  {formData.address.length}/100 characters
                </p>
              </div>

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
                  className={errors.return_order_email ? "border-red-500" : ""}
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
                      Select the Invoice currency when trading with our
                      Australian based entity(ies)
                      <span className="text-red-500">*</span>
                    </Label>
                    <ConditionalInput
                      isEditable={isEditable}
                      type="select"
                      name="au_invoice_currency"
                      value={formData.au_invoice_currency || ""}
                      onChange={handleSelectChange}
                      options={currencies.map((currency) => ({
                        value: currency.value,
                        label: currency.label,
                      }))}
                      required={hasAuEntities}
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
                    <Select
                      value={formData.nz_invoice_currency || ""}
                      onValueChange={(value) =>
                        handleSelectChange("nz_invoice_currency", value)
                      }
                    >
                      <SelectTrigger
                        id="nz_invoice_currency"
                        className={
                          errors.nz_invoice_currency ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

          {/* 2. Banking Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">2. Banking Details</h2>

            {/* Payment Method */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="payment_method">
                Payment Method<span className="text-red-500">*</span>
              </Label>
              <ConditionalInput
                isEditable={isEditable}
                type="select"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleSelectChange}
                options={[
                  { value: "Bank Transfer", label: "Bank Transfer" },
                  { value: "Bpay", label: "Bpay" },
                ]}
                required={true}
                className={errors.payment_method ? "border-red-500" : ""}
                placeholder="Select Payment Method"
              />
              {errors.payment_method && (
                <p className="text-red-500 text-sm">{errors.payment_method}</p>
              )}
            </div>

            {/* BPay Fields */}
            {formData.payment_method === "Bpay" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-md border">
                <div className="space-y-2">
                  <Label htmlFor="biller_code">
                    Biller Code<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="biller_code"
                    value={formData.biller_code || ""}
                    onChange={handleSelectChange}
                    pattern="\\d+"
                    inputMode="numeric"
                    className={errors.biller_code ? "border-red-500" : ""}
                  />
                  {errors.biller_code && (
                    <p className="text-red-500 text-sm">{errors.biller_code}</p>
                  )}
                  <p className="text-xs text-gray-500">Numbers only</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ref_code">
                    Ref Code<span className="text-red-500">*</span>
                  </Label>
                  <ConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="ref_code"
                    value={formData.ref_code || ""}
                    onChange={handleSelectChange}
                    pattern="\\d+"
                    inputMode="numeric"
                    className={errors.ref_code ? "border-red-500" : ""}
                  />
                  {errors.ref_code && (
                    <p className="text-red-500 text-sm">{errors.ref_code}</p>
                  )}
                  <p className="text-xs text-gray-500">Numbers only</p>
                </div>
              </div>
            )}

            {/* Bank Transfer Fields */}
            {formData.payment_method === "Bank Transfer" && (
              <div className="space-y-6">
                {/* AU Banking Container */}
                {hasAuEntities && (
                  <div className="bg-white p-4 rounded-md border">
                    <h3 className="font-medium mb-4">
                      Fill the banking details when trading with Australian
                      based entity(ies)
                    </h3>
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

                    {/* AU Domestic Banking */}
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
                            inputMode="numeric"
                            className={errors.au_bsb ? "border-red-500" : ""}
                          />
                          {errors.au_bsb && (
                            <p className="text-red-500 text-sm">
                              {errors.au_bsb}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Must be exactly 6 digits
                          </p>
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
                          <p className="text-xs text-gray-500">
                            Must be exactly 10 digits
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* NZ Banking Container */}
                {hasNzEntities && (
                  <div className="bg-white p-4 rounded-md border">
                    <h3 className="font-medium mb-4">
                      Fill banking details when trading with our NZ based
                      entity(ies)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nz_bank_country">
                          Bank Country<span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.nz_bank_country || ""}
                          onValueChange={(value) =>
                            handleSelectChange("nz_bank_country", value)
                          }
                        >
                          <SelectTrigger
                            id="nz_bank_country"
                            className={
                              errors.nz_bank_country ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Input
                          id="nz_bank_address"
                          name="nz_bank_address"
                          value={formData.nz_bank_address || ""}
                          onChange={handleInputChange}
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
                        <Select
                          value={formData.nz_bank_currency_code || ""}
                          onValueChange={(value) =>
                            handleSelectChange("nz_bank_currency_code", value)
                          }
                        >
                          <SelectTrigger
                            id="nz_bank_currency_code"
                            className={
                              errors.nz_bank_currency_code
                                ? "border-red-500"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem
                                key={currency.value}
                                value={currency.value}
                              >
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Input
                          id="nz_bank_clearing_code"
                          name="nz_bank_clearing_code"
                          value={formData.nz_bank_clearing_code || ""}
                          onChange={handleInputChange}
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
                        <Input
                          id="nz_remittance_email"
                          name="nz_remittance_email"
                          type="email"
                          value={formData.nz_remittance_email || ""}
                          onChange={handleInputChange}
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

                    {/* NZ Domestic Banking */}
                    {formData.nz_bank_country === "New Zealand" && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="nz_bsb">
                            BSB<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nz_bsb"
                            name="nz_bsb"
                            value={formData.nz_bsb || ""}
                            onChange={handleInputChange}
                            maxLength={6}
                            inputMode="numeric"
                            className={errors.nz_bsb ? "border-red-500" : ""}
                          />
                          {errors.nz_bsb && (
                            <p className="text-red-500 text-sm">
                              {errors.nz_bsb}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Must be exactly 6 digits
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nz_account">
                            Account Number
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nz_account"
                            name="nz_account"
                            value={formData.nz_account || ""}
                            onChange={handleInputChange}
                            maxLength={10}
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
                          <p className="text-xs text-gray-500">
                            Must be exactly 10 digits
                          </p>
                        </div>
                      </div>
                    )}
                    {formData.au_bank_country === "Australia" && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="au_bsb">
                            BSB<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="au_bsb"
                            name="au_bsb"
                            value={formData.au_bsb || ""}
                            onChange={handleInputChange}
                            maxLength={6}
                            inputMode="numeric"
                            className={errors.au_bsb ? "border-red-500" : ""}
                          />
                          {errors.au_bsb && (
                            <p className="text-red-500 text-sm">
                              {errors.au_bsb}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Must be exactly 6 digits
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="au_account">
                            Account Number
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="au_account"
                            name="au_account"
                            value={formData.au_account || ""}
                            onChange={handleInputChange}
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
                          <p className="text-xs text-gray-500">
                            Must be exactly 10 digits
                          </p>
                        </div>
                      </div>
                    )}
                    {/* NZ Overseas Banking */}
                    {formData.nz_bank_country &&
                      formData.nz_bank_country !== "New Zealand" && (
                        <div className="mt-4 border-t pt-4">
                          {/* Overseas Banking (IBAN/SWIFT) */}
                          <div className="space-y-2 mb-4">
                            <Label htmlFor="overseas_iban_switch">
                              IBAN or SWIFT
                              <span className="text-red-500">*</span>
                            </Label>
                            <ConditionalInput
                              isEditable={isEditable}
                              type="select"
                              name="overseas_iban_switch"
                              value={formData.overseas_iban_switch || ""}
                              onChange={handleSelectChange}
                              options={[
                                { value: "IBAN", label: "IBAN" },
                                { value: "SWIFT", label: "SWIFT" },
                              ]}
                              className={
                                errors.overseas_iban_switch
                                  ? "border-red-500"
                                  : ""
                              }
                              placeholder="Select an option"
                            />
                            {errors.overseas_iban_switch && (
                              <p className="text-red-500 text-sm">
                                {errors.overseas_iban_switch}
                              </p>
                            )}
                          </div>

                          {formData.overseas_iban_switch === "IBAN" && (
                            <div className="space-y-2">
                              <Label htmlFor="overseas_iban">
                                IBAN<span className="text-red-500">*</span>
                              </Label>
                              <ConditionalInput
                                isEditable={isEditable}
                                type="text"
                                name="overseas_iban"
                                value={formData.overseas_iban || ""}
                                onChange={handleSelectChange}
                                className={
                                  errors.overseas_iban ? "border-red-500" : ""
                                }
                              />
                              {errors.overseas_iban && (
                                <p className="text-red-500 text-sm">
                                  {errors.overseas_iban}
                                </p>
                              )}
                            </div>
                          )}

                          {formData.overseas_iban_switch === "SWIFT" && (
                            <div className="space-y-2">
                              <Label htmlFor="overseas_swift">
                                SWIFT<span className="text-red-500">*</span>
                              </Label>
                              <ConditionalInput
                                isEditable={isEditable}
                                type="text"
                                name="overseas_swift"
                                value={formData.overseas_swift || ""}
                                onChange={handleSelectChange}
                                className={
                                  errors.overseas_swift ? "border-red-500" : ""
                                }
                              />
                              {errors.overseas_swift && (
                                <p className="text-red-500 text-sm">
                                  {errors.overseas_swift}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}

                {/* Add Bank Statement Upload */}
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
                        {bankStatement
                          ? bankStatement.name
                          : "No file uploaded"}
                      </p>
                    )}
                  </div>
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

          {/* Submit Button - only show when form is editable */}
          {isEditable && (
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
