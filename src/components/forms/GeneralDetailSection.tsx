import React from "react";
import { styled } from "@mui/material/styles";
import {
  VendorData,
  TradingEntity,
  BusinessUnit,
  VendorType,
  YesNo,
  businessUnitOptions,
  tradingEntities,
  vendorTypeOptions,
} from "../../models/VendorTypes";
import { FormField } from "../ui/FormField";
import { ConditionalInput } from "../ui/ConditionalInput";
import { Checkbox } from "../ui/Checkbox";
import { countries } from "@/lib/countries";

// Define Props
interface GeneralDetailsSectionProps {
  data: VendorData["generalDetails"];
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  isChecking?: { [key: string]: boolean }; // Add isChecking prop
  onChange: (field: string, value: any) => void;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onBlur: (field: string) => void;
  validateField?: (field: string) => void;
  isEditable?: boolean; // Add isEditable prop with default value true
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

// New styled components for loading and validation indicators
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

// Component
export const GeneralDetailsSection: React.FC<GeneralDetailsSectionProps> = ({
  data,
  errors,
  touched,
  isChecking = {}, // Default to empty object if not provided
  onChange,
  onCheckboxChange,
  onBlur,
  validateField,
  isEditable = true, // Default to editable if not specified
}) => {
  return (
    <SectionContainer>
      <FormLegend>Vendor Account Set Up Form</FormLegend>
      <SectionTitle>1. General Details</SectionTitle>

      {/* Trading Entities */}
      <FormField
        label="Select Trading Entity(ies)"
        htmlFor="tradingEntities"
        required
        error={errors.tradingEntities}
        touched={touched["generalDetails.tradingEntities"]}
      >
        <CheckboxContainer>
          {tradingEntities.map((entity, index) => (
            <CheckboxColumn key={entity.id}>
              <Checkbox
                id={entity.id}
                name="tradingEntities"
                value={entity.id}
                checked={data.tradingEntities.includes(entity.id)}
                onChange={(e) =>
                  onCheckboxChange(
                    "tradingEntities",
                    entity.id,
                    e.target.checked
                  )
                }
                disabled={!isEditable}
                label={entity.label}
              />
            </CheckboxColumn>
          ))}
        </CheckboxContainer>
      </FormField>

      {/* Vendor Home Country */}
      <FormField
        label="Vendor Home Country"
        htmlFor="vendorHomeCountry"
        required
        error={errors.vendorHomeCountry}
        touched={touched["generalDetails.vendorHomeCountry"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="vendor_home_country"
          value={data.vendorHomeCountry}
          onChange={(value) => onChange("vendorHomeCountry", value)}
          options={countries.map((country) => ({
            value: country,
            label: country,
          }))}
          placeholder="Select country"
        />
      </FormField>

      {/* Primary Trading Business Unit */}
      <FormField
        label="Primary Trading Business Unit"
        htmlFor="primaryTradingBusinessUnit"
        required
        error={errors.primaryTradingBusinessUnit}
        touched={touched["generalDetails.primaryTradingBusinessUnit"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="primary_trading_business_unit"
          value={data.primaryTradingBusinessUnit}
          onChange={(value) => onChange("primaryTradingBusinessUnit", value)}
          options={businessUnitOptions.map((unit) => ({
            value: unit.value,
            label: unit.label,
          }))}
          placeholder="Select business unit"
        />
      </FormField>

      {/* Email */}
      <FormField
        label="Email"
        htmlFor="email"
        required
        error={errors.email}
        touched={touched["generalDetails.email"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="text"
          name="email"
          value={data.email}
          onChange={(value) => onChange("email", value)}
          placeholder="example@domain.com"
        />
        {/* Add loading indicator when checking email */}
        {isChecking["generalDetails.email"] && (
          <LoadingIndicator>
            <Spinner />
            Checking email availability...
          </LoadingIndicator>
        )}
      </FormField>

      {/* Business Name */}
      <FormField
        label="Business Name"
        htmlFor="businessName"
        required
        error={errors.businessName}
        touched={touched["generalDetails.businessName"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="text"
          name="business_name"
          value={data.businessName}
          onChange={(value) => onChange("businessName", value)}
          placeholder="Business name"
        />
      </FormField>

      {/* Trading Name (Optional) */}
      <FormField
        label="Trading Name (if different from Business Name)"
        htmlFor="tradingName"
        error={errors.tradingName}
        touched={touched["generalDetails.tradingName"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="text"
          name="trading_name"
          value={data.tradingName || ""}
          onChange={(value) => onChange("tradingName", value)}
          placeholder="Trading name"
        />
      </FormField>

      {/* Vendor Type */}
      <FormField
        label="Vendor Type"
        htmlFor="vendorType"
        required
        error={errors.vendorType}
        touched={touched["generalDetails.vendorType"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="vendor_type"
          value={data.vendorType}
          onChange={(value) => onChange("vendorType", value)}
          options={vendorTypeOptions.map((type) => ({
            value: type.value,
            label: type.label,
          }))}
          placeholder="Select vendor type"
        />
      </FormField>
    </SectionContainer>
  );
};

export default GeneralDetailsSection;
