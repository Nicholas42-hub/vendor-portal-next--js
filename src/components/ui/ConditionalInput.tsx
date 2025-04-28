import React, { useMemo, useCallback, useState, useEffect } from "react";
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
import debounce from "lodash/debounce";

// Memoize select options rendering for better performance
const MemoizedSelectOptions = React.memo(
  ({ options }: { options: Array<{ value: string; label: string }> }) => (
    <>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </>
  )
);

MemoizedSelectOptions.displayName = "MemoizedSelectOptions";

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

export const ConditionalInput: React.FC<ConditionalInputProps> = React.memo(
  ({
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
    // Local state for input values to make UI more responsive
    const [localValue, setLocalValue] = useState(value);

    // Sync local value with prop value when it changes from outside
    useEffect(() => {
      if (value !== localValue) {
        setLocalValue(value);
      }
    }, [value]);

    // Apply consistent width class to all inputs
    const widthClass = "w-full";
    const combinedClassName = useMemo(
      () => `${widthClass} ${className}`.trim(),
      [className]
    );

    // Create debounced change handler
    const debouncedOnChange = useMemo(
      () =>
        onChange
          ? debounce((name: string, value: any) => {
              onChange(name, value);
            }, 250)
          : null,
      [onChange]
    );

    // Clean up debounce on unmount
    useEffect(() => {
      return () => {
        if (debouncedOnChange) {
          debouncedOnChange.cancel();
        }
      };
    }, [debouncedOnChange]);

    // Memoize options to prevent unnecessary processing
    const validOptions = useMemo(
      () => options?.filter((option) => option.value !== "") || [],
      [options]
    );

    // Memoize selected option to avoid recalculation
    const selectedOption = useMemo(() => {
      if (!options) return null;
      return options.find((opt) => opt.value === value);
    }, [options, value]);

    // Handle changes for inputs with debounce and local state
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        // Update local state immediately
        setLocalValue(newValue);
        // Debounce the parent update
        if (debouncedOnChange) {
          debouncedOnChange(name, newValue);
        }
      },
      [name, debouncedOnChange]
    );

    // Handle changes for selects
    const handleSelectChange = useCallback(
      (selectedValue: string) => {
        // Update local state immediately
        setLocalValue(selectedValue);
        // No need to debounce select changes
        if (onChange) {
          onChange(name, selectedValue);
        }
      },
      [onChange, name]
    );

    // Handle checkbox changes
    const handleCheckboxChange = useCallback(
      (checked: boolean | "indeterminate") => {
        const newValue = checked === true;
        setLocalValue(newValue);
        if (onChange) {
          onChange(name, newValue);
        }
      },
      [onChange, name]
    );

    // Memoized blur handler
    const handleBlur = useCallback(
      (e: React.FocusEvent<any>) => {
        if (onBlur) {
          window.requestIdleCallback
            ? window.requestIdleCallback(() => onBlur(e))
            : setTimeout(() => onBlur(e), 0);
        }
      },
      [onBlur]
    );

    // If not editable, render a read-only display - memoized components
    if (!isEditable) {
      if (type === "checkbox") {
        return (
          <span id={name} className="text-gray-700">
            {localValue ? "Yes" : "No"}
          </span>
        );
      }

      if (type === "select" && options) {
        // For selects, find the matching label to display
        const displayValue = selectedOption?.label || localValue || "";
        return (
          <Input
            id={name}
            value={displayValue}
            readOnly
            className={`bg-gray-50 cursor-not-allowed text-gray-700 ${widthClass}`}
          />
        );
      }

      if (type === "textarea") {
        return (
          <div
            id={name}
            className={`p-2 bg-gray-50 border rounded-md min-h-[80px] text-gray-700 ${widthClass}`}
          >
            {localValue || ""}
          </div>
        );
      }

      return (
        <Input
          id={name}
          value={localValue || ""}
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
              value={String(localValue || "")}
              onValueChange={handleSelectChange}
              disabled={disabled}
            >
              <SelectTrigger id={name} className={className}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                <MemoizedSelectOptions options={validOptions} />
              </SelectContent>
            </Select>
          </div>
        );

      case "checkbox":
        return (
          <div className={widthClass}>
            <Checkbox
              id={name}
              checked={!!localValue}
              onCheckedChange={handleCheckboxChange}
              disabled={disabled}
              className={className}
            />
          </div>
        );

      case "textarea":
        return (
          <Textarea
            id={name}
            name={name}
            value={localValue || ""}
            onChange={handleInputChange}
            onBlur={handleBlur}
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
            id={name}
            type="text"
            inputMode="numeric"
            name={name}
            value={localValue || ""}
            onChange={handleInputChange}
            onBlur={handleBlur}
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
            id={name}
            type="email"
            name={name}
            value={localValue || ""}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={combinedClassName}
            required={required}
          />
        );

      default:
        return (
          <Input
            id={name}
            type="text"
            name={name}
            value={localValue || ""}
            onChange={handleInputChange}
            onBlur={handleBlur}
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
  }
);

ConditionalInput.displayName = "ConditionalInput";
