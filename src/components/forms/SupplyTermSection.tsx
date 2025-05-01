import React from "react";
import { styled } from "@mui/material/styles";
import { VendorData, yesNoOptions } from "../../models/VendorTypes";
import { FormField } from "../ui/FormField";
import { ConditionalInput } from "../ui/ConditionalInput";

// Define Props
interface SupplyTermsSectionProps {
  data: VendorData["supplyTerms"];
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  validateField?: (field: string) => void;
  isEditable?: boolean;
}

// Styled Container
const SectionContainer = styled("div")({
  background: "#ffffff",
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

// Component
export const SupplyTermsSection: React.FC<SupplyTermsSectionProps> = ({
  data,
  errors,
  touched,
  onChange,
  onBlur,
  isEditable = true,
}) => {
  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    onChange(field, value);
  };

  // Handle field blur
  const handleFieldBlur = (e: React.FocusEvent<any>) => {
    const fieldName = e.target.name;
    onBlur(fieldName);
  };

  return (
    <SectionContainer>
      <SectionTitle>3. Supply Terms</SectionTitle>

      {/* Exclusive Supply */}
      <FormField
        label="Exclusive supply to LagardereAwpl"
        htmlFor="exclusive_supply"
        required
        error={errors.exclusive_supply}
        touched={touched["supplyTerms.exclusive_supply"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="exclusive_supply"
          value={data.exclusive_supply}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          options={yesNoOptions}
          disabled={!isEditable}
          placeholder="Select option"
          required
          className="w-full"
        />
        <Note>Product not supplied to other Airport retailers</Note>
      </FormField>

      {/* Sale or Return */}
      <FormField
        label="Sale or return"
        htmlFor="sale_or_return"
        required
        error={errors.sale_or_return}
        touched={touched["supplyTerms.sale_or_return"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="sale_or_return"
          value={data.sale_or_return}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          options={yesNoOptions}
          disabled={!isEditable}
          placeholder="Select option"
          required
          className="w-full"
        />
      </FormField>

      {/* Auth Required for Returns */}
      <FormField
        label="Auth. No Required for Returns"
        htmlFor="auth_required"
        required
        error={errors.auth_required}
        touched={touched["supplyTerms.auth_required"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="auth_required"
          value={data.auth_required}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          options={yesNoOptions}
          disabled={!isEditable}
          placeholder="Select option"
          required
          className="w-full"
        />
      </FormField>

      {/* Lead time in working days */}
      <FormField
        label="Lead time in working days"
        htmlFor="delivery_notice"
        required
        error={errors.delivery_notice}
        touched={touched["supplyTerms.delivery_notice"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="number"
          name="delivery_notice"
          value={data.delivery_notice}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          placeholder="working days"
          disabled={!isEditable}
          required
          className="w-full"
        />
      </FormField>

      {/* Minimum Order Value */}
      <FormField
        label="Minimum Order Value"
        htmlFor="min_order_value"
        required
        error={errors.min_order_value}
        touched={touched["supplyTerms.min_order_value"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="number"
          name="min_order_value"
          value={data.min_order_value}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          disabled={!isEditable}
          required
          className="w-full"
        />
      </FormField>

      {/* Minimum Order Quantity */}
      <FormField
        label="Minimum Order Quantity"
        htmlFor="min_order_quantity"
        required
        error={errors.min_order_quantity}
        touched={touched["supplyTerms.min_order_quantity"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="number"
          name="min_order_quantity"
          value={data.min_order_quantity}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          disabled={!isEditable}
          required
          className="w-full"
        />
      </FormField>

      {/* Maximum Order Value */}
      <FormField
        label="Maximum Order Value"
        htmlFor="max_order_value"
        required
        error={errors.max_order_value}
        touched={touched["supplyTerms.max_order_value"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="number"
          name="max_order_value"
          value={data.max_order_value}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          disabled={!isEditable}
          required
          className="w-full"
        />
      </FormField>

      {/* Other Comments */}
      <FormField
        label="Other Comments"
        htmlFor="other_comments"
        required={false}
        error={errors.other_comments}
        touched={touched["supplyTerms.other_comments"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="textarea"
          name="other_comments"
          value={data.other_comments || ""}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          disabled={!isEditable}
          className="w-full"
        />
      </FormField>
    </SectionContainer>
  );
};

export default SupplyTermsSection;
