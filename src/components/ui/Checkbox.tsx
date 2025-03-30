import React from "react";
import { styled } from "@mui/material/styles";

interface CheckboxProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  disabled?: boolean;
  required?: boolean;
}

const CheckboxContainer = styled("div")({
  display: "flex",
  alignItems: "center",
  marginBottom: "8px",
});

const StyledInput = styled("input")({
  marginRight: "8px",
  transform: "translateY(-2px)",
});

const StyledLabel = styled("label")({
  display: "flex",
  alignItems: "center",
  fontFamily:
    '-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: "12px",
});

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  disabled = false,
  required = false,
}) => {
  return (
    <CheckboxContainer className="grid-entity">
      <StyledInput
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
      <StyledLabel htmlFor={id}>{label}</StyledLabel>
    </CheckboxContainer>
  );
};
