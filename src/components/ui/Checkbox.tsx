// src/components/ui/Checkbox.tsx
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

const StyledInput = styled("input")<{ disabled?: boolean }>(({ disabled }) => ({
  marginRight: "8px",
  transform: "translateY(-2px)",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: 1,
  "&:checked": {
    accentColor: "#3b82f6", // Use your theme color here
  },
}));

const StyledLabel = styled("label")<{ disabled?: boolean }>(({ disabled }) => ({
  display: "flex",
  alignItems: "center",
  fontFamily:
    '-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: "12px",
  color: disabled ? "#666" : "inherit",
  cursor: disabled ? "not-allowed" : "pointer",
}));

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
    if (disabled) return;

    if (onChange) onChange(e);
    if (onCheckedChange) onCheckedChange(e.target.checked);
  };

  return (
    <CheckboxContainer className={className}>
      {disabled ? (
        // When disabled, use a custom styled element that maintains the color
        <div
          style={{
            position: "relative",
            width: "16px",
            height: "16px",
            marginRight: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "2px",
            backgroundColor: checked ? "#3b82f6" : "#f9fafb",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {checked && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: "white" }}
            >
              <path
                d="M5 13L9 17L19 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <input
            type="checkbox"
            id={id}
            name={name}
            value={value}
            checked={checked}
            onChange={handleChange}
            disabled={true}
            required={required}
            style={{
              position: "absolute",
              opacity: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      ) : (
        // When enabled, use the normal input
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
      )}
      {label && (
        <StyledLabel htmlFor={id} disabled={disabled}>
          {label}
          {required && <span style={{ color: "red" }}>*</span>}
        </StyledLabel>
      )}
    </CheckboxContainer>
  );
};
