import React from "react";
import { styled } from "@mui/material/styles";

interface SubmitButtonProps {
  text: string;
  loadingText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "approval";
  fullWidth?: boolean;
  className?: string;
}

const StyledButton = styled("button")<{
  variant: "primary" | "secondary" | "approval";
  fullWidth: boolean;
  isLoading: boolean;
}>(({ variant, fullWidth, isLoading }) => {
  // Base styles
  const baseStyles = {
    display: "inline-block",
    padding: "15px",
    fontSize: "14px",
    fontWeight: "bold",
    textAlign: "center" as const,
    cursor: isLoading ? "wait" : "pointer",
    borderRadius: "4px",
    border: "none",
    transition: "background-color 0.3s ease",
    width: fullWidth ? "100%" : "auto",
    position: "relative" as const,
  };

  // Variant-specific styles
  const variantStyles = {
    primary: {
      backgroundColor: "#4CAF50",
      color: "white",
      "&:hover:not(:disabled)": {
        backgroundColor: "#45a049",
      },
    },
    secondary: {
      backgroundColor: "#f0f0f0",
      color: "#333",
      "&:hover:not(:disabled)": {
        backgroundColor: "#e0e0e0",
      },
    },
    approval: {
      backgroundColor: "#1976D2",
      color: "white",
      "&:hover:not(:disabled)": {
        backgroundColor: "#1565C0",
      },
    },
  };

  // Disabled styles
  const disabledStyles = {
    "&:disabled": {
      backgroundColor: "#cccccc",
      color: "#666666",
      cursor: "not-allowed",
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
    ...disabledStyles,
  };
});

// Loading spinner component
const Spinner = styled("span")({
  display: "inline-block",
  width: "16px",
  height: "16px",
  border: "2px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "50%",
  borderTopColor: "#fff",
  animation: "spin 0.8s linear infinite",
  marginRight: "8px",
  "@keyframes spin": {
    to: { transform: "rotate(360deg)" },
  },
});

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  text,
  loadingText,
  isLoading = false,
  disabled = false,
  onClick,
  type = "submit",
  variant = "primary",
  fullWidth = false,
  className = "",
}) => {
  const buttonText = isLoading && loadingText ? loadingText : text;

  return (
    <StyledButton
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      variant={variant}
      fullWidth={fullWidth}
      isLoading={isLoading}
      className={`submit-button ${className}`}
    >
      {isLoading && <Spinner />}
      {buttonText}
    </StyledButton>
  );
};
