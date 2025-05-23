import React from "react";
import { styled } from "@mui/material/styles";
import { VendorData, VendorType, yesNoOptions } from "../../models/VendorTypes";
import { FormField } from "../ui/FormField";
import { TextInput } from "../ui/TextInput";
import { Dropdown } from "../ui/Dropdown";
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
  const showBackOrder =
    !vendorType || vendorType === "STOCK" || vendorType === "OVERHEADANDSTOCK";

  // Handle file change for PDF upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (onFileChange) {
      onFileChange("quotesPdf", file);
    }
  };

  return (
    <SectionContainer>
      <SectionTitle>2. Trading Terms</SectionTitle>

      {/* Quotes Obtained - only for OVERHEADS or OVERHEADANDSTOCK */}
      {showQuotesSection && (
        <FormField
          label="Have 2 quotes been obtained?"
          htmlFor="quotesObtained"
          required
          error={errors.quotesObtained}
          touched={touched["tradingTerms.quotesObtained"]}
          disabled={!isEditable}
        >
          <Dropdown
            id="quotesObtained"
            name="quotesObtained"
            value={data.quotesObtained}
            onChange={(e) => onChange("quotesObtained", e.target.value)}
            onBlur={() => onBlur("quotesObtained")}
            options={yesNoOptions}
            required={showQuotesSection}
            error={
              !!errors.quotesObtained && touched["tradingTerms.quotesObtained"]
            }
            disabled={!isEditable}
          />
        </FormField>
      )}

      {/* PDF upload for quotes - only if quotesObtained is 'yes' */}
      {showQuotesSection && data.quotesObtained === "yes" && (
        <FormField
          label="Upload quotes (PDF)"
          htmlFor="quotesPdf"
          required
          error={errors.quotesPdf}
          touched={touched["tradingTerms.quotesPdf"]}
          disabled={!isEditable}
        >
          <div className="flex items-center">
            <Input
              id="quotesPdf"
              name="quotesPdf"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="max-w-sm"
              required
            />
            {data.quotesPdf && (
              <span className="ml-2 text-sm text-green-600">
                {typeof data.quotesPdf === "object"
                  ? data.quotesPdf.name
                  : "File uploaded"}
              </span>
            )}
          </div>
        </FormField>
      )}

      {/* Reason for no quotes - only if quotesObtained is 'no' */}
      {showQuotesSection && data.quotesObtained === "no" && (
        <FormField
          label="If no, please provide a reason"
          htmlFor="quotesObtainedReason"
          required
          error={errors.quotesObtainedReason}
          touched={touched["tradingTerms.quotesObtainedReason"]}
          disabled={!isEditable}
        >
          <TextInput
            id="quotesObtainedReason"
            name="quotesObtainedReason"
            value={data.quotesObtainedReason || ""}
            onChange={(e) => onChange("quotesObtainedReason", e.target.value)}
            onBlur={() => onBlur("quotesObtainedReason")}
            required={data.quotesObtained === "no"}
            error={
              !!errors.quotesObtainedReason &&
              touched["tradingTerms.quotesObtainedReason"]
            }
            disabled={!isEditable}
          />
        </FormField>
      )}

      {/* Back Order - only for STOCK or OVERHEADANDSTOCK */}
      {showBackOrder && (
        <FormField
          label="Allow Back Order"
          htmlFor="backOrder"
          required={false}
          error={errors.backOrder}
          touched={touched["tradingTerms.backOrder"]}
          disabled={!isEditable}
        >
          <Dropdown
            id="backOrder"
            name="backOrder"
            value={data.backOrder || ""}
            onChange={(e) => onChange("backOrder", e.target.value)}
            onBlur={() => onBlur("backOrder")}
            options={yesNoOptions}
            error={!!errors.backOrder && touched["tradingTerms.backOrder"]}
            disabled={!isEditable}
          />
        </FormField>
      )}
    </SectionContainer>
  );
};
