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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/lib/countries";

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
  postal_address: string;
  city: string;
  state: string;
  postcode: string;
  accounts_contact: string;
  telephone: string;
  po_email: string;
  return_order_email: string;
  invoice_currency: string;
  payment_method: string;
  // Bank details fields - AU
  au_bank_name?: string;
  au_bank_email?: string;
  bsb?: string;
  account?: string;
  // Bank details fields - NZ
  nz_bank_name?: string;
  nz_bank_email?: string;
  nz_BSB?: string;
  nz_account?: string;
  // Overseas banking
  IBAN_SWITCH_yn?: string;
  IBAN_input?: string;
  SWITCH_input?: string;
  overseas_bank_email?: string;
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [bankStatement, setBankStatement] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  // Initial form state
  const [formData, setFormData] = useState<SupplierFormData>({
    business_name: "",
    trading_name: "",
    country: "",
    gst_registered: "",
    address: "",
    website: "",
    postal_address: "",
    city: "",
    state: "",
    postcode: "",
    accounts_contact: "",
    telephone: "",
    po_email: "",
    return_order_email: "",
    invoice_currency: "",
    payment_method: "Bank Transfer",
    iAgree: false,
  });

  // Currencies list
  const currencies = [
    { value: "AUD", label: "AUD" },
    { value: "NZD", label: "NZD" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "CNY", label: "CNY" },
    { value: "GBP", label: "GBP" },
  ];

  // Get user data on component mount
  useEffect(() => {
    if (session?.user?.email) {
      try {
        // Detect region based on email domain
        const emailDomain = session.user.email.split("@")[1] || "";

        if (emailDomain.includes(".au")) {
          setDescription("Australia");
        } else if (emailDomain.includes(".nz")) {
          setDescription("New Zealand");
        } else {
          setDescription("Overseas");
        }

        // Populate business_name if available in session
        if (session) {
          // Type assertion to help TypeScript understand the structure
          const user = (session as Session).user;

          if (user) {
            setFormData((prev) => ({
              ...prev,
              business_name: user.name || "",
              accounts_contact: user.email || "",
              po_email: user.email || "",
              return_order_email: user.email || "",
            }));
          }
        }
      } catch (error) {
        console.error("Error setting user data:", error);
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
      "postal_address",
      "city",
      "state",
      "postcode",
      "accounts_contact",
      "telephone",
      "po_email",
      "return_order_email",
      "invoice_currency",
      "payment_method",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof SupplierFormData]) {
        newErrors[field] = "This field is required";
      }
    });

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const emailFields = ["accounts_contact", "po_email", "return_order_email"];

    emailFields.forEach((field) => {
      const value = formData[field as keyof SupplierFormData] as string;
      if (value && !emailRegex.test(value)) {
        newErrors[field] = "Please enter a valid email address";
      }
    });

    // Country-specific validations
    if (description === "Australia" && formData.gst_registered === "Yes") {
      if (!formData.abn) {
        newErrors["abn"] = "ABN is required";
      } else if (!/^\d{11}$/.test(formData.abn)) {
        newErrors["abn"] = "ABN must be 11 digits";
      }
    }

    if (description === "New Zealand" && formData.gst_registered === "Yes") {
      if (!formData.gst) {
        newErrors["gst"] = "GST number is required";
      }
    }

    // Payment method validations
    if (formData.payment_method === "Bank Transfer") {
      if (description === "Australia") {
        if (!formData.au_bank_name)
          newErrors["au_bank_name"] = "Bank name is required";
        if (!formData.au_bank_email)
          newErrors["au_bank_email"] = "Bank email is required";

        if (!formData.bsb) {
          newErrors["bsb"] = "BSB is required";
        } else if (!/^\d{6}$/.test(formData.bsb)) {
          newErrors["bsb"] = "BSB must be 6 digits";
        }

        if (!formData.account) {
          newErrors["account"] = "Account number is required";
        } else if (!/^\d{10}$/.test(formData.account)) {
          newErrors["account"] = "Account number must be 10 digits";
        }
      } else if (description === "New Zealand") {
        if (!formData.nz_bank_name)
          newErrors["nz_bank_name"] = "Bank name is required";
        if (!formData.nz_bank_email)
          newErrors["nz_bank_email"] = "Bank email is required";

        if (!formData.nz_BSB) {
          newErrors["nz_BSB"] = "BSB is required";
        } else if (!/^\d{6}$/.test(formData.nz_BSB)) {
          newErrors["nz_BSB"] = "BSB must be 6 digits";
        }

        if (!formData.nz_account) {
          newErrors["nz_account"] = "Account number is required";
        } else if (!/^\d{10}$/.test(formData.nz_account)) {
          newErrors["nz_account"] = "Account number must be 10 digits";
        }
      } else if (description === "Overseas") {
        if (!formData.IBAN_SWITCH_yn) {
          newErrors["IBAN_SWITCH_yn"] = "Please select IBAN or SWITCH";
        } else if (formData.IBAN_SWITCH_yn === "IBAN") {
          if (!formData.IBAN_input) {
            newErrors["IBAN_input"] = "IBAN is required";
          } else if (formData.IBAN_input.length !== 34) {
            newErrors["IBAN_input"] = "IBAN must be exactly 34 characters";
          }
          if (!formData.overseas_bank_email) {
            newErrors["overseas_bank_email"] = "Bank email is required";
          }
        } else if (formData.IBAN_SWITCH_yn === "SWITCH") {
          if (!formData.SWITCH_input) {
            newErrors["SWITCH_input"] = "SWITCH is required";
          } else if (formData.SWITCH_input.length !== 34) {
            newErrors["SWITCH_input"] = "SWITCH must be exactly 34 characters";
          }
        }
      }

      // Bank statement validation
      if (!bankStatement) {
        setFileError("Bank statement is required");
      }
    } else if (formData.payment_method === "Bepay") {
      if (!formData.biller_code)
        newErrors["biller_code"] = "Biller code is required";
      if (!formData.ref_code)
        newErrors["ref_code"] = "Reference code is required";
    }

    // Terms agreement validation
    if (!formData.iAgree) {
      newErrors["iAgree"] = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 0 &&
      (formData.payment_method !== "Bank Transfer" || bankStatement)
    );
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
      // In a real implementation, you would submit the form data and file to your API here
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      setShowSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle success close
  const handleSuccessClose = () => {
    setShowSuccess(false);
    window.location.href = "/profile";
  };

  // Toggle bank details based on payment method
  const toggleBankDetails = () => {
    return formData.payment_method === "Bank Transfer";
  };

  // Toggle IBAN/SWITCH fields
  const showIBANField = formData.IBAN_SWITCH_yn === "IBAN";
  const showSWITCHField = formData.IBAN_SWITCH_yn === "SWITCH";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Vendor Onboarding Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Hidden field for description (region) */}
          <input
            type="hidden"
            id="description"
            name="description"
            value={description}
          />

          {/* 1. Supplier Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">1. Supplier Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

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

              {/* GST Registered */}
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

              {/* ABN - Only for Australia */}
              {description === "Australia" &&
                formData.gst_registered === "Yes" && (
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
              {description === "New Zealand" &&
                formData.gst_registered === "Yes" && (
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

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Start typing an address..."
                  maxLength={100}
                />
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

              {/* Postal Address */}
              <div className="space-y-2">
                <Label htmlFor="postal_address">
                  Postal Address<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="postal_address"
                  name="postal_address"
                  value={formData.postal_address}
                  onChange={handleInputChange}
                  required
                  className={errors.postal_address ? "border-red-500" : ""}
                />
                {errors.postal_address && (
                  <p className="text-red-500 text-sm">
                    {errors.postal_address}
                  </p>
                )}
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

              {/* Primary Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="accounts_contact">
                  Primary Contact Email<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="accounts_contact"
                  name="accounts_contact"
                  type="email"
                  value={formData.accounts_contact}
                  onChange={handleInputChange}
                  placeholder="example@domain.com"
                  required
                  className={errors.accounts_contact ? "border-red-500" : ""}
                />
                {errors.accounts_contact && (
                  <p className="text-red-500 text-sm">
                    {errors.accounts_contact}
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
                  value={formData.po_email}
                  onChange={handleInputChange}
                  placeholder="example@domain.com"
                  required
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
                <Input
                  id="return_order_email"
                  name="return_order_email"
                  type="email"
                  value={formData.return_order_email}
                  onChange={handleInputChange}
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

              {/* Invoice Currency */}
              <div className="space-y-2">
                <Label htmlFor="invoice_currency">
                  Invoice Currency<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.invoice_currency}
                  onValueChange={(value) =>
                    handleSelectChange("invoice_currency", value)
                  }
                >
                  <SelectTrigger
                    id="invoice_currency"
                    className={errors.invoice_currency ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.invoice_currency && (
                  <p className="text-red-500 text-sm">
                    {errors.invoice_currency}
                  </p>
                )}
              </div>
            </div>
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
                  <SelectItem value="Bepay">Bepay</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_method && (
                <p className="text-red-500 text-sm">{errors.payment_method}</p>
              )}
            </div>

            {/* Bank Transfer Fields */}
            {formData.payment_method === "Bank Transfer" && (
              <>
                {/* Australia Banking Fields */}
                {description === "Australia" && (
                  <div className="mb-6 bg-white p-4 rounded-md border">
                    <h3 className="font-medium mb-4">Australia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="au_bank_name">
                          Bank Name<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="au_bank_name"
                          name="au_bank_name"
                          value={formData.au_bank_name || ""}
                          onChange={handleInputChange}
                          className={
                            errors.au_bank_name ? "border-red-500" : ""
                          }
                        />
                        {errors.au_bank_name && (
                          <p className="text-red-500 text-sm">
                            {errors.au_bank_name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="au_bank_email">
                          Bank Email<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="au_bank_email"
                          name="au_bank_email"
                          type="email"
                          value={formData.au_bank_email || ""}
                          onChange={handleInputChange}
                          placeholder="example@domain.com"
                          className={
                            errors.au_bank_email ? "border-red-500" : ""
                          }
                        />
                        {errors.au_bank_email && (
                          <p className="text-red-500 text-sm">
                            {errors.au_bank_email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bsb">
                          BSB<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="bsb"
                          name="bsb"
                          value={formData.bsb || ""}
                          onChange={handleInputChange}
                          maxLength={6}
                          inputMode="numeric"
                          className={errors.bsb ? "border-red-500" : ""}
                        />
                        {errors.bsb && (
                          <p className="text-red-500 text-sm">{errors.bsb}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Must be exactly 6 digits
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account">
                          Account Number<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="account"
                          name="account"
                          value={formData.account || ""}
                          onChange={handleInputChange}
                          maxLength={10}
                          inputMode="numeric"
                          className={errors.account ? "border-red-500" : ""}
                        />
                        {errors.account && (
                          <p className="text-red-500 text-sm">
                            {errors.account}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Must be exactly 10 digits
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Zealand Banking Fields */}
                {description === "New Zealand" && (
                  <div className="mb-6 bg-white p-4 rounded-md border">
                    <h3 className="font-medium mb-4">New Zealand</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nz_bank_name">
                          Bank Name<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nz_bank_name"
                          name="nz_bank_name"
                          value={formData.nz_bank_name || ""}
                          onChange={handleInputChange}
                          className={
                            errors.nz_bank_name ? "border-red-500" : ""
                          }
                        />
                        {errors.nz_bank_name && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_bank_name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nz_bank_email">
                          Bank Email<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nz_bank_email"
                          name="nz_bank_email"
                          type="email"
                          value={formData.nz_bank_email || ""}
                          onChange={handleInputChange}
                          placeholder="example@domain.com"
                          className={
                            errors.nz_bank_email ? "border-red-500" : ""
                          }
                        />
                        {errors.nz_bank_email && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_bank_email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nz_BSB">
                          BSB<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nz_BSB"
                          name="nz_BSB"
                          value={formData.nz_BSB || ""}
                          onChange={handleInputChange}
                          maxLength={6}
                          minLength={6}
                          inputMode="numeric"
                          className={errors.nz_BSB ? "border-red-500" : ""}
                        />
                        {errors.nz_BSB && (
                          <p className="text-red-500 text-sm">
                            {errors.nz_BSB}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Must be exactly 6 digits
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nz_account">
                          Account Number<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nz_account"
                          name="nz_account"
                          value={formData.nz_account || ""}
                          onChange={handleInputChange}
                          maxLength={10}
                          minLength={10}
                          inputMode="numeric"
                          className={errors.nz_account ? "border-red-500" : ""}
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
                  </div>
                )}

                {/* Overseas Banking Fields */}
                {description === "Overseas" && (
                  <div className="mb-6 bg-white p-4 rounded-md border">
                    <h3 className="font-medium mb-4">Overseas</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="IBAN_SWITCH_yn">
                          IBAN or SWITCH<span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.IBAN_SWITCH_yn || ""}
                          onValueChange={(value) =>
                            handleSelectChange("IBAN_SWITCH_yn", value)
                          }
                        >
                          <SelectTrigger
                            id="IBAN_SWITCH_yn"
                            className={
                              errors.IBAN_SWITCH_yn ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IBAN">IBAN</SelectItem>
                            <SelectItem value="SWITCH">SWITCH</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.IBAN_SWITCH_yn && (
                          <p className="text-red-500 text-sm">
                            {errors.IBAN_SWITCH_yn}
                          </p>
                        )}
                      </div>

                      {showIBANField && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="overseas_bank_email">
                              Bank Email<span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="overseas_bank_email"
                              name="overseas_bank_email"
                              type="email"
                              value={formData.overseas_bank_email || ""}
                              onChange={handleInputChange}
                              placeholder="example@domain.com"
                              className={
                                errors.overseas_bank_email
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {errors.overseas_bank_email && (
                              <p className="text-red-500 text-sm">
                                {errors.overseas_bank_email}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="IBAN_input">
                              IBAN<span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="IBAN_input"
                              name="IBAN_input"
                              value={formData.IBAN_input || ""}
                              onChange={handleInputChange}
                              maxLength={34}
                              minLength={34}
                              className={
                                errors.IBAN_input ? "border-red-500" : ""
                              }
                            />
                            {errors.IBAN_input && (
                              <p className="text-red-500 text-sm">
                                {errors.IBAN_input}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Must be exactly 34 characters
                            </p>
                          </div>
                        </>
                      )}

                      {showSWITCHField && (
                        <div className="space-y-2">
                          <Label htmlFor="SWITCH_input">
                            SWITCH<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="SWITCH_input"
                            name="SWITCH_input"
                            value={formData.SWITCH_input || ""}
                            onChange={handleInputChange}
                            maxLength={34}
                            minLength={34}
                            className={
                              errors.SWITCH_input ? "border-red-500" : ""
                            }
                          />
                          {errors.SWITCH_input && (
                            <p className="text-red-500 text-sm">
                              {errors.SWITCH_input}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Must be exactly 34 characters
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank Statement Upload */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="bank-statement">
                    Please attach a recent (last 3 months) bank statement - PDF
                    only
                    <span className="text-red-500">*</span>
                  </Label>
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
                      Choose a PDF file
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
              </>
            )}

            {/* BePay Fields */}
            {formData.payment_method === "Bepay" && (
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
                    pattern="\d+"
                    inputMode="numeric"
                    className={errors.biller_code ? "border-red-500" : ""}
                  />
                  {errors.biller_code && (
                    <p className="text-red-500 text-sm">{errors.biller_code}</p>
                  )}
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
                    pattern="\d+"
                    inputMode="numeric"
                    className={errors.ref_code ? "border-red-500" : ""}
                  />
                  {errors.ref_code && (
                    <p className="text-red-500 text-sm">{errors.ref_code}</p>
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
                    <div>
                      <input
                        type="checkbox"
                        id="iAgree"
                        name="iAgree"
                        checked={formData.iAgree}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            iAgree: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
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
              Would you want to proceed?
            </h2>
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
