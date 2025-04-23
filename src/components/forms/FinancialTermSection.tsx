"use client";
import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import {
  VendorData,
  VendorType,
  PaymentTerms,
  TimePeriod,
  timePeriodOptions,
  paymentTermsOptions,
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
  const showOrderExpiryDays =
    !vendorType || vendorType === "STOCK" || vendorType === "OVERHEADANDSTOCK";

  return (
    <SectionContainer>
      <SectionTitle>4. Financial Terms</SectionTitle>

      {/* Payment Terms */}
      <FormField
        label="Payment terms"
        htmlFor="paymentTerms"
        required
        error={errors.paymentTerms}
        touched={touched["financialTerms.paymentTerms"]}
      >
        <StyledConditionalInput
          isEditable={isEditable}
          type="select"
          name="paymentTerms"
          value={data.paymentTerms}
          onChange={handleValueChange}
          onBlur={handleBlur}
          options={paymentTermsOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={disabled}
          required={true}
          className={
            errors.paymentTerms && touched["financialTerms.paymentTerms"]
              ? "border-red-500"
              : ""
          }
          placeholder="Select payment terms"
        />
        <Note>Terms set to 20 EOM requires CFO approval</Note>
      </FormField>

      {/* Order Expiry Days - only for STOCK or OVERHEADANDSTOCK */}
      {showOrderExpiryDays && (
        <FormField
          label="Order Expiry Days"
          htmlFor="orderExpiryDays"
          required
          error={errors.orderExpiryDays}
          touched={touched["financialTerms.orderExpiryDays"]}
        >
          <StyledConditionalInput
            isEditable={isEditable}
            type="number"
            name="orderExpiryDays"
            value={data.orderExpiryDays ? data.orderExpiryDays.toString() : ""}
            onChange={(name, value) => handleNumberChange(name, value)}
            onBlur={handleBlur}
            disabled={disabled}
            required={showOrderExpiryDays}
            className={
              errors.orderExpiryDays &&
              touched["financialTerms.orderExpiryDays"]
                ? "border-red-500"
                : ""
            }
            placeholder="Enter days"
          />
        </FormField>
      )}

      {/* Gross Margin */}
      {showOrderExpiryDays && (
        <FormField
          label="Gross Margin"
          htmlFor="grossMargin"
          required
          error={errors.grossMargin}
          touched={touched["financialTerms.grossMargin"]}
        >
          <StyledConditionalInput
            isEditable={isEditable}
            type="text"
            name="grossMargin"
            value={data.grossMargin}
            onChange={handleValueChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={true}
            className={
              errors.grossMargin && touched["financialTerms.grossMargin"]
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
        htmlFor="invoiceDiscount"
        required
        error={errors.invoiceDiscount}
        touched={touched["financialTerms.invoiceDiscount"]}
      >
        <StyledConditionalInput
          isEditable={isEditable}
          type="select"
          name="invoiceDiscount"
          value={data.invoiceDiscount}
          onChange={handleValueChange}
          onBlur={handleBlur}
          options={yesNoOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={disabled}
          required={true}
          className={
            errors.invoiceDiscount && touched["financialTerms.invoiceDiscount"]
              ? "border-red-500"
              : ""
          }
          placeholder="Select option"
        />
      </FormField>

      {/* Invoice Discount Value - only if invoiceDiscount is 'yes' */}
      {data.invoiceDiscount === "yes" && (
        <FormField
          label="Invoice Discount Value"
          htmlFor="invoiceDiscountValue"
          required
          error={errors.invoiceDiscountValue}
          touched={touched["financialTerms.invoiceDiscountValue"]}
        >
          <StyledConditionalInput
            isEditable={isEditable}
            type="text"
            name="invoiceDiscountValue"
            value={data.invoiceDiscountValue || ""}
            onChange={handleValueChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={data.invoiceDiscount === "yes"}
            className={
              errors.invoiceDiscountValue &&
              touched["financialTerms.invoiceDiscountValue"]
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
        htmlFor="settlementDiscount"
        required
        error={errors.settlementDiscount}
        touched={touched["financialTerms.settlementDiscount"]}
      >
        <StyledConditionalInput
          isEditable={isEditable}
          type="select"
          name="settlementDiscount"
          value={data.settlementDiscount}
          onChange={handleValueChange}
          onBlur={handleBlur}
          options={yesNoOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={disabled}
          required={true}
          className={
            errors.settlementDiscount &&
            touched["financialTerms.settlementDiscount"]
              ? "border-red-500"
              : ""
          }
          placeholder="Select option"
        />
      </FormField>

      {/* Settlement Discount Fields - only if settlementDiscount is 'yes' */}
      {data.settlementDiscount === "yes" && (
        <div className="grid_selection">
          {/* Settlement Discount Value */}
          <FormField
            label="Settlement Discount Value"
            htmlFor="settlementDiscountValue"
            required
            error={errors.settlementDiscountValue}
            touched={touched["financialTerms.settlementDiscountValue"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="text"
              name="settlementDiscountValue"
              value={data.settlementDiscountValue || ""}
              onChange={handleValueChange}
              onBlur={handleBlur}
              disabled={disabled}
              required={data.settlementDiscount === "yes"}
              className={
                errors.settlementDiscountValue &&
                touched["financialTerms.settlementDiscountValue"]
                  ? "border-red-500"
                  : ""
              }
              placeholder="% of net invoiced value for payment"
            />
          </FormField>

          {/* Settlement Discount Days */}
          <FormField
            label="Settlement Discount Days"
            htmlFor="settlementDiscountDays"
            required
            error={errors.settlementDiscountDays}
            touched={touched["financialTerms.settlementDiscountDays"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="text"
              name="settlementDiscountDays"
              value={data.settlementDiscountDays || ""}
              onChange={handleValueChange}
              onBlur={handleBlur}
              disabled={disabled}
              required={data.settlementDiscount === "yes"}
              className={
                errors.settlementDiscountDays &&
                touched["financialTerms.settlementDiscountDays"]
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
            htmlFor="flatRebate"
            required
            error={errors.flatRebate}
            touched={touched["financialTerms.flatRebate"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="select"
              name="flatRebate"
              value={data.flatRebate}
              onChange={handleValueChange}
              onBlur={handleBlur}
              options={yesNoOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              disabled={disabled}
              required={showRebates}
              className={
                errors.flatRebate && touched["financialTerms.flatRebate"]
                  ? "border-red-500"
                  : ""
              }
              placeholder="Select option"
            />
          </FormField>

          {/* Flat Rebate Fields - only if flatRebate is 'yes' */}
          {data.flatRebate === "yes" && (
            <RebateRow>
              <RebateField>
                <FormField
                  label="Flat Rebate Percentage"
                  htmlFor="flatRebatePercent"
                  required={!data.flatRebateDollar}
                  error={errors.flatRebatePercent}
                  touched={touched["financialTerms.flatRebatePercent"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="flatRebatePercent"
                    value={data.flatRebatePercent || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.flatRebateDollar && data.flatRebate === "yes"
                    }
                    className={
                      errors.flatRebatePercent &&
                      touched["financialTerms.flatRebatePercent"]
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
                  htmlFor="flatRebateDollar"
                  required={!data.flatRebatePercent}
                  error={errors.flatRebateDollar}
                  touched={touched["financialTerms.flatRebateDollar"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="flatRebateDollar"
                    value={data.flatRebateDollar || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.flatRebatePercent && data.flatRebate === "yes"
                    }
                    className={
                      errors.flatRebateDollar &&
                      touched["financialTerms.flatRebateDollar"]
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
                  htmlFor="flatRebateTerm"
                  required
                  error={errors.flatRebateTerm}
                  touched={touched["financialTerms.flatRebateTerm"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="select"
                    name="flatRebateTerm"
                    value={data.flatRebateTerm || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    options={timePeriodOptions.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    disabled={disabled}
                    required={data.flatRebate === "yes"}
                    className={
                      errors.flatRebateTerm &&
                      touched["financialTerms.flatRebateTerm"]
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
            htmlFor="growthRebate"
            required
            error={errors.growthRebate}
            touched={touched["financialTerms.growthRebate"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="select"
              name="growthRebate"
              value={data.growthRebate}
              onChange={handleValueChange}
              onBlur={handleBlur}
              options={yesNoOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              disabled={disabled}
              required={showRebates}
              className={
                errors.growthRebate && touched["financialTerms.growthRebate"]
                  ? "border-red-500"
                  : ""
              }
              placeholder="Select option"
            />
          </FormField>

          {/* Growth Rebate Fields - only if growthRebate is 'yes' */}
          {data.growthRebate === "yes" && (
            <RebateRow>
              <RebateField>
                <FormField
                  label="Growth Rebate Percentage"
                  htmlFor="growthRebatePercent"
                  required={!data.growthRebateDollar}
                  error={errors.growthRebatePercent}
                  touched={touched["financialTerms.growthRebatePercent"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="growthRebatePercent"
                    value={data.growthRebatePercent || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.growthRebateDollar && data.growthRebate === "yes"
                    }
                    className={
                      errors.growthRebatePercent &&
                      touched["financialTerms.growthRebatePercent"]
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
                  htmlFor="growthRebateDollar"
                  required={!data.growthRebatePercent}
                  error={errors.growthRebateDollar}
                  touched={touched["financialTerms.growthRebateDollar"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="growthRebateDollar"
                    value={data.growthRebateDollar || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.growthRebatePercent && data.growthRebate === "yes"
                    }
                    className={
                      errors.growthRebateDollar &&
                      touched["financialTerms.growthRebateDollar"]
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
                  htmlFor="growthRebateTerm"
                  required
                  error={errors.growthRebateTerm}
                  touched={touched["financialTerms.growthRebateTerm"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="select"
                    name="growthRebateTerm"
                    value={data.growthRebateTerm || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    options={timePeriodOptions.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    disabled={disabled}
                    required={data.growthRebate === "yes"}
                    className={
                      errors.growthRebateTerm &&
                      touched["financialTerms.growthRebateTerm"]
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
            htmlFor="marketingRebate"
            required
            error={errors.marketingRebate}
            touched={touched["financialTerms.marketingRebate"]}
          >
            <StyledConditionalInput
              isEditable={isEditable}
              type="select"
              name="marketingRebate"
              value={data.marketingRebate}
              onChange={handleValueChange}
              onBlur={handleBlur}
              options={yesNoOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              disabled={disabled}
              required={showRebates}
              className={
                errors.marketingRebate &&
                touched["financialTerms.marketingRebate"]
                  ? "border-red-500"
                  : ""
              }
              placeholder="Select option"
            />
          </FormField>

          {/* Marketing Rebate Fields - only if marketingRebate is 'yes' */}
          {data.marketingRebate === "yes" && (
            <RebateRow>
              <RebateField>
                <FormField
                  label="Marketing Rebate Percentage"
                  htmlFor="marketingRebatePercent"
                  required={!data.marketingRebateDollar}
                  error={errors.marketingRebatePercent}
                  touched={touched["financialTerms.marketingRebatePercent"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="marketingRebatePercent"
                    value={data.marketingRebatePercent || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.marketingRebateDollar &&
                      data.marketingRebate === "yes"
                    }
                    className={
                      errors.marketingRebatePercent &&
                      touched["financialTerms.marketingRebatePercent"]
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
                  htmlFor="marketingRebateDollar"
                  required={!data.marketingRebatePercent}
                  error={errors.marketingRebateDollar}
                  touched={touched["financialTerms.marketingRebateDollar"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="text"
                    name="marketingRebateDollar"
                    value={data.marketingRebateDollar || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    required={
                      !data.marketingRebatePercent &&
                      data.marketingRebate === "yes"
                    }
                    className={
                      errors.marketingRebateDollar &&
                      touched["financialTerms.marketingRebateDollar"]
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
                  htmlFor="marketingRebateTerm"
                  required
                  error={errors.marketingRebateTerm}
                  touched={touched["financialTerms.marketingRebateTerm"]}
                >
                  <StyledConditionalInput
                    isEditable={isEditable}
                    type="select"
                    name="marketingRebateTerm"
                    value={data.marketingRebateTerm || ""}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    options={timePeriodOptions.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    disabled={disabled}
                    required={data.marketingRebate === "yes"}
                    className={
                      errors.marketingRebateTerm &&
                      touched["financialTerms.marketingRebateTerm"]
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
        htmlFor="promotionalFund"
        required={false}
        error={errors.promotionalFund}
        touched={touched["financialTerms.promotionalFund"]}
      >
        <StyledConditionalInput
          isEditable={isEditable}
          type="select"
          name="promotionalFund"
          value={data.promotionalFund || ""}
          onChange={handleValueChange}
          onBlur={handleBlur}
          options={yesNoOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          disabled={disabled}
          className={
            errors.promotionalFund && touched["financialTerms.promotionalFund"]
              ? "border-red-500"
              : ""
          }
          placeholder="Select option"
        />
      </FormField>

      {/* Promotional Fund Value - only if promotionalFund is 'yes' */}
      {data.promotionalFund === "yes" && (
        <FormField
          label="Enter amount in dollars"
          htmlFor="promotionalFundValue"
          required
          error={errors.promotionalFundValue}
          touched={touched["financialTerms.promotionalFundValue"]}
        >
          <StyledConditionalInput
            isEditable={isEditable}
            type="text"
            name="promotionalFundValue"
            value={data.promotionalFundValue || ""}
            onChange={handleValueChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={data.promotionalFund === "yes"}
            className={
              errors.promotionalFundValue &&
              touched["financialTerms.promotionalFundValue"]
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
