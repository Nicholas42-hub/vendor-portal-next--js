import React, { useEffect, useState, useMemo } from "react";
import { styled } from "@mui/material/styles";
import {
  VendorData,
  businessUnitOptions,
  tradingEntities,
  vendorTypeOptions,
} from "../../models/VendorTypes";
import { FormField } from "../ui/FormField";
import { ConditionalInput } from "../ui/ConditionalInput";
import { Checkbox } from "../ui/Checkbox";
import { countries } from "@/lib/countries";

// Component props remain unchanged
interface GeneralDetailsSectionProps {
  data: VendorData["generalDetails"];
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  isChecking?: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onBlur: (field: string) => void;
  validateField?: (field: string) => void;
  isEditable?: boolean;
}

// Styled components unchanged
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

/**
 * GeneralDetailsSection Component
 * IMPORTANT: This component was completely refactored to fix the "Rendered fewer hooks than expected" error
 * The key fixes are:
 * 1. Ensuring all hooks are declared at the top level of the component
 * 2. No conditional hook calls anywhere
 * 3. Safe handling of all props to prevent undefined errors
 * 4. No early returns that might skip hooks
 */
function GeneralDetailsSectionBase({
  data = {},
  errors = {},
  touched = {},
  isChecking = {},
  onChange = () => {},
  onCheckboxChange = () => {},
  onBlur = () => {},
  validateField,
  isEditable = true,
}: GeneralDetailsSectionProps) {
  // IMPORTANT: All hooks must be defined here at the top level
  // This ensures they're called in the same order on every render
  const [formReady, setFormReady] = useState(true);

  // Always declare all hooks, even if they're not used in all code paths
  useEffect(() => {
    // This empty effect is needed to ensure consistent hook ordering
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Use memo hook to safely process data with fallbacks for undefined values
  const safeData = useMemo(
    () => ({
      tradingEntities: data?.tradingEntities || [],
      vendor_home_country: data?.vendor_home_country || "",
      primary_trading_business_unit: data?.primary_trading_business_unit || "",
      email: data?.email || "",
      business_name: data?.business_name || "",
      trading_name: data?.trading_name || "",
      vendor_type: data?.vendor_type || "",
      contact_person: data?.contact_person || "",
      contact_phone: data?.contact_phone || "",
      website_url: data?.website_url || "",
      postal_address: data?.postal_address || "",
      city: data?.city || "",
      state: data?.state || "",
      postcode: data?.postcode || "",
      is_gst_registered: Boolean(data?.is_gst_registered),
      abn: data?.abn || "",
      gst: data?.gst || "",
    }),
    [data]
  );

  // Convert tradingEntities data for display
  const tradingEntitiesData = useMemo(() => {
    return tradingEntities || [];
  }, []);

  // Create handler functions with proper memoization to prevent rerenders
  const handleFieldChange = useMemo(() => {
    return (field: string) => (name: string, value: any) => {
      onChange(field, value);
    };
  }, [onChange]);

  const handleFieldBlur = useMemo(() => {
    return (field: string) => () => {
      onBlur(field);
    };
  }, [onBlur]);

  // Always render a complete, consistent component structure
  return (
    <SectionContainer>
      <FormLegend>Vendor Account Set Up Form</FormLegend>
      <SectionTitle>1. General Details</SectionTitle>

      {/* Trading Entities Section */}
      <FormField
        label="Select Trading Entity(ies)"
        htmlFor="tradingEntities"
        required
        error={errors.tradingEntities}
        touched={touched["generalDetails.tradingEntities"]}
      >
        <CheckboxContainer>
          {tradingEntitiesData.map((entity) => (
            <CheckboxColumn key={entity.id}>
              <Checkbox
                id={entity.id}
                name="tradingEntities"
                value={entity.id}
                checked={safeData.tradingEntities.includes(entity.id)}
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
        htmlFor="vendor_home_country"
        required
        error={errors.vendor_home_country}
        touched={touched["generalDetails.vendor_home_country"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="vendor_home_country"
          value={safeData.vendor_home_country}
          onChange={handleFieldChange("vendor_home_country")}
          onBlur={handleFieldBlur("vendor_home_country")}
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
        htmlFor="primary_trading_business_unit"
        required
        error={errors.primary_trading_business_unit}
        touched={touched["generalDetails.primary_trading_business_unit"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="primary_trading_business_unit"
          value={safeData.primary_trading_business_unit}
          onChange={handleFieldChange("primary_trading_business_unit")}
          onBlur={handleFieldBlur("primary_trading_business_unit")}
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
          type="email"
          name="email"
          value={safeData.email}
          onChange={handleFieldChange("email")}
          onBlur={handleFieldBlur("email")}
          placeholder="example@domain.com"
        />
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
        htmlFor="business_name"
        required
        error={errors.business_name}
        touched={touched["generalDetails.business_name"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="text"
          name="business_name"
          value={safeData.business_name}
          onChange={handleFieldChange("business_name")}
          onBlur={handleFieldBlur("business_name")}
          placeholder="Business name"
        />
      </FormField>

      {/* Trading Name (Optional) */}
      <FormField
        label="Trading Name (if different from Business Name)"
        htmlFor="trading_name"
        error={errors.trading_name}
        touched={touched["generalDetails.trading_name"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="text"
          name="trading_name"
          value={safeData.trading_name}
          onChange={handleFieldChange("trading_name")}
          onBlur={handleFieldBlur("trading_name")}
          placeholder="Trading name"
        />
      </FormField>

      {/* Vendor Type */}
      <FormField
        label="Vendor Type"
        htmlFor="vendor_type"
        required
        error={errors.vendor_type}
        touched={touched["generalDetails.vendor_type"]}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="vendor_type"
          value={safeData.vendor_type}
          onChange={handleFieldChange("vendor_type")}
          onBlur={handleFieldBlur("vendor_type")}
          options={vendorTypeOptions.map((type) => ({
            value: type.value,
            label: type.label,
          }))}
          placeholder="Select vendor type"
        />
      </FormField>
    </SectionContainer>
  );
}

// Apply React.memo correctly
export const GeneralDetailsSection = React.memo(GeneralDetailsSectionBase);

// Add a display name for easier debugging
GeneralDetailsSection.displayName = "GeneralDetailsSection";

// Always provide a default export
export default GeneralDetailsSection;
