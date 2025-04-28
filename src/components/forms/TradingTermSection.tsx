import React from "react";
import { styled } from "@mui/material/styles";
import { VendorData, VendorType, yesNoOptions } from "../../models/VendorTypes";
import { FormField } from "../ui/FormField";
import { ConditionalInput } from "../ui/ConditionalInput";
import { Input } from "../ui/input";

// Define Props
interface TradingTermsSectionProps {
  data: VendorData["tradingTerms"];
  vendorType: VendorType;
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  onFileChange?: (field: string, file: File | null) => void;
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

// Component
export const TradingTermsSection: React.FC<TradingTermsSectionProps> = ({
  data,
  vendorType,
  errors,
  touched,
  onChange,
  onBlur,
  onFileChange,
  isEditable = true,
  validateField,
}) => {
  // Show quotes section only for OVERHEADS or OVERHEADANDSTOCK
  const showQuotesSection =
    vendorType === "OVERHEADS" || vendorType === "OVERHEADANDSTOCK";

  // Show back order only for STOCK or OVERHEADANDSTOCK
  const show_back_order =
    !vendorType || vendorType === "STOCK" || vendorType === "OVERHEADANDSTOCK";

  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    onChange(field, value);
  };

  // Handle field blur
  const handleFieldBlur = (e: React.FocusEvent<any>) => {
    const fieldName = e.target.name;
    onBlur(fieldName);
  };

  // Handle file change for PDF upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (onFileChange) {
      onFileChange("quotes_pdf_url", file);
    }
  };

  return (
    <SectionContainer>
      <SectionTitle>2. Trading Terms</SectionTitle>

      {/* Quotes Obtained - only for OVERHEADS or OVERHEADANDSTOCK */}
      {showQuotesSection && (
        <FormField
          label="Have 2 quotes been obtained?"
          htmlFor="quotes_obtained"
          required
          error={errors.quotes_obtained}
          touched={touched["tradingTerms.quotes_obtained"]}
          disabled={!isEditable}
        >
          <ConditionalInput
            isEditable={isEditable}
            type="select"
            name="quotes_obtained"
            value={data.quotes_obtained}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            options={yesNoOptions}
            disabled={!isEditable}
            required={showQuotesSection}
            placeholder="Select yes/no"
            className="w-full"
          />
        </FormField>
      )}

      {/* PDF upload for quotes - only if quotes_obtained is 'yes' */}
      {showQuotesSection && data.quotes_obtained === "yes" && (
        <FormField
          label="Upload quotes (PDF)"
          htmlFor="quotes_pdf_url"
          required
          error={errors.quotes_pdf_url}
          touched={touched["tradingTerms.quotes_pdf_url"]}
          disabled={!isEditable}
        >
          <div className="flex items-center">
            <Input
              id="quotes_pdf_url"
              name="quotes_pdf_url"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="max-w-sm w-full"
              required
            />
            {data.quotes_pdf_url && (
              <span className="ml-2 text-sm text-green-600">
                {typeof data.quotes_pdf_url === "object"
                  ? data.quotes_pdf_url.name
                  : "File uploaded"}
              </span>
            )}
          </div>
        </FormField>
      )}

      {/* Reason for no quotes - only if quotes_obtained is 'no' */}
      {showQuotesSection && data.quotes_obtained === "no" && (
        <FormField
          label="If no, please provide a reason"
          htmlFor="quotes_obtained_reason"
          required
          error={errors.quotes_obtained_reason}
          touched={touched["tradingTerms.quotes_obtained_reason"]}
          disabled={!isEditable}
        >
          <ConditionalInput
            isEditable={isEditable}
            type="text"
            name="quotes_obtained_reason"
            value={data.quotes_obtained_reason || ""}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            disabled={!isEditable}
            required={data.quotes_obtained === "no"}
            placeholder="Enter reason"
            className="w-full"
          />
        </FormField>
      )}

      {/* Back Order - only for STOCK or OVERHEADANDSTOCK */}
      {show_back_order && (
        <FormField
          label="Allow Back Order"
          htmlFor="back_order"
          required={false}
          error={errors.back_order}
          touched={touched["tradingTerms.back_order"]}
          disabled={!isEditable}
        >
          <ConditionalInput
            isEditable={isEditable}
            type="select"
            name="back_order"
            value={data.back_order || ""}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            options={yesNoOptions}
            disabled={!isEditable}
            placeholder="Select yes/no"
            className="w-full"
          />
        </FormField>
      )}
    </SectionContainer>
  );
};

export default TradingTermsSection;
