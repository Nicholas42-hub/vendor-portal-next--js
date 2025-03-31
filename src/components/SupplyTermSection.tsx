import React from "react";
import { styled } from "@mui/material/styles";
import { VendorData } from "../models/VendorTypes";
import { FormField } from "./ui/FormField";
import { TextInput } from "./ui/TextInput";
import { Dropdown } from "./ui/Dropdown";

// Define Props
interface SupplyTermsSectionProps {
  data: VendorData["supplyTerms"];
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
}

// Styled Container
const SectionContainer = styled("div")({
  background: "#f7f7f7",
  padding: "20px",
  margin: "10px 0",
  borderRadius: "8px",
  boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)",
  width: "100%",
});

const SectionTitle = styled("h2")({
  fontSize: "1.2em",
  color: "rgb(31, 31, 35)",
  fontWeight: 600,
  marginBottom: "10px",
  marginTop: "10px",
});

const Note = styled("p")({
  fontSize: "14px",
  color: "#666",
  marginTop: "4px",
  marginBottom: "15px",
});

const TextArea = styled("textarea")({
  width: "100%",
  height: "150px",
  padding: "10px",
  marginBottom: "10px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxSizing: "border-box",
  fontFamily: "inherit",
  fontSize: "inherit",
  resize: "vertical",
});

// Yes/No options
const yesNoOptions = [
  { value: "", label: "Select an option", disabled: true },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// Component
export const SupplyTermsSection: React.FC<SupplyTermsSectionProps> = ({
  data,
  errors,
  touched,
  onChange,
  onBlur,
}) => {
  // Handle number input changes with validation
  const handleNumberChange = (field: string, value: string) => {
    // Convert to number or 0 if empty
    const numValue = value === "" ? 0 : parseFloat(value);
    onChange(field, numValue);
  };

  return (
    <SectionContainer>
      <SectionTitle>3. Supply Terms</SectionTitle>

      {/* Exclusive Supply */}
      <FormField
        label="Exclusive supply to LagardereAwpl"
        htmlFor="exclusiveSupply"
        required
        error={errors.exclusiveSupply}
        touched={touched["supplyTerms.exclusiveSupply"]}
      >
        <Dropdown
          id="exclusiveSupply"
          name="exclusiveSupply"
          value={data.exclusiveSupply}
          onChange={(e) => onChange("exclusiveSupply", e.target.value)}
          onBlur={() => onBlur("exclusiveSupply")}
          options={yesNoOptions}
          required
          error={
            !!errors.exclusiveSupply && touched["supplyTerms.exclusiveSupply"]
          }
        />
        <Note>Product not supplied to other Airport retailers</Note>
      </FormField>

      {/* Sale or Return */}
      <FormField
        label="Sale or return"
        htmlFor="saleOrReturn"
        required
        error={errors.saleOrReturn}
        touched={touched["supplyTerms.saleOrReturn"]}
      >
        <Dropdown
          id="saleOrReturn"
          name="saleOrReturn"
          value={data.saleOrReturn}
          onChange={(e) => onChange("saleOrReturn", e.target.value)}
          onBlur={() => onBlur("saleOrReturn")}
          options={yesNoOptions}
          required
          error={!!errors.saleOrReturn && touched["supplyTerms.saleOrReturn"]}
        />
      </FormField>

      {/* Auth Required for Returns */}
      <FormField
        label="Auth. No Required for Returns"
        htmlFor="authRequired"
        required
        error={errors.authRequired}
        touched={touched["supplyTerms.authRequired"]}
      >
        <Dropdown
          id="authRequired"
          name="authRequired"
          value={data.authRequired}
          onChange={(e) => onChange("authRequired", e.target.value)}
          onBlur={() => onBlur("authRequired")}
          options={yesNoOptions}
          required
          error={!!errors.authRequired && touched["supplyTerms.authRequired"]}
        />
      </FormField>

      {/* Lead time in working days */}
      <FormField
        label="Lead time in working days"
        htmlFor="deliveryNotice"
        required
        error={errors.deliveryNotice}
        touched={touched["supplyTerms.deliveryNotice"]}
      >
        <TextInput
          id="deliveryNotice"
          name="deliveryNotice"
          value={data.deliveryNotice ? data.deliveryNotice.toString() : ""}
          onChange={(e) => handleNumberChange("deliveryNotice", e.target.value)}
          onBlur={() => onBlur("deliveryNotice")}
          placeholder="working days"
          type="number"
          required
          error={
            !!errors.deliveryNotice && touched["supplyTerms.deliveryNotice"]
          }
        />
      </FormField>

      {/* Minimum Order Value */}
      <FormField
        label="Minimum Order Value"
        htmlFor="minOrderValue"
        required
        error={errors.minOrderValue}
        touched={touched["supplyTerms.minOrderValue"]}
      >
        <TextInput
          id="minOrderValue"
          name="minOrderValue"
          value={data.minOrderValue ? data.minOrderValue.toString() : ""}
          onChange={(e) => handleNumberChange("minOrderValue", e.target.value)}
          onBlur={() => onBlur("minOrderValue")}
          type="number"
          required
          error={!!errors.minOrderValue && touched["supplyTerms.minOrderValue"]}
        />
      </FormField>

      {/* Minimum Order Quantity */}
      <FormField
        label="Minimum Order Quantity"
        htmlFor="minOrderQuantity"
        required
        error={errors.minOrderQuantity}
        touched={touched["supplyTerms.minOrderQuantity"]}
      >
        <TextInput
          id="minOrderQuantity"
          name="minOrderQuantity"
          value={data.minOrderQuantity ? data.minOrderQuantity.toString() : ""}
          onChange={(e) =>
            handleNumberChange("minOrderQuantity", e.target.value)
          }
          onBlur={() => onBlur("minOrderQuantity")}
          type="number"
          required
          error={
            !!errors.minOrderQuantity && touched["supplyTerms.minOrderQuantity"]
          }
        />
      </FormField>

      {/* Maximum Order Value */}
      <FormField
        label="Maximum Order Value"
        htmlFor="maxOrderValue"
        required
        error={errors.maxOrderValue}
        touched={touched["supplyTerms.maxOrderValue"]}
      >
        <TextInput
          id="maxOrderValue"
          name="maxOrderValue"
          value={data.maxOrderValue ? data.maxOrderValue.toString() : ""}
          onChange={(e) => handleNumberChange("maxOrderValue", e.target.value)}
          onBlur={() => onBlur("maxOrderValue")}
          type="number"
          required
          error={!!errors.maxOrderValue && touched["supplyTerms.maxOrderValue"]}
        />
      </FormField>

      {/* Other Comments */}
      <FormField
        label="Other Comments"
        htmlFor="otherComments"
        required={false}
        error={errors.otherComments}
        touched={touched["supplyTerms.otherComments"]}
      >
        <TextArea
          id="otherComments"
          name="otherComments"
          value={data.otherComments || ""}
          onChange={(e) => onChange("otherComments", e.target.value)}
          onBlur={() => onBlur("otherComments")}
          className="other_comments"
        />
      </FormField>
    </SectionContainer>
  );
};
export default SupplyTermsSection;
("use client");

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, AlertCircle } from "lucide-react";

// Constants & Types
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

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

// Custom styles
const customColors = {
  primary: "#141E5D",
  primaryLight: "rgba(240, 245, 250, 1)",
  primaryText: "rgba(0, 51, 102, 1)",
  requiredAsterisk: "#F01E73",
  viewTab: "#F01E73",
};

// Form Field Component
const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  children,
}) => (
  <div className="space-y-2 mb-4">
    <Label htmlFor={htmlFor} className="text-sm font-medium">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    {children}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// Form Section Component
const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
    <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
    {children}
  </div>
);

// Main Supplier Form Component
const SupplierForm: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bankStatement, setBankStatement] = useState<File | null>(null);

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
    payment_method: "",
    iAgree: false,
  });

  // Countries list
  const countries = [
    { value: "", label: "Select an option", disabled: true },
    { value: "Afghanistan", label: "Afghanistan" },
    { value: "Albania", label: "Albania" },
    { value: "Algeria", label: "Algeria" },
    { value: "Andorra", label: "Andorra" },
    { value: "Angola", label: "Angola" },
    { value: "Australia", label: "Australia" },
    { value: "Austria", label: "Austria" },
    { value: "Belgium", label: "Belgium" },
    { value: "Brazil", label: "Brazil" },
    { value: "Canada", label: "Canada" },
    { value: "China", label: "China" },
    { value: "France", label: "France" },
    { value: "Germany", label: "Germany" },
    { value: "India", label: "India" },
    { value: "Indonesia", label: "Indonesia" },
    { value: "Italy", label: "Italy" },
    { value: "Japan", label: "Japan" },
    { value: "Malaysia", label: "Malaysia" },
    { value: "Netherlands", label: "Netherlands" },
    { value: "New Zealand", label: "New Zealand" },
    { value: "Singapore", label: "Singapore" },
    { value: "South Korea", label: "South Korea" },
    { value: "Spain", label: "Spain" },
    { value: "Switzerland", label: "Switzerland" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "United States of America", label: "United States of America" },
    // Add more countries as needed
  ];

  // Currencies
  const currencies = [
    { value: "", label: "Select a currency", disabled: true },
    { value: "AUD", label: "AUD" },
    { value: "NZD", label: "NZD" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "CNY", label: "CNY" },
    { value: "GBP", label: "GBP" },
  ];

  // Get user data on load
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          // Here you would normally fetch data from API
          // For demonstration, I'm setting a mock description
          // In your actual implementation, you would make an API call here
          if (session.user.email.includes(".au")) {
            setDescription("Australia");
          } else if (session.user.email.includes(".nz")) {
            setDescription("New Zealand");
          } else {
            setDescription("Overseas");
          }

          // Populate business_name if you have it in the session
          if (session.user.name) {
            setFormData((prev) => ({
              ...prev,
              business_name: session.user.name || "",
            }));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
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

        // Clear error if exists
        if (errors["bankStatement"]) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors["bankStatement"];
            return newErrors;
          });
        }
      } else {
        setBankStatement(null);
        setErrors((prev) => ({
          ...prev,
          bankStatement: "Please upload a PDF file",
        }));
      }
    }
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    const requiredFields: (keyof SupplierFormData)[] = [
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
      if (!formData[field]) {
        newErrors[field] = "This field is required";
      }
    });

    // Email validations
    const emailFields = ["accounts_contact", "po_email", "return_order_email"];
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    emailFields.forEach((field) => {
      if (
        formData[field as keyof SupplierFormData] &&
        !emailRegex.test(formData[field as keyof SupplierFormData] as string)
      ) {
        newErrors[field] = "Please enter a valid email address";
      }
    });

    // Australia specific validations
    if (description === "Australia" && formData.gst_registered === "Yes") {
      if (!formData.abn) {
        newErrors["abn"] = "ABN is required";
      } else if (!/^\d{11}$/.test(formData.abn)) {
        newErrors["abn"] = "ABN must be 11 digits";
      }
    }

    // New Zealand specific validations
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
          if (!formData.overseas_bank_email)
            newErrors["overseas_bank_email"] = "Bank email is required";
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
        newErrors["bankStatement"] = "Bank statement is required";
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
      // Here you would normally make an API call to submit the form
      // For demonstration, I'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success message
      setShowSuccess(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsLoading(false);
    }
  };

  // Handle success close
  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Redirect to profile page
    router.push("/profile");
  };

  // If not authenticated, show a message
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="p-3 bg-yellow-50 rounded-md">
              <p className="text-yellow-700">
                Please log in to access the supplier form.
              </p>
            </div>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.push("/auth/signin")}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Supplier Onboarding Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* 1. Supplier Details Section */}
            <FormSection title="1. Supplier Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Business Name" htmlFor="business_name">
                  <Input
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    readOnly
                    className="bg-gray-100"
                  />
                </FormField>

                <FormField
                  label="Trading Name (if different to Business Name)"
                  htmlFor="trading_name"
                  required
                  error={errors.trading_name}
                >
                  <Input
                    id="trading_name"
                    name="trading_name"
                    value={formData.trading_name}
                    onChange={handleInputChange}
                    required
                  />
                </FormField>

                <FormField
                  label="Country"
                  htmlFor="country"
                  required
                  error={errors.country}
                >
                  <Select
                    name="country"
                    value={formData.country}
                    onValueChange={(value) =>
                      handleSelectChange("country", value)
                    }
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem
                          key={country.value}
                          value={country.value}
                          disabled={country.disabled}
                        >
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Registered for GST?"
                  htmlFor="gst_registered"
                  required
                  error={errors.gst_registered}
                >
                  <Select
                    name="gst_registered"
                    value={formData.gst_registered}
                    onValueChange={(value) =>
                      handleSelectChange("gst_registered", value)
                    }
                  >
                    <SelectTrigger id="gst_registered">
                      <SelectValue placeholder="Select Yes or No" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                {description === "Australia" &&
                  formData.gst_registered === "Yes" && (
                    <FormField
                      label="Australian Business Number (ABN)"
                      htmlFor="abn"
                      required
                      error={errors.abn}
                    >
                      <Input
                        id="abn"
                        name="abn"
                        value={formData.abn || ""}
                        onChange={handleInputChange}
                        placeholder="Enter 11-digit ABN"
                        inputMode="numeric"
                        required
                      />
                    </FormField>
                  )}

                {description === "New Zealand" &&
                  formData.gst_registered === "Yes" && (
                    <FormField
                      label="New Zealand Goods & Services Tax Number (GST)"
                      htmlFor="gst"
                      required
                      error={errors.gst}
                    >
                      <Input
                        id="gst"
                        name="gst"
                        value={formData.gst || ""}
                        onChange={handleInputChange}
                        placeholder="Enter GST number"
                        inputMode="numeric"
                        required
                      />
                    </FormField>
                  )}

                <FormField label="Address" htmlFor="address">
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Start typing an address..."
                    maxLength={100}
                  />
                </FormField>

                <FormField label="Website" htmlFor="website">
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </FormField>

                <FormField
                  label="Postal Address"
                  htmlFor="postal_address"
                  required
                  error={errors.postal_address}
                >
                  <Input
                    id="postal_address"
                    name="postal_address"
                    value={formData.postal_address}
                    onChange={handleInputChange}
                    required
                  />
                </FormField>

                <FormField
                  label="City"
                  htmlFor="city"
                  required
                  error={errors.city}
                >
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </FormField>

                <FormField
                  label="State"
                  htmlFor="state"
                  required
                  error={errors.state}
                >
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </FormField>

                <FormField
                  label="Postcode"
                  htmlFor="postcode"
                  required
                  error={errors.postcode}
                >
                  <Input
                    id="postcode"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    pattern="\d*"
                    required
                  />
                </FormField>

                <FormField
                  label="Primary Contact Email"
                  htmlFor="accounts_contact"
                  required
                  error={errors.accounts_contact}
                >
                  <Input
                    id="accounts_contact"
                    name="accounts_contact"
                    type="email"
                    value={formData.accounts_contact}
                    onChange={handleInputChange}
                    placeholder="example@domain.com"
                    pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
                    title="Please enter a valid email address (e.g., example@domain.com)"
                    required
                  />
                </FormField>

                <FormField
                  label="Telephone"
                  htmlFor="telephone"
                  required
                  error={errors.telephone}
                >
                  <Input
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    required
                  />
                </FormField>

                <FormField
                  label="PO Email"
                  htmlFor="po_email"
                  required
                  error={errors.po_email}
                >
                  <Input
                    id="po_email"
                    name="po_email"
                    type="email"
                    value={formData.po_email}
                    onChange={handleInputChange}
                    placeholder="example@domain.com"
                    pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
                    title="Please enter a valid email address (e.g., example@domain.com)"
                    required
                  />
                </FormField>

                <FormField
                  label="Return Order Email"
                  htmlFor="return_order_email"
                  required
                  error={errors.return_order_email}
                >
                  <Input
                    id="return_order_email"
                    name="return_order_email"
                    type="email"
                    value={formData.return_order_email}
                    onChange={handleInputChange}
                    placeholder="example@domain.com"
                    pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
                    title="Please enter a valid email address (e.g., example@domain.com)"
                    required
                  />
                </FormField>

                <FormField
                  label="Invoice Currency"
                  htmlFor="invoice_currency"
                  required
                  error={errors.invoice_currency}
                >
                  <Select
                    name="invoice_currency"
                    value={formData.invoice_currency}
                    onValueChange={(value) =>
                      handleSelectChange("invoice_currency", value)
                    }
                  >
                    <SelectTrigger id="invoice_currency">
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem
                          key={currency.value}
                          value={currency.value}
                          disabled={currency.disabled}
                        >
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </FormSection>

            {/* 2. Banking Details Section */}
            <FormSection title="2. Banking Details">
              <div className="space-y-4">
                <FormField
                  label="Payment Method"
                  htmlFor="payment_method"
                  required
                  error={errors.payment_method}
                >
                  <Select
                    name="payment_method"
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      handleSelectChange("payment_method", value)
                    }
                  >
                    <SelectTrigger id="payment_method">
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="Bepay">Bepay</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                {formData.payment_method === "Bank Transfer" && (
                  <>
                    {description === "Australia" && (
                      <div className="border rounded-md p-4 bg-white">
                        <h3 className="text-md font-medium mb-4">Australia</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            label="Bank Name"
                            htmlFor="au_bank_name"
                            required
                            error={errors.au_bank_name}
                          >
                            <Input
                              id="au_bank_name"
                              name="au_bank_name"
                              value={formData.au_bank_name || ""}
                              onChange={handleInputChange}
                              required
                            />
                          </FormField>

                          <FormField
                            label="Bank Email"
                            htmlFor="au_bank_email"
                            required
                            error={errors.au_bank_email}
                          >
                            <Input
                              id="au_bank_email"
                              name="au_bank_email"
                              type="email"
                              value={formData.au_bank_email || ""}
                              onChange={handleInputChange}
                              pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
                              placeholder="example@domain.com"
                              required
                            />
                          </FormField>

                          <FormField
                            label="BSB"
                            htmlFor="bsb"
                            required
                            error={errors.bsb}
                          >
                            <Input
                              id="bsb"
                              name="bsb"
                              value={formData.bsb || ""}
                              onChange={handleInputChange}
                              maxLength={6}
                              inputMode="numeric"
                              pattern="\d*"
                              required
                            />
                          </FormField>

                          <FormField
                            label="Account Number"
                            htmlFor="account"
                            required
                            error={errors.account}
                          >
                            <Input
                              id="account"
                              name="account"
                              value={formData.account || ""}
                              onChange={handleInputChange}
                              maxLength={10}
                              inputMode="numeric"
                              pattern="\d*"
                              required
                            />
                          </FormField>
                        </div>
                      </div>
                    )}

                    {description === "New Zealand" && (
                      <div className="border rounded-md p-4 bg-white">
                        <h3 className="text-md font-medium mb-4">
                          New Zealand
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            label="Bank Name"
                            htmlFor="nz_bank_name"
                            required
                            error={errors.nz_bank_name}
                          >
                            <Input
                              id="nz_bank_name"
                              name="nz_bank_name"
                              value={formData.nz_bank_name || ""}
                              onChange={handleInputChange}
                              required
                            />
                          </FormField>

                          <FormField
                            label="Bank Email"
                            htmlFor="nz_bank_email"
                            required
                            error={errors.nz_bank_email}
                          >
                            <Input
                              id="nz_bank_email"
                              name="nz_bank_email"
                              type="email"
                              value={formData.nz_bank_email || ""}
                              onChange={handleInputChange}
                              pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
                              placeholder="example@domain.com"
                              required
                            />
                          </FormField>

                          <FormField
                            label="BSB"
                            htmlFor="nz_BSB"
                            required
                            error={errors.nz_BSB}
                          >
                            <Input
                              id="nz_BSB"
                              name="nz_BSB"
                              value={formData.nz_BSB || ""}
                              onChange={handleInputChange}
                              maxLength={6}
                              minLength={6}
                              inputMode="numeric"
                              pattern="\d*"
                              required
                            />
                          </FormField>

                          <FormField
                            label="Account Number"
                            htmlFor="nz_account"
                            required
                            error={errors.nz_account}
                          >
                            <Input
                              id="nz_account"
                              name="nz_account"
                              value={formData.nz_account || ""}
                              onChange={handleInputChange}
                              maxLength={10}
                              minLength={10}
                              inputMode="numeric"
                              pattern="\d*"
                              required
                            />
                          </FormField>
                        </div>
                      </div>
                    )}

                    {description === "Overseas" && (
                      <div className="border rounded-md p-4 bg-white">
                        <h3 className="text-md font-medium mb-4">Overseas</h3>
                        <FormField
                          label="IBAN or SWITCH"
                          htmlFor="IBAN_SWITCH_yn"
                          required={formData.payment_method === "Bank Transfer"}
                          error={errors.IBAN_SWITCH_yn}
                        >
                          <Select
                            name="IBAN_SWITCH_yn"
                            value={formData.IBAN_SWITCH_yn || ""}
                            onValueChange={(value) =>
                              handleSelectChange("IBAN_SWITCH_yn", value)
                            }
                          >
                            <SelectTrigger id="IBAN_SWITCH_yn">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IBAN">IBAN</SelectItem>
                              <SelectItem value="SWITCH">SWITCH</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>

                        {formData.IBAN_SWITCH_yn === "IBAN" && (
                          <>
                            <FormField
                              label="Bank Email"
                              htmlFor="overseas_bank_email"
                              required
                              error={errors.overseas_bank_email}
                            >
                              <Input
                                id="overseas_bank_email"
                                name="overseas_bank_email"
                                type="email"
                                value={formData.overseas_bank_email || ""}
                                onChange={handleInputChange}
                                pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
                                placeholder="example@domain.com"
                                required
                              />
                            </FormField>

                            <FormField
                              label="IBAN"
                              htmlFor="IBAN_input"
                              required
                              error={errors.IBAN_input}
                            >
                              <Input
                                id="IBAN_input"
                                name="IBAN_input"
                                value={formData.IBAN_input || ""}
                                onChange={handleInputChange}
                                maxLength={34}
                                minLength={34}
                                required
                              />
                            </FormField>
                          </>
                        )}

                        {formData.IBAN_SWITCH_yn === "SWITCH" && (
                          <FormField
                            label="SWITCH"
                            htmlFor="SWITCH_input"
                            required
                            error={errors.SWITCH_input}
                          >
                            <Input
                              id="SWITCH_input"
                              name="SWITCH_input"
                              value={formData.SWITCH_input || ""}
                              onChange={handleInputChange}
                              maxLength={34}
                              minLength={34}
                              required
                            />
                          </FormField>
                        )}
                      </div>
                    )}

                    <div className="mt-4">
                      <FormField
                        label="Please attach a recent (last 3 months) bank statement - PDF only"
                        htmlFor="file-input"
                        required
                        error={errors.bankStatement}
                      >
                        <div className="border-2 border-dashed rounded-md p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                          <input
                            type="file"
                            id="file-input"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileChange}
                            required
                          />
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                document.getElementById("file-input")?.click()
                              }
                            >
                              Choose a PDF file
                            </Button>
                            {bankStatement ? (
                              <p className="text-sm text-green-600 flex items-center gap-1">
                                <Check size={16} />
                                {bankStatement.name}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">
                                No file selected
                              </p>
                            )}
                          </div>
                        </div>
                      </FormField>
                    </div>
                  </>
                )}

                {formData.payment_method === "Bepay" && (
                  <div className="border rounded-md p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Biller Code"
                        htmlFor="biller_code"
                        required
                        error={errors.biller_code}
                      >
                        <Input
                          id="biller_code"
                          name="biller_code"
                          value={formData.biller_code || ""}
                          onChange={handleInputChange}
                          pattern="\d+"
                          title="Only numbers allowed"
                          required
                        />
                      </FormField>

                      <FormField
                        label="Ref Code"
                        htmlFor="ref_code"
                        required
                        error={errors.ref_code}
                      >
                        <Input
                          id="ref_code"
                          name="ref_code"
                          value={formData.ref_code || ""}
                          onChange={handleInputChange}
                          pattern="\d+"
                          title="Only numbers allowed"
                          required
                        />
                      </FormField>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            {/* 3. Consent Statement Section */}
            <FormSection title="3. Consent Statement">
              <div className="space-y-4">
                <div className="border rounded-md p-4 bg-white">
                  <h3 className="text-md font-medium mb-2">
                    Terms and Conditions
                  </h3>
                  <div className="h-80 overflow-y-auto border p-4 mb-4">
                    <iframe
                      src="/Supplierterm.pdf"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="Terms and Conditions"
                    ></iframe>
                  </div>

                  <div className="flex items-start gap-2">
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
                      className="mt-1"
                      required
                    />
                    <label htmlFor="iAgree" className="text-sm font-medium">
                      I acknowledge the terms and conditions
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                  </div>
                  {errors.iAgree && (
                    <p className="text-red-500 text-sm mt-1">{errors.iAgree}</p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Onboarding Form"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-4">
              Would you want to proceed?
            </h2>
            <p className="mb-6 text-gray-600">
              Please confirm that you want to submit the supplier onboarding
              form.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
              >
                No
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Yes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold">Thank you!</h2>
              <p className="text-center text-gray-600 mt-2">
                Your form has been successfully submitted. Thanks!
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleSuccessClose}
                className="bg-blue-600 hover:bg-blue-700"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierForm;
