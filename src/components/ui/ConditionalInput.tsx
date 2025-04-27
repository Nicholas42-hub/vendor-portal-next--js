import React, {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
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

// Optimized rendering of select options to prevent excessive re-renders
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
    // Use local state for input values to reduce parent component render frequency
    const [localValue, setLocalValue] = useState(value);

    // Sync local value with prop value when it changes from outside
    useEffect(() => {
      if (value !== localValue) {
        setLocalValue(value);
      }
    }, [value]);

    // Apply consistent width class to all inputs - memoized
    const widthClass = "w-full";
    const combinedClassName = useMemo(() => {
      return `${widthClass} ${className}`.trim();
    }, [className]);

    // Create debounced change handler correctly
    const debouncedOnChangeRef = useRef<((value: any) => void) | null>(null);

    // Set up the debounced function just once
    useEffect(() => {
      if (onChange) {
        debouncedOnChangeRef.current = debounce((value: any) => {
          onChange(name, value);
        }, 250);

        return () => {
          if (debouncedOnChangeRef.current) {
            debouncedOnChangeRef.current.cancel();
          }
        };
      }
    }, [onChange, name]);

    // Memoize options to prevent unnecessary re-renders
    const validOptions = useMemo(() => {
      return options?.filter((option) => option.value !== "") || [];
    }, [options]);

    // Pre-compute selected option - carefully memoized
    const selectedOption = useMemo(() => {
      if (!validOptions.length || value === undefined || value === null)
        return null;
      return validOptions.find((opt) => opt.value === value);
    }, [validOptions, value]);

    // Local selected option label for select
    const selectedLabel = selectedOption ? selectedOption.label : placeholder;

    // Handle changes for inputs with debounce and local state
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        // Update local state immediately for responsive UI
        setLocalValue(newValue);
        // Debounce the parent component update
        if (debouncedOnChangeRef.current) {
          debouncedOnChangeRef.current(newValue);
        }
      },
      []
    );

    // Handle changes for selects - use local state for immediate feedback
    const handleSelectChange = useCallback(
      (selectedValue: string) => {
        // Only update if value has changed
        if (selectedValue !== localValue) {
          setLocalValue(selectedValue);
          if (onChange) {
            onChange(name, selectedValue);
          }
        }
      },
      [onChange, name, localValue]
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

    // Memoize blur handler - simplified to reduce execution time
    const handleBlur = useCallback(
      (e: React.FocusEvent<any>) => {
        if (onBlur) {
          onBlur(e);
        }
      },
      [onBlur]
    );

    // If not editable, use simplified read-only renderers
    if (!isEditable) {
      if (type === "checkbox") {
        return (
          <span id={name} className="text-gray-900 font-medium">
            {value ? "Yes" : "No"}
          </span>
        );
      }

      if (type === "select" && options) {
        const readOnlyValue = useMemo(() => {
          const opt = options.find((opt) => opt.value === value);
          return opt?.label || value || "";
        }, [options, value]);

        return (
          <Input
            id={name}
            value={readOnlyValue}
            readOnly
            className={`bg-gray-50 cursor-not-allowed text-gray-900 font-medium ${widthClass}`}
          />
        );
      }

      if (type === "textarea") {
        return (
          <div
            id={name}
            className={`p-2 bg-gray-50 border rounded-md min-h-[80px] text-gray-900 font-medium ${widthClass}`}
          >
            {value || ""}
          </div>
        );
      }

      return (
        <Input
          id={name}
          value={value || ""}
          readOnly
          className={`bg-gray-50 cursor-not-allowed text-gray-900 font-medium ${widthClass}`}
        />
      );
    }

    // If editable, render the appropriate input type with local state
    switch (type) {
      case "select":
        return (
          <div className={widthClass}>
            <Select
              // Ensure value is always a string to prevent type changes
              value={String(localValue || "")}
              onValueChange={handleSelectChange}
              disabled={disabled}
            >
              <SelectTrigger id={name} className={className}>
                <SelectValue placeholder={placeholder}>
                  {selectedLabel}
                </SelectValue>
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

// Add display name for debugging
ConditionalInput.displayName = "ConditionalInput";
