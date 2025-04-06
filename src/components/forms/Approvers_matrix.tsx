import React from 'react'
import { FormField } from "../ui/FormField";
import { styled } from "@mui/material/styles";
const SectionContainer = styled("div")({
    background: "#f7f7f7",
    padding: "20px",
    margin: "10px 0",
    borderRadius: "8px",
    boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)",
    width: "100%",
  });

const FormLegend = styled("legend")({
    fontFamily:
      '-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    fontSize: "24px",
    fontWeight: 800,
    color: "rgb(31, 31, 35)",
    marginBottom: "20px",
  });

// Define Props
interface Props {
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onBlur: (field: string) => void;
}

const Approvers_matrix = () => {
  return (
    <SectionContainer>
    <FormLegend>Approvers Matrix</FormLegend>
      <FormField
        label="Manager Approvers"
        htmlFor="Manager Approvers"
        required
      >
        <Dropdown
          id="Manager Approvers"
          name="Manager Approvers"
          value=
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
      </SectionContainer>
  )
}

export default Approvers_matrix