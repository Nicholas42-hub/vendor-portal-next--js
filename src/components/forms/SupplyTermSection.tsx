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
        htmlFor="exclusiveSupply"
        required
        error={errors.exclusiveSupply}
        touched={touched["supplyTerms.exclusiveSupply"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="exclusiveSupply"
          value={data.exclusiveSupply}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          options={yesNoOptions}
          disabled={!isEditable}
          required
          className="w-full"
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
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="saleOrReturn"
          value={data.saleOrReturn}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          options={yesNoOptions}
          disabled={!isEditable}
          required
          className="w-full"
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
        <ConditionalInput
          isEditable={isEditable}
          type="select"
          name="authRequired"
          value={data.authRequired}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
          options={yesNoOptions}
          disabled={!isEditable}
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
        htmlFor="minOrderValue"
        required
        error={errors.minOrderValue}
        touched={touched["supplyTerms.minOrderValue"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="number"
          name="minOrderValue"
          value={data.minOrderValue}
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
        htmlFor="minOrderQuantity"
        required
        error={errors.minOrderQuantity}
        touched={touched["supplyTerms.minOrderQuantity"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="number"
          name="minOrderQuantity"
          value={data.minOrderQuantity}
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
        htmlFor="maxOrderValue"
        required
        error={errors.maxOrderValue}
        touched={touched["supplyTerms.maxOrderValue"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="number"
          name="maxOrderValue"
          value={data.maxOrderValue}
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
        htmlFor="otherComments"
        required={false}
        error={errors.otherComments}
        touched={touched["supplyTerms.otherComments"]}
        disabled={!isEditable}
      >
        <ConditionalInput
          isEditable={isEditable}
          type="textarea"
          name="otherComments"
          value={data.otherComments || ""}
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
