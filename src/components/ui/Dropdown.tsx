import React from "react";
import { styled } from "@mui/material/styles";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  options: Option[];
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  title?: string;
}

const StyledSelect = styled("select")<{ error?: boolean }>(
  ({ theme, error }) => ({
    display: "block",
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    border: `1px solid ${error ? "#ff0000" : "#ccc"}`,
    borderRadius: "4px",
    boxSizing: "border-box",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "16px",
    "&:focus": {
      borderColor: error ? "#ff0000" : "#4CAF50",
      outlineColor: error ? "#ff0000" : "#4CAF50",
      boxShadow: error
        ? "0 0 5px rgba(255, 0, 0, 0.2)"
        : "0 0 5px rgba(76, 175, 80, 0.2)",
    },
  })
);

export const Dropdown: React.FC<DropdownProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  options,
  disabled = false,
  required = false,
  error = false,
  title,
}) => {
  return (
    <StyledSelect
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      error={error}
      title={title}
      className={error ? "error" : ""}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </StyledSelect>
  );
};
