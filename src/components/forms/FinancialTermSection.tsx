"use client";
import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import {
  VendorData,
  VendorType,
  payment_terms,
  TimePeriod,
  timePeriodOptions,
  payment_termsOptions,
  yesNoOptions,
} from "../../models/VendorTypes";
import { FormField } from "../ui/FormField";
import { ConditionalInput } from "../ui/ConditionalInput";
import { useSession } from "next-auth/react";

// Define Props
interface FinancialTermsSectionProps {
  data: VendorData["financialTerms"];
  vendorType: VendorType;
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  disabled?: boolean;
  validateField?: (field: string) => void;
  isEditable?: boolean;
}

// Styled Container
const SectionContainer = styled("div")({
  background: "#f7f7f7",
  padding: "20px",
  margin: "10px 0",
  borderRadius: "8px",
  boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)",
  width: "100%",
});

const SectionTitle = styled("h2")({
  fontSize: "1.2em",
  color: "rgb(31, 31, 35)",
  fontWeight: 600,
  marginBottom: "10px",
  marginTop: "10px",
});

const Note = styled("p")({
  fontSize: "14px",
  color: "#666",
  marginTop: "4px",
  marginBottom: "15px",
});

const RebateRow = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginTop: "8px",
  flexWrap: "wrap", // Added for better mobile display
});

const RebateField = styled("div")({
  flex: 1,
  minWidth: "240px",
  margin: "0 5px",
});

const StyledConditionalInput = styled(ConditionalInput)({
  width: "100%", // Make all inputs take full width of their container
  boxSizing: "border-box",
});

// Component
export const FinancialTermsSection: React.FC<FinancialTermsSectionProps> = ({
  data,
  vendorType,
  errors,
  touched,
  onChange,
  onBlur,
  validateField,
  isEditable = true,
  disabled = false,
}) => {
  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    onChange(field, numValue);
  };

  const handleValueChange = (field: string, value: any) => {
    onChange(field, value);
  };

  const handleBlur = (e: React.FocusEvent<any>) => {
    const field = e.target.name;
    onBlur(field);
  };

  // Determine which sections to show based on vendor type
  const showRebates =
    !vendorType || vendorType === "STOCK" || vendorType === "OVERHEADANDSTOCK";
  const showorder_expiry_days =
    !vendorType || vendorType === "STOCK" || vendorType === "OVERHEADANDSTOCK";

  return (
    <SectionContainer>
      <SectionTitle>4. Financial Terms</SectionTitle>

      {/* Payment Terms */}
      <FormField
        label="Payment terms"
        htmlFor="payment_terms"
        required
        error={errors.payment_terms}
        touched={touched["financialTerms.payment_terms"]}
      >
        <StyledConditionalInput
          isEditable={isEditable}
          type="select"
          name="payment_terms"
          value={data.payment_terms}
          onChange={handleValueChange}
          onBlur={handleBlur}
          options={payment_termsOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={disabled}
          required={true}
          className={
            errors.payment_terms && touched["financialTerms.payment_terms"]
              ? "border-red-500"
              : ""
          }
          placeholder="Select payment terms"
        />
        <Note>Terms set to 20 EOM requires CFO approval</Note>
      </FormField>

      {/* Order Expiry Days - only for STOCK or OVERHEADANDSTOCK */}
      {showorder_expiry_days && (
        <FormField
          label="Order Expiry Days"
          htmlFor="order_expiry_days"
          required
          error={errors.order_expiry_days}
          touched={touched["financialTerms.order_expiry_days"]}
        >
          <StyledConditionalInput
            isEditable={isEditable}
            type="number"
            name="order_expiry_days"
            value={
              data.order_expiry_days ? data.order_expiry_days.toString() : ""
            }
            onChange={(name, value) => handleNumberChange(name, value)}
            onBlur={handleBlur}
            disabled={disabled}
            required={showorder_expiry_days}
            className={
              errors.order_expiry_days &&
              touched["financialTerms.order_expiry_days"]
                ? "border-red-500"
                : ""
            }
            placeholder="Enter days"
          />
        </FormField>
      )}

      {/* Gross Margin */}
      {showorder_expiry_days && (
        <FormField
          label="Gross Margin"
          htmlFor="gross_margin"
          required
          error={errors.gross_margin}
          touched={touched["financialTerms.gross_margin"]}
        >
          <StyledConditionalInput
            isEditable={isEditable}
            type="text"
            name="gross_margin"
            value={data.gross_margin}
            onChange={handleValueChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={true}
            className={
              errors.gross_margin && touched["financialTerms.gross_margin"]
                ? "border-red-500"
                : ""
            }
            placeholder="%"
          />
        </FormField>
      )}

      {/* Invoice Discount */}
      <FormField
        label="Purchase Discount"
        htmlFor="invoice_discount"
        required
        error={errors.invoice_discount}
        touched={touched["financialTerms.invoice_discount"]}
      >
        <StyledConditionalInput
          isEditable={isEditable}
          type="select"
          name="invoice_discount"
          value={data.invoice_discount}
          onChange={handleValueChange}
          onBlur={handleBlur}
          options={yesNoOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={disabled}
          required={true}
          className={
            errors.invoice_discount &&
            touched["financialTerms.invoice_discount"]
              ? "border-red-500"
              : ""
          }
          placeholder="Select option"
        />
      </FormField>

      {/* Invoice Discount Value - only if invoice_discount is 'yes' */}
      {data.invoice_discount === "yes" && (
        <FormField
          label="Invoice Discount Value"
          htmlFor="invoice_discount_value"
          required
          error={errors.invoice_discount_value}
          touched={touched["financialTerms.invoice_discount_value"]}
        >
          <StyledConditionalInput
            isEditable={isEditable}
            type="text"
            name="invoice_discount_value"
            value={data.invoice_discount_value || ""}
            onChange={handleValueChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={data.invoice_discount === "yes"}
            className={
              errors.invoice_discount_value &&
              touched["financialTerms.invoice_discount_value"]
                ? "border-red-500"
                : ""
            }
            placeholder="% of net invoiced value / wholesale price"
          />
        </FormField>
      )}

      {/* Settlement Discount */}
      <FormField
        label="Settlement Discount"
        htmlFor="settlement_discount"
        required
        error={errors.settlement_discount}
        touched={touched["financialTerms.settlement_discount"]}
      >
        <StyledConditionalInput
          isEditable={isEditable}
          type="select"
          name="settlement_discount"
          value={data.settlement_discount}
          onChange={handleValueChange}
          onBlur={handleBlur}
          options={yesNoOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={disabled}
          required={true}
          className={
            errors.settlement_discount &&
            touched["financialTerms.settlement_discount"]
              ? "border-red-500"
              : ""
          }
          placeholder="Select option"
        />
      </FormField>

      {/* Settlement Discount Fields - only if settlement_discount is 'yes' */}
      {data.settlement_discount === "yes" && (
        <div className="grid_selection">
          {/* Settlement Discount Value */}
          <FormField
            label="Settlement Discount Value"
            htmlFor="settlement_discount_value"
            required
            error={errors.settlement_discount_value}
            touched={touched["financialTerms.settlement_discount_value"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="text"
              name="settlement_discount_value"
              value={data.settlement_discount_value || ""}
              onChange={handleValueChange}
              onBlur={handleBlur}
              disabled={disabled}
              required={data.settlement_discount === "yes"}
              className={
                errors.settlement_discount_value &&
                touched["financialTerms.settlement_discount_value"]
                  ? "border-red-500"
                  : ""
              }
              placeholder="% of net invoiced value for payment"
            />
          </FormField>

          {/* Settlement Discount Days */}
          <FormField
            label="Settlement Discount Days"
            htmlFor="settlement_discount_days"
            required
            error={errors.settlement_discount_days}
            touched={touched["financialTerms.settlement_discount_days"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="text"
              name="settlement_discount_days"
              value={data.settlement_discount_days || ""}
              onChange={handleValueChange}
              onBlur={handleBlur}
              disabled={disabled}
              required={data.settlement_discount === "yes"}
              className={
                errors.settlement_discount_days &&
                touched["financialTerms.settlement_discount_days"]
                  ? "border-red-500"
                  : ""
              }
              placeholder="within ____ days"
            />
          </FormField>
        </div>
      )}

      {/* Rebate Section - only for STOCK or OVERHEADANDSTOCK */}
      {showRebates && (
        <>
          {/* Flat Rebate */}
          <FormField
            label="Flat rebate"
            htmlFor="flat_rebate"
            required
            error={errors.flat_rebate}
            touched={touched["financialTerms.flat_rebate"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="select"
              name="flat_rebate"
              value={data.flat_rebate}
              onChange={handleValueChange}
              onBlur={handleBlur}
              options={yesNoOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              disabled={disabled}
              required={showRebates}
              className={
                errors.flat_rebate && touched["financialTerms.flat_rebate"]
                  ? "border-red-500"
                  : ""
              }
              placeholder="Select option"
            />
          </FormField>

          {/* Flat Rebate Fields - only if flat_rebate is 'yes' */}
          {data.flat_rebate === "yes" && (
            <RebateRow>
              <RebateField>
                <FormField
                  label="Flat Rebate Percentage"
                  htmlFor="flat_rebate_percent"
                  required={!data.flat_rebate_dollar}
                  error={errors.flat_rebate_percent}
                  touched={touched["financialTerms.flat_rebate_percent"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="flat_rebate_percent"
                    value={data.flat_rebate_percent || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.flat_rebate_dollar && data.flat_rebate === "yes"
                    }
                    className={
                      errors.flat_rebate_percent &&
                      touched["financialTerms.flat_rebate_percent"]
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="% of net invoiced value for the"
                  />
                </FormField>
              </RebateField>

              <RebateField>
                <FormField
                  label="Flat Rebate Dollar"
                  htmlFor="flat_rebate_dollar"
                  required={!data.flat_rebate_percent}
                  error={errors.flat_rebate_dollar}
                  touched={touched["financialTerms.flat_rebate_dollar"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="flat_rebate_dollar"
                    value={data.flat_rebate_dollar || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.flat_rebate_percent && data.flat_rebate === "yes"
                    }
                    className={
                      errors.flat_rebate_dollar &&
                      touched["financialTerms.flat_rebate_dollar"]
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="$ of net invoiced value for the"
                  />
                </FormField>
              </RebateField>

              <RebateField>
                <FormField
                  label="Flat Rebate Term"
                  htmlFor="flat_rebate_term"
                  required
                  error={errors.flat_rebate_term}
                  touched={touched["financialTerms.flat_rebate_term"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="select"
                    name="flat_rebate_term"
                    value={data.flat_rebate_term || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    options={timePeriodOptions.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    disabled={disabled}
                    required={data.flat_rebate === "yes"}
                    className={
                      errors.flat_rebate_term &&
                      touched["financialTerms.flat_rebate_term"]
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="Select term"
                  />
                </FormField>
              </RebateField>
            </RebateRow>
          )}

          {/* Growth Rebate */}
          <FormField
            label="Growth rebate"
            htmlFor="growth_rebate"
            required
            error={errors.growth_rebate}
            touched={touched["financialTerms.growth_rebate"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="select"
              name="growth_rebate"
              value={data.growth_rebate}
              onChange={handleValueChange}
              onBlur={handleBlur}
              options={yesNoOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              disabled={disabled}
              required={showRebates}
              className={
                errors.growth_rebate && touched["financialTerms.growth_rebate"]
                  ? "border-red-500"
                  : ""
              }
              placeholder="Select option"
            />
          </FormField>

          {/* Growth Rebate Fields - only if growth_rebate is 'yes' */}
          {data.growth_rebate === "yes" && (
            <RebateRow>
              <RebateField>
                <FormField
                  label="Growth Rebate Percentage"
                  htmlFor="growth_rebate_percent"
                  required={!data.growth_rebate_dollar}
                  error={errors.growth_rebate_percent}
                  touched={touched["financialTerms.growth_rebate_percent"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="growth_rebate_percent"
                    value={data.growth_rebate_percent || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.growth_rebate_dollar && data.growth_rebate === "yes"
                    }
                    className={
                      errors.growth_rebate_percent &&
                      touched["financialTerms.growth_rebate_percent"]
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="% of net invoiced value for the"
                  />
                </FormField>
              </RebateField>

              <RebateField>
                <FormField
                  label="Growth Rebate Dollar"
                  htmlFor="growth_rebate_dollar"
                  required={!data.growth_rebate_percent}
                  error={errors.growth_rebate_dollar}
                  touched={touched["financialTerms.growth_rebate_dollar"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="growth_rebate_dollar"
                    value={data.growth_rebate_dollar || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.growth_rebate_percent &&
                      data.growth_rebate === "yes"
                    }
                    className={
                      errors.growth_rebate_dollar &&
                      touched["financialTerms.growth_rebate_dollar"]
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="$ of net invoiced value for the"
                  />
                </FormField>
              </RebateField>

              <RebateField>
                <FormField
                  label="Growth Rebate Term"
                  htmlFor="growth_rebate_term"
                  required
                  error={errors.growth_rebate_term}
                  touched={touched["financialTerms.growth_rebate_term"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="select"
                    name="growth_rebate_term"
                    value={data.growth_rebate_term || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    options={timePeriodOptions.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    disabled={disabled}
                    required={data.growth_rebate === "yes"}
                    className={
                      errors.growth_rebate_term &&
                      touched["financialTerms.growth_rebate_term"]
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="Select term"
                  />
                </FormField>
              </RebateField>
            </RebateRow>
          )}

          {/* Marketing Rebate */}
          <FormField
            label="Marketing rebate"
            htmlFor="marketing_rebate"
            required
            error={errors.marketing_rebate}
            touched={touched["financialTerms.marketing_rebate"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="select"
              name="marketing_rebate"
              value={data.marketing_rebate}
              onChange={handleValueChange}
              onBlur={handleBlur}
              options={yesNoOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              disabled={disabled}
              required={showRebates}
              className={
                errors.marketing_rebate &&
                touched["financialTerms.marketing_rebate"]
                  ? "border-red-500"
                  : ""
              }
              placeholder="Select option"
            />
          </FormField>

          {/* Marketing Rebate Fields - only if marketing_rebate is 'yes' */}
          {data.marketing_rebate === "yes" && (
            <RebateRow>
              <RebateField>
                <FormField
                  label="Marketing Rebate Percentage"
                  htmlFor="marketing_rebate_percent"
                  required={!data.marketing_rebate_dollar}
                  error={errors.marketing_rebate_percent}
                  touched={touched["financialTerms.marketing_rebate_percent"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="marketing_rebate_percent"
                    value={data.marketing_rebate_percent || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.marketing_rebate_dollar &&
                      data.marketing_rebate === "yes"
                    }
                    className={
                      errors.marketing_rebate_percent &&
                      touched["financialTerms.marketing_rebate_percent"]
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="% of net invoiced value for the"
                  />
                </FormField>
              </RebateField>

              <RebateField>
                <FormField
                  label="Marketing Rebate Dollar"
                  htmlFor="marketing_rebate_dollar"
                  required={!data.marketing_rebate_percent}
                  error={errors.marketing_rebate_dollar}
                  touched={touched["financialTerms.marketing_rebate_dollar"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="marketing_rebate_dollar"
                    value={data.marketing_rebate_dollar || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.marketing_rebate_percent &&
                      data.marketing_rebate === "yes"
                    }
                    className={
                      errors.marketing_rebate_dollar &&
                      touched["financialTerms.marketing_rebate_dollar"]
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="$ of net invoiced value for the"
                  />
                </FormField>
              </RebateField>

              <RebateField>
                <FormField
                  label="Marketing Rebate Term"
                  htmlFor="marketing_rebate_term"
                  required
                  error={errors.marketing_rebate_term}
                  touched={touched["financialTerms.marketing_rebate_term"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="select"
                    name="marketing_rebate_term"
                    value={data.marketing_rebate_term || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    options={timePeriodOptions.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    disabled={disabled}
                    required={data.marketing_rebate === "yes"}
                    className={
                      errors.marketing_rebate_term &&
                      touched["financialTerms.marketing_rebate_term"]
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="Select term"
                  />
                </FormField>
              </RebateField>
            </RebateRow>
          )}
        </>
      )}

      {/* Promotional Fund */}
      <FormField
        label="Promotional Fund"
        htmlFor="promotional_fund"
        required={false}
        error={errors.promotional_fund}
        touched={touched["financialTerms.promotional_fund"]}
      >
        <StyledConditionalInput
          isEditable={isEditable}
          type="select"
          name="promotional_fund"
          value={data.promotional_fund || ""}
          onChange={handleValueChange}
          onBlur={handleBlur}
          options={yesNoOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={disabled}
          className={
            errors.promotional_fund &&
            touched["financialTerms.promotional_fund"]
              ? "border-red-500"
              : ""
          }
          placeholder="Select option"
        />
      </FormField>

      {/* Promotional Fund Value - only if promotional_fund is 'yes' */}
      {data.promotional_fund === "yes" && (
        <FormField
          label="Enter amount in dollars"
          htmlFor="promotional_fund_value"
          required
          error={errors.promotional_fund_value}
          touched={touched["financialTerms.promotional_fund_value"]}
        >
          <StyledConditionalInput
            isEditable={isEditable}
            type="text"
            name="promotional_fund_value"
            value={data.promotional_fund_value || ""}
            onChange={handleValueChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={data.promotional_fund === "yes"}
            className={
              errors.promotional_fund_value &&
              touched["financialTerms.promotional_fund_value"]
                ? "border-red-500"
                : ""
            }
            placeholder="$0.00"
          />
        </FormField>
      )}
    </SectionContainer>
  );
};
