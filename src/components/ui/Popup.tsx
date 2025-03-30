import React from "react";
import { styled } from "@mui/material/styles";

interface PopupProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirmation?: boolean;
  children?: React.ReactNode;
}

const PopupOverlay = styled("div")({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0, 0, 0, 0.5)",
  visibility: "hidden",
  zIndex: 999,
  "&.open": {
    visibility: "visible",
  },
});

const PopupContainer = styled("div")({
  width: "400px",
  background: "#fff",
  borderRadius: "6px",
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%) scale(0.1)",
  textAlign: "center",
  padding: "30px",
  color: "#333",
  visibility: "hidden",
  transition: "transform 0.4s, top 0.4s",
  zIndex: 1000,
  "&.open": {
    visibility: "visible",
    transform: "translate(-50%, -50%) scale(1)",
  },
});

const Title = styled("h2")({
  fontSize: "20px",
  fontWeight: 500,
  margin: "30px 0 10px",
});

const Message = styled("p")({
  fontSize: "16px",
  marginBottom: "20px",
});

const ButtonContainer = styled("div")({
  display: "flex",
  justifyContent: "space-around",
  gap: "15px",
});

const Button = styled("button")<{ variant: "confirm" | "cancel" }>(
  ({ variant }) => ({
    width: "100px",
    padding: "10px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: variant === "confirm" ? "#4CAF50" : "#FF0000",
  })
);

export const Popup: React.FC<PopupProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Yes",
  cancelText = "No",
  onConfirm,
  onCancel,
  isConfirmation = true,
  children,
}) => {
  return (
    <>
      <PopupOverlay className={isOpen ? "open" : ""} onClick={onCancel} />
      <PopupContainer className={isOpen ? "open" : ""}>
        <Title>{title}</Title>
        {message && <Message>{message}</Message>}
        {children}
        <ButtonContainer>
          {isConfirmation ? (
            <>
              <Button variant="confirm" onClick={onConfirm}>
                {confirmText}
              </Button>
              <Button variant="cancel" onClick={onCancel}>
                {cancelText}
              </Button>
            </>
          ) : (
            <Button variant="confirm" onClick={onConfirm || onCancel}>
              {confirmText}
            </Button>
          )}
        </ButtonContainer>
      </PopupContainer>
    </>
  );
};
