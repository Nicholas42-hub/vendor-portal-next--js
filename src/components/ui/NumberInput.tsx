import React from "react";
import { styled } from "@mui/material/styles";

interface NumberInputProps {
  id: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  title?: string;
}

const StyledInput = styled("input")<{ error?: boolean }>(
  ({ theme, error }) => ({
    display: "block",
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    border: `1px solid ${error ? "#ff0000" : "#ccc"}`,
    borderRadius: "4px",
    boxSizing: "border-box",
    "&:focus": {
      borderColor: error ? "#ff0000" : "#4CAF50",
      outlineColor: error ? "#ff0000" : "#4CAF50",
      boxShadow: error
        ? "0 0 5px rgba(255, 0, 0, 0.2)"
        : "0 0 5px rgba(76, 175, 80, 0.2)",
    },
    "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
      WebkitAppearance: "none",
      margin: 0,
    },
    "&[type=number]": {
      MozAppearance: "textfield", // Firefox
    },
  })
);

export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "",
  min,
  max,
  step = 1,
  disabled = false,
  required = false,
  error = false,
  title,
}) => {
  return (
    <StyledInput
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      type="number"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      required={required}
      error={error}
      title={title}
      className={error ? "error" : ""}
    />
  );
};
