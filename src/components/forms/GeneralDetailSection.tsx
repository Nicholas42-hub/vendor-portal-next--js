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
import { TextInput } from "../ui/TextInput";
import { Dropdown } from "../ui/Dropdown";
import { Checkbox } from "../ui/Checkbox";
import { countries } from "@/lib/countries";
// Define Props
interface GeneralDetailsSectionProps {
  data: VendorData["generalDetails"];
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onBlur: (field: string) => void;
  validateField: (field: string) => void; // Added validateField to props
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

// Component
export const GeneralDetailsSection: React.FC<GeneralDetailsSectionProps> = ({
  data,
  errors,
  touched,
  onChange,
  onCheckboxChange,
  onBlur,
  validateField, // Destructure validateField
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
        <Dropdown
          id="vendorHomeCountry"
          name="vendorHomeCountry"
          value={data.vendorHomeCountry}
          onChange={(e) => onChange("vendorHomeCountry", e.target.value)}
          onBlur={() => onBlur("vendorHomeCountry")}
          options={[
            { value: "", label: "Select an option", disabled: true },
            ...countries.map((country) => ({
              value: country,
              label: country,
            })),
          ]}
          required
          error={
            !!errors.vendorHomeCountry &&
            touched["generalDetails.vendorHomeCountry"]
          }
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
        <Dropdown
          id="primaryTradingBusinessUnit"
          name="primaryTradingBusinessUnit"
          value={data.primaryTradingBusinessUnit}
          onChange={(e) =>
            onChange("primaryTradingBusinessUnit", e.target.value)
          }
          onBlur={() => onBlur("primaryTradingBusinessUnit")}
          options={businessUnitOptions}
          required
          error={
            !!errors.primaryTradingBusinessUnit &&
            touched["generalDetails.primaryTradingBusinessUnit"]
          }
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
        <TextInput
          id="email"
          name="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          onBlur={() => {
            onBlur("email");
            validateField("email");
          }}
          placeholder="example@domain.com"
          type="email"
          pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}"
          title="Please enter a valid email address (e.g., example@domain.com)"
          required
          error={!!errors.email && touched["generalDetails.email"]}
        />
      </FormField>

      {/* Business Name */}
      <FormField
        label="Business Name"
        htmlFor="businessName"
        required
        error={errors.businessName}
        touched={touched["generalDetails.businessName"]}
      >
        <TextInput
          id="businessName"
          name="businessName"
          value={data.businessName}
          onChange={(e) => onChange("businessName", e.target.value)}
          onBlur={() => onBlur("businessName")}
          required
          error={
            !!errors.businessName && touched["generalDetails.businessName"]
          }
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
        <Dropdown
          id="vendorType"
          name="vendorType"
          value={data.vendorType}
          onChange={(e) => onChange("vendorType", e.target.value)}
          onBlur={() => onBlur("vendorType")}
          options={vendorTypeOptions}
          required
          error={!!errors.vendorType && touched["generalDetails.vendorType"]}
        />
      </FormField>
    </SectionContainer>
  );
};

export default GeneralDetailsSection;
