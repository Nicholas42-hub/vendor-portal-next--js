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
  SupplierFormData,
} from "../../models/VendorTypes";
import { FormField } from "../ui/FormField";
import { TextInput } from "../ui/TextInput";
import { Dropdown } from "../ui/Dropdown";
import { Checkbox } from "../ui/Checkbox";
import { countries } from "@/lib/countries";

// Define Props
interface SupplierFormProps {
  data: SupplierFormData;
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  isChecking?: { [key: string]: boolean }; // Add isChecking prop
  onChange: (field: string, value: any) => void;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onBlur: (field: string) => void;
  validateField: (field: string) => void;
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
export const SupplierForm: React.FC<SupplierFormProps> = ({
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
      <FormLegend>Supplier Onboarding Form</FormLegend>

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
          value={data.business_name}
          onChange={(e) => onChange("businessName", e.target.value)}
          onBlur={() => onBlur("businessName")}
          required
          error={
            !!errors.businessName && touched["generalDetails.businessName"]
          }
        />
      </FormField>
    </SectionContainer>
  );
};

export default SupplierForm;
