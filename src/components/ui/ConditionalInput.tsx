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
import { Checkbox } from "@/components/ui/Checkbox";

interface Option {
  value: string;
  label: string;
}

interface ConditionalInputProps {
  isEditable: boolean;
  type: "text" | "select" | "checkbox" | "number" | "textarea" | "email";
  name: string;
  value: any;
  onChange?: (name: string, value: any) => void;
  onBlur?: (e: React.FocusEvent<any>) => void;
  options?: Option[];
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text" | "tel" | "email";
  pattern?: string;
}

export const ConditionalInput: React.FC<ConditionalInputProps> = ({
  isEditable,
  type,
  name,
  value,
  onChange,
  onBlur,
  options,
  disabled = false,
  placeholder = "",
  required = false,
  className = "",
  maxLength,
  inputMode,
  pattern,
}) => {
  // Apply consistent width class to all inputs
  const widthClass = "w-full";
  const combinedClassName = `${widthClass} ${className}`.trim();

  // Handle changes for inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (onChange) {
      onChange(name, e.target.value);
    }
  };

  // Handle changes for selects
  const handleSelectChange = (selectedValue: string) => {
    if (onChange) {
      onChange(name, selectedValue);
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    if (onChange) {
      onChange(name, checked === true);
    }
  };

  // Filter out options with empty string values to prevent Select.Item errors
  const validOptions = options?.filter((option) => option.value !== "") || [];

  // If not editable, render a read-only display
  if (!isEditable) {
    if (type === "checkbox") {
      return <span className="text-gray-700">{value ? "Yes" : "No"}</span>;
    }

    if (type === "select" && options) {
      // For selects, find the matching label to display
      const selectedOption = options.find((opt) => opt.value === value);
      return (
        <Input
          value={selectedOption?.label || value || ""}
          readOnly
          className={`bg-gray-50 cursor-not-allowed text-gray-700 ${widthClass}`}
        />
      );
    }

    if (type === "textarea") {
      return (
        <div
          className={`p-2 bg-gray-50 border rounded-md min-h-[80px] text-gray-700 ${widthClass}`}
        >
          {value || ""}
        </div>
      );
    }

    return (
      <Input
        value={value || ""}
        readOnly
        className={`bg-gray-50 cursor-not-allowed text-gray-700 ${widthClass}`}
      />
    );
  }

  // If editable, render the appropriate input type
  switch (type) {
    case "select":
      return (
        <div className={widthClass}>
          <Select
            value={value || ""}
            onValueChange={handleSelectChange}
            disabled={disabled}
          >
            <SelectTrigger className={className}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {validOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "checkbox":
      return (
        <div className={widthClass}>
          <Checkbox
            checked={!!value}
            onCheckedChange={handleCheckboxChange}
            disabled={disabled}
            className={className}
          />
        </div>
      );

    case "textarea":
      return (
        <Textarea
          name={name}
          value={value || ""}
          onChange={handleInputChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={combinedClassName}
          maxLength={maxLength}
          required={required}
        />
      );

    case "number":
      return (
        <Input
          type="text"
          inputMode="numeric"
          name={name}
          value={value || ""}
          onChange={handleInputChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={combinedClassName}
          maxLength={maxLength}
          pattern={pattern}
          required={required}
        />
      );

    case "email":
      return (
        <Input
          type="email"
          name={name}
          value={value || ""}
          onChange={handleInputChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={combinedClassName}
          required={required}
        />
      );

    default:
      return (
        <Input
          type="text"
          name={name}
          value={value || ""}
          onChange={handleInputChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={combinedClassName}
          maxLength={maxLength}
          inputMode={inputMode}
          pattern={pattern}
          required={required}
        />
      );
  }
};
