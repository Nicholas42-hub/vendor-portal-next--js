import React from "react";
import { styled } from "@mui/material/styles";

interface CheckboxProps {
  id: string;
  name?: string;
  value?: string;
  checked: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
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
  onCheckedChange,
  label,
  className,
  disabled = false,
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (onCheckedChange) onCheckedChange(e.target.checked);
  };

  return (
    <CheckboxContainer className={`grid-entity ${className || ""}`}>
      <StyledInput
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        required={required}
      />
      {label && <StyledLabel htmlFor={id}>{label}</StyledLabel>}
    </CheckboxContainer>
  );
};
