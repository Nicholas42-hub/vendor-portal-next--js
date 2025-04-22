import React from "react";
import { styled } from "@mui/material/styles";
import { countries } from "@/lib/countries";
import { FormField } from "../ui/FormField";
import { TextInput } from "../ui/TextInput";
import { Dropdown } from "../ui/Dropdown";
import { Checkbox } from "../ui/Checkbox";
import { Textarea } from "@/components/ui/textarea";
import { SupplierFormData } from "../../models/VendorTypes";

// Define Props
interface SupplierFormProps {
  data: SupplierFormData;
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  isChecking?: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onBlur: (field: string) => void;
  validateField: (field: string) => void;
  isEditable?: boolean;
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

const FormLegend = styled("legend")({
  fontFamily:
    '-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: "24px",
  fontWeight: 800,
  color: "rgb(31, 31, 35)",
  marginBottom: "20px",
});

const CheckboxContainer = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  marginBottom: "15px",
});

const CheckboxColumn = styled("div")({
  flex: "1 1 33%",
  minWidth: "250px",
});

// Loading indicator components
const LoadingIndicator = styled("div")({
  color: "#2196F3",
  fontSize: "0.8rem",
  marginTop: "4px",
  display: "flex",
  alignItems: "center",
});

const Spinner = styled("span")({
  display: "inline-block",
  width: "12px",
  height: "12px",
  border: "2px solid rgba(33, 150, 243, 0.3)",
  borderRadius: "50%",
  borderTopColor: "#2196F3",
  animation: "spin 0.8s linear infinite",
  marginRight: "8px",
  "@keyframes spin": {
    to: { transform: "rotate(360deg)" },
  },
});

const Note = styled("p")({
  fontSize: "14px",
  color: "#666",
  marginTop: "4px",
  marginBottom: "15px",
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

// Yes/No options
const yesNoOptions = [
  { value: "", label: "Select an option", disabled: true },
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

// Payment method options
const paymentMethodOptions = [
  { value: "", label: "Select a method", disabled: true },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Bpay", label: "Bpay" },
];

// Banking type options
const bankingTypeOptions = [
  { value: "", label: "Select an option", disabled: true },
  { value: "IBAN", label: "IBAN" },
  { value: "SWIFT", label: "SWIFT" },
];

export const SupplierForm: React.FC<SupplierFormProps> = ({
  data,
  errors,
  touched,
  isChecking = {},
  onChange,
  onCheckboxChange,
  onBlur,
  validateField,
  isEditable = true,
}) => {
  return (
    <SectionContainer>
      <FormLegend>Supplier Onboarding Form</FormLegend>

      {/* SECTION 1: SUPPLIER DETAILS */}
      <SectionTitle>1. Supplier Details</SectionTitle>

      {/* Business Name */}
      <FormField
        label="Business Name"
        htmlFor="business_name"
        required
        error={errors.business_name}
        touched={touched["business_name"]}
      >
        <TextInput
          id="business_name"
          name="business_name"
          value={data.business_name}
          onChange={(e) => onChange("business_name", e.target.value)}
          onBlur={() => onBlur("business_name")}
          required
          disabled={!isEditable}
          error={!!errors.business_name && touched["business_name"]}
        />
      </FormField>

      {/* Trading Name */}
      <FormField
        label="Trading Name (if different to Business Name)"
        htmlFor="trading_name"
        required
        error={errors.trading_name}
        touched={touched["trading_name"]}
      >
        <TextInput
          id="trading_name"
          name="trading_name"
          value={data.trading_name || ""}
          onChange={(e) => onChange("trading_name", e.target.value)}
          onBlur={() => onBlur("trading_name")}
          required
          disabled={!isEditable}
          error={!!errors.trading_name && touched["trading_name"]}
        />
      </FormField>

      {/* Website */}
      <FormField
        label="Website"
        htmlFor="website"
        error={errors.website}
        touched={touched["website"]}
      >
        <TextInput
          id="website"
          name="website"
          value={data.website || ""}
          onChange={(e) => onChange("website", e.target.value)}
          onBlur={() => onBlur("website")}
          placeholder="https://example.com"
          disabled={!isEditable}
          error={!!errors.website && touched["website"]}
        />
      </FormField>

      {/* Country */}
      <FormField
        label="Country"
        htmlFor="country"
        required
        error={errors.country}
        touched={touched["country"]}
      >
        <Dropdown
          id="country"
          name="country"
          value={data.country}
          onChange={(e) => onChange("country", e.target.value)}
          onBlur={() => onBlur("country")}
          options={[
            { value: "", label: "Select a country", disabled: true },
            ...countries.map((country) => ({
              value: country,
              label: country,
            })),
          ]}
          required
          disabled={!isEditable}
          error={!!errors.country && touched["country"]}
        />
      </FormField>

      {/* GST Registered */}
      <FormField
        label="Registered for GST?"
        htmlFor="gst_registered"
        required
        error={errors.gst_registered}
        touched={touched["gst_registered"]}
      >
        <Dropdown
          id="gst_registered"
          name="gst_registered"
          value={data.gst_registered}
          onChange={(e) => onChange("gst_registered", e.target.value)}
          onBlur={() => onBlur("gst_registered")}
          options={yesNoOptions}
          required
          disabled={!isEditable}
          error={!!errors.gst_registered && touched["gst_registered"]}
        />
      </FormField>

      {/* Has Tax ID - only for countries other than Australia and New Zealand */}
      {data.country &&
        data.country !== "New Zealand" &&
        data.country !== "Australia" && (
          <FormField
            label="If you have an ABN or NZ GST, please provide your details below."
            htmlFor="has_tax_id"
            error={errors.has_tax_id}
            touched={touched["has_tax_id"]}
          >
            <Dropdown
              id="has_tax_id"
              name="has_tax_id"
              value={data.has_tax_id}
              onChange={(e) => onChange("has_tax_id", e.target.value)}
              onBlur={() => onBlur("has_tax_id")}
              options={yesNoOptions}
              disabled={!isEditable}
              error={!!errors.has_tax_id && touched["has_tax_id"]}
            />
          </FormField>
        )}

      {/* ABN or GST selection - only if has_tax_id is Yes */}
      {data.country &&
        data.country !== "New Zealand" &&
        data.country !== "Australia" &&
        data.has_tax_id === "Yes" && (
          <FormField
            label="ABN or GST"
            htmlFor="ANB_GST"
            error={errors.ANB_GST}
            touched={touched["ANB_GST"]}
          >
            <Dropdown
              id="ANB_GST"
              name="ANB_GST"
              value={data.ANB_GST}
              onChange={(e) => onChange("ANB_GST", e.target.value)}
              onBlur={() => onBlur("ANB_GST")}
              options={[
                { value: "", label: "Select an option", disabled: true },
                { value: "ABN", label: "ABN" },
                { value: "GST", label: "GST" },
              ]}
              disabled={!isEditable}
              error={!!errors.ANB_GST && touched["ANB_GST"]}
            />
          </FormField>
        )}

      {/* GST - Only for New Zealand or if ANB_GST is GST */}
      {(data.country === "New Zealand" ||
        (data.country !== "New Zealand" && data.ANB_GST === "GST")) && (
        <FormField
          label="New Zealand Goods & Services Tax Number (GST)"
          htmlFor="gst"
          required
          error={errors.gst}
          touched={touched["gst"]}
        >
          <TextInput
            id="gst"
            name="gst"
            value={data.gst || ""}
            onChange={(e) => onChange("gst", e.target.value)}
            onBlur={() => onBlur("gst")}
            required
            disabled={!isEditable}
            error={!!errors.gst && touched["gst"]}
          />
        </FormField>
      )}

      {/* ABN - Only for Australia or if ANB_GST is ABN */}
      {(data.country === "Australia" ||
        (data.country !== "Australia" && data.ANB_GST === "ABN")) && (
        <FormField
          label="Australian Business Number (ABN)"
          htmlFor="abn"
          required
          error={errors.abn}
          touched={touched["abn"]}
        >
          <TextInput
            id="abn"
            name="abn"
            value={data.abn || ""}
            onChange={(e) => onChange("abn", e.target.value)}
            onBlur={() => onBlur("abn")}
            maxLength={11}
            required
            disabled={!isEditable}
            error={!!errors.abn && touched["abn"]}
          />
          <Note>Must be exactly 11 digits</Note>
        </FormField>
      )}

      {/* Address - with 100 character limit */}
      <FormField
        label="Address"
        htmlFor="address"
        error={errors.address}
        touched={touched["address"]}
      >
        <Textarea
          id="address"
          name="address"
          value={data.address || ""}
          onChange={(e) => onChange("address", e.target.value)}
          onBlur={() => onBlur("address")}
          placeholder="Enter your address (max 100 characters)"
          maxLength={100}
          disabled={!isEditable}
          className={errors.address ? "border-red-500" : ""}
        />
        <Note>{data.address?.length || 0}/100 characters</Note>
      </FormField>

      {/* City */}
      <FormField
        label="City"
        htmlFor="city"
        required
        error={errors.city}
        touched={touched["city"]}
      >
        <TextInput
          id="city"
          name="city"
          value={data.city || ""}
          onChange={(e) => onChange("city", e.target.value)}
          onBlur={() => onBlur("city")}
          required
          disabled={!isEditable}
          error={!!errors.city && touched["city"]}
        />
      </FormField>

      {/* State */}
      <FormField
        label="State"
        htmlFor="state"
        required
        error={errors.state}
        touched={touched["state"]}
      >
        <TextInput
          id="state"
          name="state"
          value={data.state || ""}
          onChange={(e) => onChange("state", e.target.value)}
          onBlur={() => onBlur("state")}
          required
          disabled={!isEditable}
          error={!!errors.state && touched["state"]}
        />
      </FormField>

      {/* Postcode */}
      <FormField
        label="Postcode"
        htmlFor="postcode"
        required
        error={errors.postcode}
        touched={touched["postcode"]}
      >
        <TextInput
          id="postcode"
          name="postcode"
          value={data.postcode || ""}
          onChange={(e) => onChange("postcode", e.target.value)}
          onBlur={() => onBlur("postcode")}
          required
          disabled={!isEditable}
          error={!!errors.postcode && touched["postcode"]}
        />
      </FormField>

      {/* Primary Contact Email */}
      <FormField
        label="Primary Contact Email"
        htmlFor="primary_contact_email"
        required
        error={errors.primary_contact_email}
        touched={touched["primary_contact_email"]}
      >
        <TextInput
          id="primary_contact_email"
          name="primary_contact_email"
          type="email"
          value={data.primary_contact_email || ""}
          onChange={(e) => onChange("primary_contact_email", e.target.value)}
          onBlur={() => onBlur("primary_contact_email")}
          placeholder="example@domain.com"
          required
          disabled={!isEditable}
          error={
            !!errors.primary_contact_email && touched["primary_contact_email"]
          }
        />
      </FormField>

      {/* Telephone */}
      <FormField
        label="Telephone"
        htmlFor="telephone"
        required
        error={errors.telephone}
        touched={touched["telephone"]}
      >
        <TextInput
          id="telephone"
          name="telephone"
          value={data.telephone || ""}
          onChange={(e) => onChange("telephone", e.target.value)}
          onBlur={() => onBlur("telephone")}
          required
          disabled={!isEditable}
          error={!!errors.telephone && touched["telephone"]}
        />
      </FormField>

      {/* PO Email */}
      <FormField
        label="PO Email"
        htmlFor="po_email"
        required
        error={errors.po_email}
        touched={touched["po_email"]}
      >
        <TextInput
          id="po_email"
          name="po_email"
          type="email"
          value={data.po_email || ""}
          onChange={(e) => onChange("po_email", e.target.value)}
          onBlur={() => onBlur("po_email")}
          placeholder="example@domain.com"
          required
          disabled={!isEditable}
          error={!!errors.po_email && touched["po_email"]}
        />
      </FormField>

      {/* Return Order Email */}
      <FormField
        label="Return Order Email"
        htmlFor="return_order_email"
        required
        error={errors.return_order_email}
        touched={touched["return_order_email"]}
      >
        <TextInput
          id="return_order_email"
          name="return_order_email"
          type="email"
          value={data.return_order_email || ""}
          onChange={(e) => onChange("return_order_email", e.target.value)}
          onBlur={() => onBlur("return_order_email")}
          placeholder="example@domain.com"
          required
          disabled={!isEditable}
          error={!!errors.return_order_email && touched["return_order_email"]}
        />
      </FormField>

      {/* Australian Invoice Currency - only if AU entities are selected */}
      {(hasAuEntities || hasNzEntities) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AU Invoice Currency */}
                {hasAuEntities && (
      ) && (
        <FormField
          label="Select the Invoice currency when trading with our Australian based entity(ies)"
          htmlFor="au_invoice_currency"
          required
          error={errors.au_invoice_currency}
          touched={touched["au_invoice_currency"]}
        >
          <Dropdown
            id="au_invoice_currency"
            name="au_invoice_currency"
            value={data.au_invoice_currency || ""}
            onChange={(e) => onChange("au_invoice_currency", e.target.value)}
            onBlur={() => onBlur("au_invoice_currency")}
            options={[
              { value: "", label: "Select a currency", disabled: true },
              ...currencies,
            ]}
            required
            disabled={!isEditable}
            error={
              !!errors.au_invoice_currency && touched["au_invoice_currency"]
            }
          />
        </FormField>
      )}

      {/* New Zealand Invoice Currency - only if NZ entities are selected */}
      {hasNzEntities && (
                  <div className="space-y-2"> (
        <FormField
          label="Select the Invoice currency when trading with NZ based entity(ies)"
          htmlFor="nz_invoice_currency"
          required
          error={errors.nz_invoice_currency}
          touched={touched["nz_invoice_currency"]}
        >
          <Dropdown
            id="nz_invoice_currency"
            name="nz_invoice_currency"
            value={data.nz_invoice_currency || ""}
            onChange={(e) => onChange("nz_invoice_currency", e.target.value)}
            onBlur={() => onBlur("nz_invoice_currency")}
            options={[
              { value: "", label: "Select a currency", disabled: true },
              ...currencies,
            ]}
            required
            disabled={!isEditable}
            error={
              !!errors.nz_invoice_currency && touched["nz_invoice_currency"]
            }
          />
        </FormField>
      )}

      {/* SECTION 2: BANKING DETAILS */}
      <SectionTitle>2. Banking Details</SectionTitle>

      {/* Payment Method */}
      <FormField
        label="Payment Method"
        htmlFor="payment_method"
        required
        error={errors.payment_method}
        touched={touched["payment_method"]}
      >
        <Dropdown
          id="payment_method"
          name="payment_method"
          value={data.payment_method}
          onChange={(e) => onChange("payment_method", e.target.value)}
          onBlur={() => onBlur("payment_method")}
          options={paymentMethodOptions}
          required
          disabled={!isEditable}
          error={!!errors.payment_method && touched["payment_method"]}
        />
      </FormField>

      {/* BANK TRANSFER SECTION */}
      {data.payment_method === "Bank Transfer" && (
        <>
          {/* AUSTRALIAN BANKING DETAILS */}
          {data.trading_entities.some((entity) =>
            ["ALAW", "AUDF", "AUTE", "AUPG", "AUAW", "LSAP"].includes(entity)
          ) && (
            <div className="bg-white p-4 rounded-md border mb-6">
              <h3 className="font-medium mb-4">
                Fill the banking details when trading with Australian based
                entity(ies)
              </h3>

              {/* AU Bank Country */}
              <FormField
                label="Bank Country"
                htmlFor="au_bank_country"
                required
                error={errors.au_bank_country}
                touched={touched["au_bank_country"]}
              >
                <Dropdown
                  id="au_bank_country"
                  name="au_bank_country"
                  value={data.au_bank_country || ""}
                  onChange={(e) => onChange("au_bank_country", e.target.value)}
                  onBlur={() => onBlur("au_bank_country")}
                  options={[
                    { value: "", label: "Select a country", disabled: true },
                    ...countries.map((country) => ({
                      value: country,
                      label: country,
                    })),
                  ]}
                  required
                  disabled={!isEditable}
                  error={!!errors.au_bank_country && touched["au_bank_country"]}
                />
              </FormField>

              {/* AU Bank Address */}
              <FormField
                label="Bank Address"
                htmlFor="au_bank_address"
                required
                error={errors.au_bank_address}
                touched={touched["au_bank_address"]}
              >
                <TextInput
                  id="au_bank_address"
                  name="au_bank_address"
                  value={data.au_bank_address || ""}
                  onChange={(e) => onChange("au_bank_address", e.target.value)}
                  onBlur={() => onBlur("au_bank_address")}
                  required
                  disabled={!isEditable}
                  error={!!errors.au_bank_address && touched["au_bank_address"]}
                />
              </FormField>

              {/* AU Bank Currency Code */}
              <FormField
                label="Bank Currency Code"
                htmlFor="au_bank_currency_code"
                required
                error={errors.au_bank_currency_code}
                touched={touched["au_bank_currency_code"]}
              >
                <Dropdown
                  id="au_bank_currency_code"
                  name="au_bank_currency_code"
                  value={data.au_bank_currency_code || ""}
                  onChange={(e) =>
                    onChange("au_bank_currency_code", e.target.value)
                  }
                  onBlur={() => onBlur("au_bank_currency_code")}
                  options={[
                    { value: "", label: "Select a currency", disabled: true },
                    ...currencies,
                  ]}
                  required
                  disabled={!isEditable}
                  error={
                    !!errors.au_bank_currency_code &&
                    touched["au_bank_currency_code"]
                  }
                />
              </FormField>

              {/* AU Bank Clearing Code */}
              <FormField
                label="Bank Clearing Code"
                htmlFor="au_bank_clearing_code"
                error={errors.au_bank_clearing_code}
                touched={touched["au_bank_clearing_code"]}
              >
                <TextInput
                  id="au_bank_clearing_code"
                  name="au_bank_clearing_code"
                  value={data.au_bank_clearing_code || ""}
                  onChange={(e) =>
                    onChange("au_bank_clearing_code", e.target.value)
                  }
                  onBlur={() => onBlur("au_bank_clearing_code")}
                  disabled={!isEditable}
                  error={
                    !!errors.au_bank_clearing_code &&
                    touched["au_bank_clearing_code"]
                  }
                />
              </FormField>

              {/* AU Remittance Email */}
              <FormField
                label="Remittance Email"
                htmlFor="au_remittance_email"
                required
                error={errors.au_remittance_email}
                touched={touched["au_remittance_email"]}
              >
                <TextInput
                  id="au_remittance_email"
                  name="au_remittance_email"
                  type="email"
                  value={data.au_remittance_email || ""}
                  onChange={(e) =>
                    onChange("au_remittance_email", e.target.value)
                  }
                  onBlur={() => onBlur("au_remittance_email")}
                  placeholder="example@domain.com"
                  required
                  disabled={!isEditable}
                  error={
                    !!errors.au_remittance_email &&
                    touched["au_remittance_email"]
                  }
                />
              </FormField>

              {/* AU Domestic Banking Fields */}
              {data.au_bank_country === "Australia" && (
                <div className="border-t pt-4 mt-4">
                  {/* AU BSB */}
                  <FormField
                    label="BSB"
                    htmlFor="au_bsb"
                    required
                    error={errors.au_bsb}
                    touched={touched["au_bsb"]}
                  >
                    <TextInput
                      id="au_bsb"
                      name="au_bsb"
                      value={data.au_bsb || ""}
                      onChange={(e) => onChange("au_bsb", e.target.value)}
                      onBlur={() => onBlur("au_bsb")}
                      maxLength={6}
                      required
                      disabled={!isEditable}
                      error={!!errors.au_bsb && touched["au_bsb"]}
                    />
                    <Note>Must be exactly 6 digits</Note>
                  </FormField>

                  {/* AU Account */}
                  <FormField
                    label="Account Number"
                    htmlFor="au_account"
                    required
                    error={errors.au_account}
                    touched={touched["au_account"]}
                  >
                    <TextInput
                      id="au_account"
                      name="au_account"
                      value={data.au_account || ""}
                      onChange={(e) => onChange("au_account", e.target.value)}
                      onBlur={() => onBlur("au_account")}
                      maxLength={10}
                      required
                      disabled={!isEditable}
                      error={!!errors.au_account && touched["au_account"]}
                    />
                    <Note>Must be exactly 10 digits</Note>
                  </FormField>
                </div>
              )}
            </div>
          )}

          {/* NEW ZEALAND BANKING DETAILS */}
          {data.trading_entities.some((entity) =>
            ["NZAW", "NZDF", "NZTE"].includes(entity)
          ) && (
            <div className="bg-white p-4 rounded-md border mb-6">
              <h3 className="font-medium mb-4">
                Fill banking details when trading with our NZ based entity(ies)
              </h3>

              {/* NZ Bank Country */}
              <FormField
                label="Bank Country"
                htmlFor="nz_bank_country"
                required
                error={errors.nz_bank_country}
                touched={touched["nz_bank_country"]}
              >
                <Dropdown
                  id="nz_bank_country"
                  name="nz_bank_country"
                  value={data.nz_bank_country || ""}
                  onChange={(e) => onChange("nz_bank_country", e.target.value)}
                  onBlur={() => onBlur("nz_bank_country")}
                  options={[
                    { value: "", label: "Select a country", disabled: true },
                    ...countries.map((country) => ({
                      value: country,
                      label: country,
                    })),
                  ]}
                  required
                  disabled={!isEditable}
                  error={!!errors.nz_bank_country && touched["nz_bank_country"]}
                />
              </FormField>

              {/* NZ Bank Address */}
              <FormField
                label="Bank Address"
                htmlFor="nz_bank_address"
                required
                error={errors.nz_bank_address}
                touched={touched["nz_bank_address"]}
              >
                <TextInput
                  id="nz_bank_address"
                  name="nz_bank_address"
                  value={data.nz_bank_address || ""}
                  onChange={(e) => onChange("nz_bank_address", e.target.value)}
                  onBlur={() => onBlur("nz_bank_address")}
                  required
                  disabled={!isEditable}
                  error={!!errors.nz_bank_address && touched["nz_bank_address"]}
                />
              </FormField>

              {/* NZ Bank Currency Code */}
              <FormField
                label="Bank Currency Code"
                htmlFor="nz_bank_currency_code"
                required
                error={errors.nz_bank_currency_code}
                touched={touched["nz_bank_currency_code"]}
              >
                <Dropdown
                  id="nz_bank_currency_code"
                  name="nz_bank_currency_code"
                  value={data.nz_bank_currency_code || ""}
                  onChange={(e) =>
                    onChange("nz_bank_currency_code", e.target.value)
                  }
                  onBlur={() => onBlur("nz_bank_currency_code")}
                  options={[
                    { value: "", label: "Select a currency", disabled: true },
                    ...currencies,
                  ]}
                  required
                  disabled={!isEditable}
                  error={
                    !!errors.nz_bank_currency_code &&
                    touched["nz_bank_currency_code"]
                  }
                />
              </FormField>

              {/* NZ Bank Clearing Code */}
              <FormField
                label="Bank Clearing Code"
                htmlFor="nz_bank_clearing_code"
                error={errors.nz_bank_clearing_code}
                touched={touched["nz_bank_clearing_code"]}
              >
                <TextInput
                  id="nz_bank_clearing_code"
                  name="nz_bank_clearing_code"
                  value={data.nz_bank_clearing_code || ""}
                  onChange={(e) =>
                    onChange("nz_bank_clearing_code", e.target.value)
                  }
                  onBlur={() => onBlur("nz_bank_clearing_code")}
                  disabled={!isEditable}
                  error={
                    !!errors.nz_bank_clearing_code &&
                    touched["nz_bank_clearing_code"]
                  }
                />
              </FormField>

              {/* NZ Remittance Email */}
              <FormField
                label="Remittance Email"
                htmlFor="nz_remittance_email"
                required
                error={errors.nz_remittance_email}
                touched={touched["nz_remittance_email"]}
              >
                <TextInput
                  id="nz_remittance_email"
                  name="nz_remittance_email"
                  type="email"
                  value={data.nz_remittance_email || ""}
                  onChange={(e) =>
                    onChange("nz_remittance_email", e.target.value)
                  }
                  onBlur={() => onBlur("nz_remittance_email")}
                  placeholder="example@domain.com"
                  required
                  disabled={!isEditable}
                  error={
                    !!errors.nz_remittance_email &&
                    touched["nz_remittance_email"]
                  }
                />
              </FormField>

              {/* NZ Domestic Banking Fields */}
              {data.nz_bank_country === "New Zealand" && (
                <div className="border-t pt-4 mt-4">
                  {/* NZ BSB */}
                  <FormField
                    label="BSB"
                    htmlFor="nz_bsb"
                    required
                    error={errors.nz_bsb}
                    touched={touched["nz_bsb"]}
                  >
                    <TextInput
                      id="nz_bsb"
                      name="nz_bsb"
                      value={data.nz_bsb || ""}
                      onChange={(e) => onChange("nz_bsb", e.target.value)}
                      onBlur={() => onBlur("nz_bsb")}
                      maxLength={6}
                      required
                      disabled={!isEditable}
                      error={!!errors.nz_bsb && touched["nz_bsb"]}
                    />
                    <Note>Must be exactly 6 digits</Note>
                  </FormField>

                  {/* NZ Account */}
                  <FormField
                    label="Account Number"
                    htmlFor="nz_account"
                    required
                    error={errors.nz_account}
                    touched={touched["nz_account"]}
                  >
                    <TextInput
                      id="nz_account"
                      name="nz_account"
                      value={data.nz_account || ""}
                      onChange={(e) => onChange("nz_account", e.target.value)}
                      onBlur={() => onBlur("nz_account")}
                      maxLength={10}
                      required
                      disabled={!isEditable}
                      error={!!errors.nz_account && touched["nz_account"]}
                    />
                    <Note>Must be exactly 10 digits</Note>
                  </FormField>
                </div>
              )}
            </div>
          )}

          {/* OVERSEAS BANKING FIELDS */}
          {((data.au_bank_country &&
            data.au_bank_country !== "Australia" &&
            data.au_bank_country !== "New Zealand") ||
            (data.nz_bank_country &&
              data.nz_bank_country !== "Australia" &&
              data.nz_bank_country !== "New Zealand")) && (
            <div className="bg-white p-4 rounded-md border mb-6">
              <h3 className="font-medium mb-4">Overseas Banking Details</h3>

              {/* IBAN or SWIFT selection */}
              <FormField
                label="IBAN or SWIFT"
                htmlFor="overseas_iban_switch"
                required
                error={errors.overseas_iban_switch}
                touched={touched["overseas_iban_switch"]}
              >
                <Dropdown
                  id="overseas_iban_switch"
                  name="overseas_iban_switch"
                  value={data.overseas_iban_switch || ""}
                  onChange={(e) =>
                    onChange("overseas_iban_switch", e.target.value)
                  }
                  onBlur={() => onBlur("overseas_iban_switch")}
                  options={bankingTypeOptions}
                  required
                  disabled={!isEditable}
                  error={
                    !!errors.overseas_iban_switch &&
                    touched["overseas_iban_switch"]
                  }
                />
              </FormField>

              {/* IBAN Field */}
              {data.overseas_iban_switch === "IBAN" && (
                <FormField
                  label="IBAN"
                  htmlFor="overseas_iban"
                  required
                  error={errors.overseas_iban}
                  touched={touched["overseas_iban"]}
                >
                  <TextInput
                    id="overseas_iban"
                    name="overseas_iban"
                    value={data.overseas_iban || ""}
                    onChange={(e) => onChange("overseas_iban", e.target.value)}
                    onBlur={() => onBlur("overseas_iban")}
                    required
                    disabled={!isEditable}
                    error={!!errors.overseas_iban && touched["overseas_iban"]}
                  />
                </FormField>
              )}

              {/* SWIFT Field */}
              {data.overseas_iban_switch === "SWIFT" && (
                <FormField
                  label="SWIFT"
                  htmlFor="overseas_swift"
                  required
                  error={errors.overseas_swift}
                  touched={touched["overseas_swift"]}
                >
                  <TextInput
                    id="overseas_swift"
                    name="overseas_swift"
                    value={data.overseas_swift || ""}
                    onChange={(e) => onChange("overseas_swift", e.target.value)}
                    onBlur={() => onBlur("overseas_swift")}
                    required
                    disabled={!isEditable}
                    error={!!errors.overseas_swift && touched["overseas_swift"]}
                  />
                </FormField>
              )}
            </div>
          )}
        </>
      )}

      {/* BPAY SECTION */}
      {data.payment_method === "Bpay" && (
        <div className="bg-white p-4 rounded-md border mb-6">
          <h3 className="font-medium mb-4">Bpay Details</h3>

          {/* Biller Code */}
          <FormField
            label="Biller Code"
            htmlFor="biller_code"
            required
            error={errors.biller_code}
            touched={touched["biller_code"]}
          >
            <TextInput
              id="biller_code"
              name="biller_code"
              value={data.biller_code || ""}
              onChange={(e) => onChange("biller_code", e.target.value)}
              onBlur={() => onBlur("biller_code")}
              required
              disabled={!isEditable}
              error={!!errors.biller_code && touched["biller_code"]}
            />
            <Note>Numbers only</Note>
          </FormField>

          {/* Reference Code */}
          <FormField
            label="Reference Code"
            htmlFor="ref_code"
            required
            error={errors.ref_code}
            touched={touched["ref_code"]}
          >
            <TextInput
              id="ref_code"
              name="ref_code"
              value={data.ref_code || ""}
              onChange={(e) => onChange("ref_code", e.target.value)}
              onBlur={() => onBlur("ref_code")}
              required
              disabled={!isEditable}
              error={!!errors.ref_code && touched["ref_code"]}
            />
            <Note>Numbers only</Note>
          </FormField>
        </div>
      )}

      {/* SECTION 3: TERMS AND CONDITIONS */}
      <SectionTitle>3. Terms and Conditions</SectionTitle>

      {/* Terms and Conditions Agreement */}
      <FormField
        label="I acknowledge the terms and conditions"
        htmlFor="iAgree"
        required
        error={errors.iAgree}
        touched={touched["iAgree"]}
      >
        <div className="flex items-center space-x-2">
          <Checkbox
            id="iAgree"
            name="iAgree"
            checked={data.iAgree}
            onChange={(e) => onChange("iAgree", e.target.checked)}
            disabled={!isEditable}
          />
          <span className="text-sm">
            I acknowledge that I have read and agree to the terms and conditions
            <span className="text-red-500">*</span>
          </span>
        </div>
      </FormField>
    </SectionContainer>
  );
};

export default SupplierForm;
