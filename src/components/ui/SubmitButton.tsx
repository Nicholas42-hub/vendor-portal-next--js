import React from "react";
import { styled } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";

interface SubmitButtonProps {
  text: string;
  loadingText?: string;
  isLoading: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  onClick?: () => void;
  customStyle?: React.CSSProperties | any;
}

const StyledButton = styled("button")<{
  $variant: string;
  $fullWidth: boolean;
}>(({ $variant, $fullWidth, theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 20px",
  borderRadius: "4px",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
  width: $fullWidth ? "100%" : "auto",
  backgroundColor: $variant === "primary" ? "#003063" : "#f5f5f5",
  color: $variant === "primary" ? "white" : "#333",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: $variant === "primary" ? "#002364" : "#e0e0e0",
  },
  "&:disabled": {
    backgroundColor: $variant === "primary" ? "#7a97b9" : "#e0e0e0",
    cursor: "not-allowed",
  },
}));

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  text,
  loadingText = "Loading...",
  isLoading,
  type = "button",
  variant = "primary",
  fullWidth = false,
  onClick,
  customStyle,
}) => {
  return (
    <StyledButton
      $variant={variant}
      $fullWidth={fullWidth}
      type={type}
      disabled={isLoading}
      onClick={onClick}
      sx={customStyle}
    >
      {isLoading ? (
        <>
          <CircularProgress
            size={16}
            sx={{
              color: variant === "primary" ? "white" : "#666",
              marginRight: "8px",
            }}
          />
          {loadingText}
        </>
      ) : (
        text
      )}
    </StyledButton>
  );
};
