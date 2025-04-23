import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/Checkbox";

interface ReadOnlyFieldProps {
  label?: string;
  value: string | boolean | number;
  type?: "text" | "email" | "number" | "checkbox" | "textarea" | "select";
  options?: { value: string; label: string }[];
  isEditable: boolean;
  id: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onValueChange?: (value: string) => void;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  className?: string;
  errorMessage?: string;
}

export const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({
  label,
  value,
  type = "text",
  options,
  isEditable,
  id,
  name,
  required = false,
  placeholder,
  onChange,
  onValueChange,
  onCheckedChange,
  className = "",
  errorMessage,
}) => {
  const showError = !!errorMessage;
  const error = showError ? (
    <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
  ) : null;

  const renderField = () => {
    if (!isEditable) {
      // Non-editable state
      if (type === "checkbox") {
        return (
          <>
            <div className="flex items-center h-9 pl-3 border rounded-md bg-gray-100">
              {typeof value === "boolean"
                ? value
                  ? "Yes"
                  : "No"
                : value
                ? "Yes"
                : "No"}
            </div>
            {error}
          </>
        );
      } else if (type === "select" && options) {
        const selectedOption = options.find((opt) => opt.value === value);
        return (
          <>
            <Input
              value={selectedOption?.label || value?.toString() || ""}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
            {error}
          </>
        );
      } else if (type === "textarea") {
        return (
          <>
            <Textarea
              value={value?.toString() || ""}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
            {error}
          </>
        );
      } else {
        return (
          <>
            <Input
              value={value?.toString() || ""}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
            {error}
          </>
        );
      }
    }

    // Editable state
    switch (type) {
      case "checkbox":
        return (
          <>
            <Checkbox
              id={id}
              name={name}
              checked={!!value}
              onCheckedChange={onCheckedChange}
              className={showError ? "border-red-500" : ""}
            />
            {error}
          </>
        );

      case "textarea":
        return (
          <>
            <Textarea
              id={id}
              name={name}
              value={value?.toString() || ""}
              onChange={onChange}
              placeholder={placeholder}
              className={`${className} ${showError ? "border-red-500" : ""}`}
            />
            {error}
          </>
        );

      case "select":
        return (
          <>
            <Select
              value={value?.toString() || ""}
              onValueChange={onValueChange}
            >
              <SelectTrigger
                id={id}
                className={showError ? "border-red-500" : ""}
              >
                <SelectValue placeholder={placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error}
          </>
        );

      default:
        return (
          <>
            <Input
              id={id}
              name={name}
              type={type}
              value={value?.toString() || ""}
              onChange={onChange}
              placeholder={placeholder}
              required={required && isEditable}
              className={`${className} ${showError ? "border-red-500" : ""}`}
            />
            {error}
          </>
        );
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {renderField()}
    </div>
  );
};
