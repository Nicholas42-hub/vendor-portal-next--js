import React from "react";
import { styled } from "@mui/material/styles";
import {
  VendorData,
  TradingEntity,
  BusinessUnit,
  VendorType,
  YesNo,
} from "../../models/VendorTypes";
import { FormField } from "../ui/FormField";
import { TextInput } from "../ui/TextInput";
import { Dropdown } from "../ui/Dropdown";
import { Checkbox } from "../ui/Checkbox";

// Define Props
interface GeneralDetailsSectionProps {
  data: VendorData["generalDetails"];
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onBlur: (field: string) => void;
  parentVendors?: Array<{ id: string; name: string; email: string }>;
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

// Trading entities data
const tradingEntities: Array<{ id: TradingEntity; label: string }> = [
  { id: "ALAW", label: "The Trustee for Lagardere / AWPL Trust (ALAW)" },
  {
    id: "AUDF",
    label: "Duty Free Stores Australia Pty Ltd (AUDF) (CNS T1 stores only)",
  },
  { id: "AUTE", label: "Newslink Pty Ltd (AUTE) (CNS T1 stores only)" },
  { id: "NZAW", label: "AWPL Retail Solutions Ltd (NZAW)" },
  { id: "AUPG", label: "The Purely Group Pty Ltd (AUPG)" },
  { id: "AUAW", label: "The Trustee for AWPL Tango Trust (AUAW)" },
  { id: "NZDF", label: "Duty Free Stores Wellington Ltd (NZDF)" },
  { id: "NZTE", label: "LS Travel Retail New Zealand Ltd (NZTE)" },
  { id: "LSAP", label: "Lagardere Services Asia Pacific Pty Ltd (LSAP)" },
];

// Business unit options
const businessUnitOptions = [
  { value: "", label: "Select an option", disabled: true },
  { value: "Travel Essentials", label: "Travel Essentials" },
  { value: "Food Services", label: "Food Services" },
  { value: "Specialty", label: "Specialty" },
  { value: "Duty Free", label: "Duty Free" },
  { value: "Finance", label: "Finance" },
  { value: "IT", label: "IT" },
];

// Vendor type options
const vendorTypeOptions = [
  { value: "", label: "Select an option", disabled: true },
  { value: "STOCK", label: "Stock" },
  { value: "OVERHEADS", label: "Overheads" },
  { value: "OVERHEADANDSTOCK", label: "Overhead and Stock" },
];

// Yes/No options
const yesNoOptions = [
  { value: "", label: "Select an option", disabled: true },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// Component
export const GeneralDetailsSection: React.FC<GeneralDetailsSectionProps> = ({
  data,
  errors,
  touched,
  onChange,
  onCheckboxChange,
  onBlur,
  parentVendors = [],
}) => {
  // Handle parent vendor options
  const parentVendorOptions = [
    { value: "", label: "Select a parent vendor", disabled: true },
    ...parentVendors.map((vendor) => ({
      value: vendor.email,
      label: `${vendor.name} (${vendor.email})`,
    })),
  ];

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
            { value: "Afghanistan", label: "Afghanistan" },
            { value: "Albania", label: "Albania" },
            { value: "Algeria", label: "Algeria" },
            { value: "Andorra", label: "Andorra" },
            { value: "Angola", label: "Angola" },
            { value: "Antigua and Barbuda", label: "Antigua and Barbuda" },
            { value: "Argentina", label: "Argentina" },
            { value: "Armenia", label: "Armenia" },
            { value: "Australia", label: "Australia" },
            { value: "Austria", label: "Austria" },
            { value: "Azerbaijan", label: "Azerbaijan" },
            { value: "Bahamas", label: "Bahamas" },
            { value: "Bahrain", label: "Bahrain" },
            { value: "Bangladesh", label: "Bangladesh" },
            { value: "Barbados", label: "Barbados" },
            { value: "Belarus", label: "Belarus" },
            { value: "Belgium", label: "Belgium" },
            { value: "Belize", label: "Belize" },
            { value: "Benin", label: "Benin" },
            { value: "Bhutan", label: "Bhutan" },
            { value: "Bolivia", label: "Bolivia" },
            {
              value: "Bosnia and Herzegovina",
              label: "Bosnia and Herzegovina",
            },
            { value: "Botswana", label: "Botswana" },
            { value: "Brazil", label: "Brazil" },
            { value: "Brunei", label: "Brunei" },
            { value: "Bulgaria", label: "Bulgaria" },
            { value: "Burkina Faso", label: "Burkina Faso" },
            { value: "Burundi", label: "Burundi" },
            { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
            { value: "Cabo Verde", label: "Cabo Verde" },
            { value: "Cambodia", label: "Cambodia" },
            { value: "Cameroon", label: "Cameroon" },
            { value: "Canada", label: "Canada" },
            {
              value: "Central African Republic",
              label: "Central African Republic",
            },
            { value: "Chad", label: "Chad" },
            { value: "Chile", label: "Chile" },
            { value: "China", label: "China" },
            { value: "Colombia", label: "Colombia" },
            { value: "Comoros", label: "Comoros" },
            {
              value: "Congo, Democratic Republic of the",
              label: "Congo, Democratic Republic of the",
            },
            {
              value: "Congo, Republic of the",
              label: "Congo, Republic of the",
            },
            { value: "Costa Rica", label: "Costa Rica" },
            { value: "Croatia", label: "Croatia" },
            { value: "Cuba", label: "Cuba" },
            { value: "Cyprus", label: "Cyprus" },
            { value: "Czech Republic", label: "Czech Republic" },
            { value: "Denmark", label: "Denmark" },
            { value: "Djibouti", label: "Djibouti" },
            { value: "Dominica", label: "Dominica" },
            { value: "Dominican Republic", label: "Dominican Republic" },
            { value: "Ecuador", label: "Ecuador" },
            { value: "Egypt", label: "Egypt" },
            { value: "El Salvador", label: "El Salvador" },
            { value: "Equatorial Guinea", label: "Equatorial Guinea" },
            { value: "Eritrea", label: "Eritrea" },
            { value: "Estonia", label: "Estonia" },
            { value: "Eswatini", label: "Eswatini" },
            { value: "Ethiopia", label: "Ethiopia" },
            { value: "Fiji", label: "Fiji" },
            { value: "Finland", label: "Finland" },
            { value: "France", label: "France" },
            { value: "Gabon", label: "Gabon" },
            { value: "Gambia", label: "Gambia" },
            { value: "Georgia", label: "Georgia" },
            { value: "Germany", label: "Germany" },
            { value: "Ghana", label: "Ghana" },
            { value: "Greece", label: "Greece" },
            { value: "Grenada", label: "Grenada" },
            { value: "Guatemala", label: "Guatemala" },
            { value: "Guinea", label: "Guinea" },
            { value: "Guinea-Bissau", label: "Guinea-Bissau" },
            { value: "Guyana", label: "Guyana" },
            { value: "Haiti", label: "Haiti" },
            { value: "Honduras", label: "Honduras" },
            { value: "Hungary", label: "Hungary" },
            { value: "Iceland", label: "Iceland" },
            { value: "India", label: "India" },
            { value: "Indonesia", label: "Indonesia" },
            { value: "Iran", label: "Iran" },
            { value: "Iraq", label: "Iraq" },
            { value: "Ireland", label: "Ireland" },
            { value: "Israel", label: "Israel" },
            { value: "Italy", label: "Italy" },
            { value: "Jamaica", label: "Jamaica" },
            { value: "Japan", label: "Japan" },
            { value: "Jordan", label: "Jordan" },
            { value: "Kazakhstan", label: "Kazakhstan" },
            { value: "Kenya", label: "Kenya" },
            { value: "Kiribati", label: "Kiribati" },
            { value: "Kosovo", label: "Kosovo" },
            { value: "Kuwait", label: "Kuwait" },
            { value: "Kyrgyzstan", label: "Kyrgyzstan" },
            { value: "Laos", label: "Laos" },
            { value: "Latvia", label: "Latvia" },
            { value: "Lebanon", label: "Lebanon" },
            { value: "Lesotho", label: "Lesotho" },
            { value: "Liberia", label: "Liberia" },
            { value: "Libya", label: "Libya" },
            { value: "Liechtenstein", label: "Liechtenstein" },
            { value: "Lithuania", label: "Lithuania" },
            { value: "Luxembourg", label: "Luxembourg" },
            { value: "North Macedonia", label: "North Macedonia" },
            { value: "Madagascar", label: "Madagascar" },
            { value: "Malawi", label: "Malawi" },
            { value: "Malaysia", label: "Malaysia" },
            { value: "Maldives", label: "Maldives" },
            { value: "Mali", label: "Mali" },
            { value: "Malta", label: "Malta" },
            { value: "Marshall Islands", label: "Marshall Islands" },
            { value: "Mauritania", label: "Mauritania" },
            { value: "Mauritius", label: "Mauritius" },
            { value: "Mexico", label: "Mexico" },
            { value: "Micronesia", label: "Micronesia" },
            { value: "Moldova", label: "Moldova" },
            { value: "Monaco", label: "Monaco" },
            { value: "Mongolia", label: "Mongolia" },
            { value: "Montenegro", label: "Montenegro" },
            { value: "Morocco", label: "Morocco" },
            { value: "Mozambique", label: "Mozambique" },
            { value: "Myanmar", label: "Myanmar" },
            { value: "Namibia", label: "Namibia" },
            { value: "Nauru", label: "Nauru" },
            { value: "Nepal", label: "Nepal" },
            { value: "Netherlands", label: "Netherlands" },
            { value: "New Zealand", label: "New Zealand" },
            { value: "Nicaragua", label: "Nicaragua" },
            { value: "Niger", label: "Niger" },
            { value: "Nigeria", label: "Nigeria" },
            { value: "North Korea", label: "North Korea" },
            { value: "Norway", label: "Norway" },
            { value: "Oman", label: "Oman" },
            { value: "Pakistan", label: "Pakistan" },
            { value: "Palau", label: "Palau" },
            { value: "Panama", label: "Panama" },
            { value: "Papua New Guinea", label: "Papua New Guinea" },
            { value: "Paraguay", label: "Paraguay" },
            { value: "Peru", label: "Peru" },
            { value: "Philippines", label: "Philippines" },
            { value: "Poland", label: "Poland" },
            { value: "Portugal", label: "Portugal" },
            { value: "Qatar", label: "Qatar" },
            { value: "Romania", label: "Romania" },
            { value: "Russia", label: "Russia" },
            { value: "Rwanda", label: "Rwanda" },
            { value: "St Kitts and Nevis", label: "St Kitts and Nevis" },
            { value: "St Lucia", label: "St Lucia" },
            {
              value: "St Vincent and the Grenadines",
              label: "St Vincent and the Grenadines",
            },
            { value: "Samoa", label: "Samoa" },
            { value: "San Marino", label: "San Marino" },
            { value: "Sao Tome and Principe", label: "Sao Tome and Principe" },
            { value: "Saudi Arabia", label: "Saudi Arabia" },
            { value: "Senegal", label: "Senegal" },
            { value: "Serbia", label: "Serbia" },
            { value: "Seychelles", label: "Seychelles" },
            { value: "Sierra Leone", label: "Sierra Leone" },
            { value: "Singapore", label: "Singapore" },
            { value: "Slovakia", label: "Slovakia" },
            { value: "Slovenia", label: "Slovenia" },
            { value: "Solomon Islands", label: "Solomon Islands" },
            { value: "Somalia", label: "Somalia" },
            { value: "South Africa", label: "South Africa" },
            { value: "South Korea", label: "South Korea" },
            { value: "South Sudan", label: "South Sudan" },
            { value: "Spain", label: "Spain" },
            { value: "Sri Lanka", label: "Sri Lanka" },
            { value: "Sudan", label: "Sudan" },
            { value: "Suriname", label: "Suriname" },
            { value: "Sweden", label: "Sweden" },
            { value: "Switzerland", label: "Switzerland" },
            { value: "Syria", label: "Syria" },
            { value: "Taiwan", label: "Taiwan" },
            { value: "Tajikistan", label: "Tajikistan" },
            { value: "Tanzania", label: "Tanzania" },
            { value: "Thailand", label: "Thailand" },
            { value: "Timor-Leste", label: "Timor-Leste" },
            { value: "Togo", label: "Togo" },
            { value: "Tonga", label: "Tonga" },
            { value: "Trinidad and Tobago", label: "Trinidad and Tobago" },
            { value: "Tunisia", label: "Tunisia" },
            { value: "Turkey", label: "Turkey" },
            { value: "Turkmenistan", label: "Turkmenistan" },
            { value: "Tuvalu", label: "Tuvalu" },
            { value: "Uganda", label: "Uganda" },
            { value: "Ukraine", label: "Ukraine" },
            { value: "United Arab Emirates", label: "United Arab Emirates" },
            { value: "United Kingdom", label: "United Kingdom" },
            {
              value: "United States of America",
              label: "United States of America",
            },
            { value: "Uruguay", label: "Uruguay" },
            { value: "Uzbekistan", label: "Uzbekistan" },
            { value: "Vanuatu", label: "Vanuatu" },
            { value: "Vatican City", label: "Vatican City" },
            { value: "Venezuela", label: "Venezuela" },
            { value: "Vietnam", label: "Vietnam" },
            { value: "Yemen", label: "Yemen" },
            { value: "Zambia", label: "Zambia" },
            { value: "Zimbabwe", label: "Zimbabwe" },
          ]}
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
          onBlur={() => onBlur("email")}
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
