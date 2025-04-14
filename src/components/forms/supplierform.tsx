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

// Define interfaces for trading entities
interface TradingEntity {
  contactid: string;
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

export default function SupplierForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
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

      const response = await axios.get(`/api/supplier/${email}`);

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

      setFormData((prev) => ({ ...prev, business_name: vendorInfo.fullname }));
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  // Handle confirmation
  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    setShowConfirmation(false);

    try {
      // Submit form data to the API
      const response = await axios.post(
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
        <CardTitle>Supplier Onboarding Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Supplier Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">1. Supplier Details</h2>

            {/* Business Name (Read-only from Vendor Creation page) */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                name="business_name"
                value={formData.business_name}
                onChange={handleInputChange}
                className="bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trading Name */}
              <div className="space-y-2">
                <Label htmlFor="trading_name">
                  Trading Name (if different to Business Name)
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="trading_name"
                  name="trading_name"
                  value={formData.trading_name}
                  onChange={handleInputChange}
                  required
                  className={errors.trading_name ? "border-red-500" : ""}
                />
                {errors.trading_name && (
                  <p className="text-red-500 text-sm">{errors.trading_name}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">
                  Country<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    handleSelectChange("country", value)
                  }
                >
                  <SelectTrigger
                    id="country"
                    className={errors.country ? "border-red-500" : ""}
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
                {errors.country && (
                  <p className="text-red-500 text-sm">{errors.country}</p>
                )}
              </div>

              {/* GST Registered - New field */}
              <div className="space-y-2">
                <Label htmlFor="gst_registered">
                  Registered for GST?<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gst_registered}
                  onValueChange={(value) =>
                    handleSelectChange("gst_registered", value)
                  }
                >
                  <SelectTrigger
                    id="gst_registered"
                    className={errors.gst_registered ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select Yes or No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gst_registered && (
                  <p className="text-red-500 text-sm">
                    {errors.gst_registered}
                  </p>
                )}
              </div>
              {/* ABN or GST*/}
              {/* ABN or GST */}
              {formData.country &&
                formData.country !== "New Zealand" &&
                formData.country !== "Australia" && (
                  <div className="space-y-2">
                    <Label htmlFor="ANB_GST">
                      Do you have ABN or GST
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.ANB_GST}
                      onValueChange={(value) =>
                        handleSelectChange("ANB_GST", value)
                      }
                    >
                      <SelectTrigger
                        id="ANB_GST"
                        className={errors.ANB_GST ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select ABN or GST" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABN">ABN</SelectItem>
                        <SelectItem value="GST">GST</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Input
                    id="gst"
                    name="gst"
                    value={formData.gst || ""}
                    onChange={handleInputChange}
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
                  <Input
                    id="abn"
                    name="abn"
                    value={formData.abn || ""}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={11}
                    className={errors.abn ? "border-red-500" : ""}
                  />
                  {errors.abn && (
                    <p className="text-red-500 text-sm">{errors.abn}</p>
                  )}
                </div>
              )}

              {/* GST - Only for New Zealand */}
              {formData.country === "New Zealand" && (
                <div className="space-y-2">
                  <Label htmlFor="gst">
                    New Zealand Goods & Services Tax Number (GST)
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="gst"
                    name="gst"
                    value={formData.gst || ""}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    className={errors.gst ? "border-red-500" : ""}
                  />
                  {errors.gst && (
                    <p className="text-red-500 text-sm">{errors.gst}</p>
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

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">
                  City<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className={errors.city ? "border-red-500" : ""}
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
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className={errors.state ? "border-red-500" : ""}
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
                <Input
                  id="postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  inputMode="numeric"
                  required
                  className={errors.postcode ? "border-red-500" : ""}
                />
                {errors.postcode && (
                  <p className="text-red-500 text-sm">{errors.postcode}</p>
                )}
              </div>

              {/* Primary Contact Email (renamed from accounts_contact) */}
              <div className="space-y-2">
                <Label htmlFor="primary_contact_email">
                  Primary Contact Email<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="primary_contact_email"
                  name="primary_contact_email"
                  type="email"
                  value={formData.primary_contact_email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="example@domain.com"
                  required
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
                <Input
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  inputMode="numeric"
                  required
                  className={errors.telephone ? "border-red-500" : ""}
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
                <Input
                  id="po_email"
                  name="po_email"
                  type="email"
                  value={formData.po_email || ""}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="example@domain.com"
                  required
                  className={errors.po_email ? "border-red-500" : ""}
                />
                {errors.po_email && (
                  <p className="text-red-500 text-sm">{errors.po_email}</p>
                )}
              </div>

              {/* Return Order Email - New field */}
              <div className="space-y-2">
                <Label htmlFor="return_order_email">
                  Return Order Email<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="return_order_email"
                  name="return_order_email"
                  type="email"
                  value={formData.return_order_email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="example@domain.com"
                  required
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
                    <Select
                      value={formData.au_invoice_currency || ""}
                      onValueChange={(value) =>
                        handleSelectChange("au_invoice_currency", value)
                      }
                    >
                      <SelectTrigger
                        id="au_invoice_currency"
                        className={
                          errors.au_invoice_currency ? "border-red-500" : ""
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
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  handleSelectChange("payment_method", value)
                }
              >
                <SelectTrigger
                  id="payment_method"
                  className={errors.payment_method ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Bpay">Bpay</SelectItem>
                </SelectContent>
              </Select>
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
                  <Input
                    id="biller_code"
                    name="biller_code"
                    value={formData.biller_code || ""}
                    onChange={handleInputChange}
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
                  <Input
                    id="ref_code"
                    name="ref_code"
                    value={formData.ref_code || ""}
                    onChange={handleInputChange}
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
                        <Select
                          value={formData.au_bank_country || ""}
                          onValueChange={(value) =>
                            handleSelectChange("au_bank_country", value)
                          }
                        >
                          <SelectTrigger
                            id="au_bank_country"
                            className={
                              errors.au_bank_country ? "border-red-500" : ""
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
                        <Input
                          id="au_bank_address"
                          name="au_bank_address"
                          value={formData.au_bank_address || ""}
                          onChange={handleInputChange}
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
                        <Select
                          value={formData.au_bank_currency_code || ""}
                          onValueChange={(value) =>
                            handleSelectChange("au_bank_currency_code", value)
                          }
                        >
                          <SelectTrigger
                            id="au_bank_currency_code"
                            className={
                              errors.au_bank_currency_code
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
                        <Input
                          id="au_bank_clearing_code"
                          name="au_bank_clearing_code"
                          value={formData.au_bank_clearing_code || ""}
                          onChange={handleInputChange}
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
                        <Input
                          id="au_remittance_email"
                          name="au_remittance_email"
                          type="email"
                          value={formData.au_remittance_email || ""}
                          onChange={handleInputChange}
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
                    {/* NZ Domestic Banking */}
                    {formData.au_bank_country === "New Zealand" && (
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
                    {/* AU Overseas Banking */}
                    {formData.au_bank_country &&
                      formData.au_bank_country !== "Australia" &&
                      formData.au_bank_country !== "New Zealand" && (
                        <div className="mt-4 border-t pt-4">
                          <div className="space-y-2 mb-4">
                            <Label htmlFor="overseas_iban_switch">
                              IBAN or SWIFT
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={formData.overseas_iban_switch || ""}
                              onValueChange={(value) =>
                                handleSelectChange(
                                  "overseas_iban_switch",
                                  value
                                )
                              }
                            >
                              <SelectTrigger
                                id="overseas_iban_switch"
                                className={
                                  errors.overseas_iban_switch
                                    ? "border-red-500"
                                    : ""
                                }
                              >
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IBAN">IBAN</SelectItem>
                                <SelectItem value="SWIFT">SWIFT</SelectItem>
                              </SelectContent>
                            </Select>
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
                              <Input
                                id="overseas_iban"
                                name="overseas_iban"
                                value={formData.overseas_iban || ""}
                                onChange={handleInputChange}
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
                              <Input
                                id="overseas_swift"
                                name="overseas_swift"
                                value={formData.overseas_swift || ""}
                                onChange={handleInputChange}
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
                          <div className="space-y-2 mb-4">
                            <Label htmlFor="overseas_iban_switch">
                              IBAN or SWIFT
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={formData.overseas_iban_switch || ""}
                              onValueChange={(value) =>
                                handleSelectChange(
                                  "overseas_iban_switch",
                                  value
                                )
                              }
                            >
                              <SelectTrigger
                                id="overseas_iban_switch"
                                className={
                                  errors.overseas_iban_switch
                                    ? "border-red-500"
                                    : ""
                                }
                              >
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IBAN">IBAN</SelectItem>
                                <SelectItem value="SWIFT">SWIFT</SelectItem>
                              </SelectContent>
                            </Select>
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
                              <Input
                                id="overseas_iban"
                                name="overseas_iban"
                                value={formData.overseas_iban || ""}
                                onChange={handleInputChange}
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
                              <Input
                                id="overseas_swift"
                                name="overseas_swift"
                                value={formData.overseas_swift || ""}
                                onChange={handleInputChange}
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

                {/* Bank Statement Upload */}
                {/* Bank Statement Upload */}
                <div className="space-y-2 mt-6">
                  <Label htmlFor="bank-statement">
                    Bank Statement or Confirmation Letter
                    <span className="text-red-500">*</span>
                  </Label>

                  {/* Bank Statement Instructions */}
                  <div className="bg-blue-50 p-4 rounded-md mb-3 text-sm">
                    <p className="font-medium mb-2">Important Requirements:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        A bank statement or bank confirmation letter is required
                        to verify your banking information
                      </li>
                      <li>
                        The document must:
                        <ul className="list-disc pl-5 mt-1">
                          <li>Be dated within the last 3 months</li>
                          <li>Be in PDF format only</li>
                          <li>
                            Clearly show the account details (sensitive
                            information may be redacted)
                          </li>
                        </ul>
                      </li>
                      <li>
                        Banking payment slips cannot be accepted as they lack
                        proper dating
                      </li>
                      <li>
                        Screenshots or partial images of documents cannot be
                        verified for authenticity
                      </li>
                    </ul>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-md p-6 text-center ${
                      fileError
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                    } cursor-pointer`}
                  >
                    <input
                      type="file"
                      id="file-input"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-input")?.click()
                      }
                    >
                      Upload PDF Document
                    </Button>
                    {bankStatement && (
                      <p className="mt-2 text-sm text-gray-600">
                        {bankStatement.name}
                      </p>
                    )}
                  </div>
                  {fileError && (
                    <p className="text-red-500 text-sm">{fileError}</p>
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
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          iAgree: checked === true,
                        }))
                      }
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

          {/* Submit Button */}
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
        </form>
      </CardContent>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              Would you like to proceed?
            </h2>
            <p className="mb-4">Please confirm you want to submit this form.</p>
            <div className="flex justify-between gap-4">
              <Button
                onClick={handleConfirmSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                Yes
              </Button>
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="destructive"
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}

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
