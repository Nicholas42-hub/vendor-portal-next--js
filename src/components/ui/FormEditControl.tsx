// src/components/ui/FormEditControl.tsx
import React from "react";
import { styled } from "@mui/material/styles";

interface FormEditControlProps {
  isEditable: boolean;
  onToggle: () => void;
  className?: string;
}

const ControlContainer = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  marginBottom: "20px",
});

const ToggleButton = styled("button")<{ isEditable: boolean }>(
  ({ isEditable }) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.1s",
    backgroundColor: isEditable ? "#FFC107" : "#2196F3",
    color: "white",
    "&:hover": {
      backgroundColor: isEditable ? "#FFA000" : "#1976D2",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  })
);

const StatusBadge = styled("div")<{ isEditable: boolean }>(
  ({ isEditable }) => ({
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    marginRight: "12px",
    backgroundColor: isEditable ? "#E8F5E9" : "#FFEBEE",
    color: isEditable ? "#2E7D32" : "#C62828",
    border: `1px solid ${isEditable ? "#A5D6A7" : "#EF9A9A"}`,
  })
);

const LockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UnlockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
  </svg>
);

export const FormEditControl: React.FC<FormEditControlProps> = ({
  isEditable,
  onToggle,
  className = "",
}) => {
  return (
    <ControlContainer className={className}>
      <StatusBadge isEditable={isEditable}>
        {isEditable ? "EDITABLE" : "READ ONLY"}
      </StatusBadge>
      <ToggleButton isEditable={isEditable} onClick={onToggle}>
        {isEditable ? <LockIcon /> : <UnlockIcon />}
        {isEditable ? "Lock Form" : "Unlock Form"}
      </ToggleButton>
    </ControlContainer>
  );
};
