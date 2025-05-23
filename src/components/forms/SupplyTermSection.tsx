import React from "react";
import { styled } from "@mui/material/styles";
import { VendorData, yesNoOptions } from "../../models/VendorTypes";
import { FormField } from "../ui/FormField";
import { TextInput } from "../ui/TextInput";
import { Dropdown } from "../ui/Dropdown";

// Define Props
interface SupplyTermsSectionProps {
  data: VendorData["supplyTerms"];
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
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

// Component
export const SupplyTermsSection: React.FC<SupplyTermsSectionProps> = ({
  data,
  errors,
  touched,
  onChange,
  onBlur,
  isEditable = true,
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
        disabled={!isEditable}
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
          disabled={!isEditable}
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
        disabled={!isEditable}
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
          disabled={!isEditable}
        />
      </FormField>

      {/* Auth Required for Returns */}
      <FormField
        label="Auth. No Required for Returns"
        htmlFor="authRequired"
        required
        error={errors.authRequired}
        touched={touched["supplyTerms.authRequired"]}
        disabled={!isEditable}
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
          disabled={!isEditable}
        />
      </FormField>

      {/* Lead time in working days */}
      <FormField
        label="Lead time in working days"
        htmlFor="deliveryNotice"
        required
        error={errors.deliveryNotice}
        touched={touched["supplyTerms.deliveryNotice"]}
        disabled={!isEditable}
      >
        <TextInput
          id="deliveryNotice"
          name="deliveryNotice"
          value={data.delivery_notice ? data.delivery_notice.toString() : ""}
          onChange={(e) => handleNumberChange("deliveryNotice", e.target.value)}
          onBlur={() => onBlur("deliveryNotice")}
          placeholder="working days"
          type="number"
          required
          error={
            !!errors.deliveryNotice && touched["supplyTerms.deliveryNotice"]
          }
          disabled={!isEditable}
        />
      </FormField>

      {/* Minimum Order Value */}
      <FormField
        label="Minimum Order Value"
        htmlFor="minOrderValue"
        required
        error={errors.minOrderValue}
        touched={touched["supplyTerms.minOrderValue"]}
        disabled={!isEditable}
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
          disabled={!isEditable}
        />
      </FormField>

      {/* Minimum Order Quantity */}
      <FormField
        label="Minimum Order Quantity"
        htmlFor="minOrderQuantity"
        required
        error={errors.minOrderQuantity}
        touched={touched["supplyTerms.minOrderQuantity"]}
        disabled={!isEditable}
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
          disabled={!isEditable}
        />
      </FormField>

      {/* Maximum Order Value */}
      <FormField
        label="Maximum Order Value"
        htmlFor="maxOrderValue"
        required
        error={errors.maxOrderValue}
        touched={touched["supplyTerms.maxOrderValue"]}
        disabled={!isEditable}
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
          disabled={!isEditable}
        />
      </FormField>

      {/* Other Comments */}
      <FormField
        label="Other Comments"
        htmlFor="otherComments"
        required={false}
        error={errors.otherComments}
        touched={touched["supplyTerms.otherComments"]}
        disabled={!isEditable}
      >
        <TextArea
          id="otherComments"
          name="otherComments"
          value={data.otherComments || ""}
          onChange={(e) => onChange("otherComments", e.target.value)}
          onBlur={() => onBlur("otherComments")}
          className="other_comments"
          disabled={!isEditable}
        />
      </FormField>
    </SectionContainer>
  );
};
export default SupplyTermsSection;
