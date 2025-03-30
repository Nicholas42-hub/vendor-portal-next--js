import React, { ReactNode } from "react";
import { styled } from "@mui/material/styles";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  children: ReactNode;
}

const StyledFormField = styled("div")(({ theme }) => ({
  marginBottom: "1rem",
}));

const StyledLabel = styled("label")(({ theme }) => ({
  boxSizing: "border-box",
  color: "rgb(31, 31, 35)",
  cursor: "default",
  display: "block",
  fontFamily:
    '-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: "12px",
  fontWeight: 600,
  height: "20px",
  letterSpacing: "normal",
  lineHeight: "20px",
  marginBottom: "4px",
  overflow: "visible",
  textOverflow: "clip",
  wordBreak: "break-word",
}));

const RequiredIndicator = styled("span")({
  color: "red",
  marginLeft: "5px",
});

const ErrorMessage = styled("div")({
  color: "#ff0000",
  fontSize: "12px",
  marginTop: "5px",
});

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  touched = false,
  children,
}) => {
  return (
    <StyledFormField>
      <StyledLabel htmlFor={htmlFor}>
        {label}
        {required && <RequiredIndicator>*</RequiredIndicator>}
      </StyledLabel>
      {children}
      {touched && error && <ErrorMessage>{error}</ErrorMessage>}
    </StyledFormField>
  );
};
