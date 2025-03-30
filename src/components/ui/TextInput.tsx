import React from "react";
import { styled } from "@mui/material/styles";

interface TextInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  type?: "text" | "email" | "number";
  pattern?: string;
  title?: string;
  maxLength?: number;
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
  })
);

export const TextInput: React.FC<TextInputProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "",
  disabled = false,
  required = false,
  error = false,
  type = "text",
  pattern,
  title,
  maxLength,
}) => {
  return (
    <StyledInput
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={error}
      type={type}
      pattern={pattern}
      title={title}
      maxLength={maxLength}
      className={error ? "error" : ""}
    />
  );
};
