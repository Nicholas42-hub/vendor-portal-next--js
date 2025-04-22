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
import { TextInput } from "../ui/TextInput";
import { Dropdown } from "../ui/Dropdown";
import { useSession } from "next-auth/react";

// Define Props
interface FinancialTermsSectionProps {
  data: VendorData["financialTerms"];
  vendorType: VendorType;
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  disabled?: boolean; // Make this optional
  validateField?: (field: string) => void; // Make this optional
  isEditable?: boolean; // Add isEditable prop with default value true
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
});

const RebateField = styled("div")({
  flex: 1,
  minWidth: "240px",
  margin: "0 5px",
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
}) => {
  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    onChange(field, numValue);
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
        disabled={!isEditable}
        touched={touched["financialTerms.paymentTerms"]}
      >
        <Dropdown
          id="paymentTerms"
          name="paymentTerms"
          value={data.paymentTerms}
          onChange={(e) => onChange("paymentTerms", e.target.value)}
          onBlur={() => onBlur("paymentTerms")}
          options={paymentTermsOptions}
          disabled={!isEditable}
          required
          error={
            !!errors.paymentTerms && touched["financialTerms.paymentTerms"]
          }
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
          <TextInput
            id="orderExpiryDays"
            name="orderExpiryDays"
            value={data.orderExpiryDays ? data.orderExpiryDays.toString() : ""}
            onChange={(e) =>
              handleNumberChange("orderExpiryDays", e.target.value)
            }
            onBlur={() => onBlur("orderExpiryDays")}
            type="number"
            required={showOrderExpiryDays}
            error={
              !!errors.orderExpiryDays &&
              touched["financialTerms.orderExpiryDays"]
            }
            disabled={!isEditable}
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
          <TextInput
            id="grossMargin"
            name="grossMargin"
            value={data.grossMargin}
            onChange={(e) => onChange("grossMargin", e.target.value)}
            onBlur={() => onBlur("grossMargin")}
            placeholder="%"
            required
            error={
              !!errors.grossMargin && touched["financialTerms.grossMargin"]
            }
            disabled={!isEditable}
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
        <Dropdown
          id="invoiceDiscount"
          name="invoiceDiscount"
          value={data.invoiceDiscount}
          onChange={(e) => onChange("invoiceDiscount", e.target.value)}
          onBlur={() => onBlur("invoiceDiscount")}
          options={yesNoOptions}
          required
          error={
            !!errors.invoiceDiscount &&
            touched["financialTerms.invoiceDiscount"]
          }
          disabled={!isEditable}
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
          <TextInput
            id="invoiceDiscountValue"
            name="invoiceDiscountValue"
            value={data.invoiceDiscountValue || ""}
            onChange={(e) => onChange("invoiceDiscountValue", e.target.value)}
            onBlur={() => onBlur("invoiceDiscountValue")}
            placeholder="% of net invoiced value / wholesale price"
            required={data.invoiceDiscount === "yes"}
            error={
              !!errors.invoiceDiscountValue &&
              touched["financialTerms.invoiceDiscountValue"]
            }
            disabled={!isEditable}
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
        <Dropdown
          id="settlementDiscount"
          name="settlementDiscount"
          value={data.settlementDiscount}
          onChange={(e) => onChange("settlementDiscount", e.target.value)}
          onBlur={() => onBlur("settlementDiscount")}
          options={yesNoOptions}
          required
          error={
            !!errors.settlementDiscount &&
            touched["financialTerms.settlementDiscount"]
          }
          disabled={!isEditable}
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
            <TextInput
              id="settlementDiscountValue"
              name="settlementDiscountValue"
              value={data.settlementDiscountValue || ""}
              onChange={(e) =>
                onChange("settlementDiscountValue", e.target.value)
              }
              onBlur={() => onBlur("settlementDiscountValue")}
              placeholder="% of net invoiced value for payment"
              required={data.settlementDiscount === "yes"}
              error={
                !!errors.settlementDiscountValue &&
                touched["financialTerms.settlementDiscountValue"]
              }
              disabled={!isEditable}
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
            <TextInput
              id="settlementDiscountDays"
              name="settlementDiscountDays"
              value={data.settlementDiscountDays || ""}
              onChange={(e) =>
                onChange("settlementDiscountDays", e.target.value)
              }
              onBlur={() => onBlur("settlementDiscountDays")}
              placeholder="within ____ days"
              required={data.settlementDiscount === "yes"}
              error={
                !!errors.settlementDiscountDays &&
                touched["financialTerms.settlementDiscountDays"]
              }
              disabled={!isEditable}
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
            <Dropdown
              id="flatRebate"
              name="flatRebate"
              value={data.flatRebate}
              onChange={(e) => onChange("flatRebate", e.target.value)}
              onBlur={() => onBlur("flatRebate")}
              options={yesNoOptions}
              required={showRebates}
              error={
                !!errors.flatRebate && touched["financialTerms.flatRebate"]
              }
              disabled={!isEditable}
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
                  <TextInput
                    id="flatRebatePercent"
                    name="flatRebatePercent"
                    value={data.flatRebatePercent || ""}
                    onChange={(e) =>
                      onChange("flatRebatePercent", e.target.value)
                    }
                    onBlur={() => onBlur("flatRebatePercent")}
                    placeholder="% of net invoiced value for the"
                    required={
                      !data.flatRebateDollar && data.flatRebate === "yes"
                    }
                    error={
                      !!errors.flatRebatePercent &&
                      touched["financialTerms.flatRebatePercent"]
                    }
                    disabled={!isEditable}
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
                  <TextInput
                    id="flatRebateDollar"
                    name="flatRebateDollar"
                    value={data.flatRebateDollar || ""}
                    onChange={(e) =>
                      onChange("flatRebateDollar", e.target.value)
                    }
                    onBlur={() => onBlur("flatRebateDollar")}
                    placeholder="$ of net invoiced value for the"
                    required={
                      !data.flatRebatePercent && data.flatRebate === "yes"
                    }
                    error={
                      !!errors.flatRebateDollar &&
                      touched["financialTerms.flatRebateDollar"]
                    }
                    disabled={!isEditable}
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
                  <Dropdown
                    id="flatRebateTerm"
                    name="flatRebateTerm"
                    value={data.flatRebateTerm || ""}
                    onChange={(e) => onChange("flatRebateTerm", e.target.value)}
                    onBlur={() => onBlur("flatRebateTerm")}
                    options={timePeriodOptions}
                    required={data.flatRebate === "yes"}
                    error={
                      !!errors.flatRebateTerm &&
                      touched["financialTerms.flatRebateTerm"]
                    }
                    disabled={!isEditable}
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
            <Dropdown
              id="growthRebate"
              name="growthRebate"
              value={data.growthRebate}
              onChange={(e) => onChange("growthRebate", e.target.value)}
              onBlur={() => onBlur("growthRebate")}
              options={yesNoOptions}
              required={showRebates}
              error={
                !!errors.growthRebate && touched["financialTerms.growthRebate"]
              }
              disabled={!isEditable}
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
                  <TextInput
                    id="growthRebatePercent"
                    name="growthRebatePercent"
                    value={data.growthRebatePercent || ""}
                    onChange={(e) =>
                      onChange("growthRebatePercent", e.target.value)
                    }
                    onBlur={() => onBlur("growthRebatePercent")}
                    placeholder="% of net invoiced value for the"
                    required={
                      !data.growthRebateDollar && data.growthRebate === "yes"
                    }
                    error={
                      !!errors.growthRebatePercent &&
                      touched["financialTerms.growthRebatePercent"]
                    }
                    disabled={!isEditable}
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
                  <TextInput
                    id="growthRebateDollar"
                    name="growthRebateDollar"
                    value={data.growthRebateDollar || ""}
                    onChange={(e) =>
                      onChange("growthRebateDollar", e.target.value)
                    }
                    onBlur={() => onBlur("growthRebateDollar")}
                    placeholder="$ of net invoiced value for the"
                    required={
                      !data.growthRebatePercent && data.growthRebate === "yes"
                    }
                    error={
                      !!errors.growthRebateDollar &&
                      touched["financialTerms.growthRebateDollar"]
                    }
                    disabled={!isEditable}
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
                  <Dropdown
                    id="growthRebateTerm"
                    name="growthRebateTerm"
                    value={data.growthRebateTerm || ""}
                    onChange={(e) =>
                      onChange("growthRebateTerm", e.target.value)
                    }
                    onBlur={() => onBlur("growthRebateTerm")}
                    options={timePeriodOptions}
                    required={data.growthRebate === "yes"}
                    error={
                      !!errors.growthRebateTerm &&
                      touched["financialTerms.growthRebateTerm"]
                    }
                    disabled={!isEditable}
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
            <Dropdown
              id="marketingRebate"
              name="marketingRebate"
              value={data.marketingRebate}
              onChange={(e) => onChange("marketingRebate", e.target.value)}
              onBlur={() => onBlur("marketingRebate")}
              options={yesNoOptions}
              required={showRebates}
              error={
                !!errors.marketingRebate &&
                touched["financialTerms.marketingRebate"]
              }
              disabled={!isEditable}
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
                  <TextInput
                    id="marketingRebatePercent"
                    name="marketingRebatePercent"
                    value={data.marketingRebatePercent || ""}
                    onChange={(e) =>
                      onChange("marketingRebatePercent", e.target.value)
                    }
                    onBlur={() => onBlur("marketingRebatePercent")}
                    placeholder="% of net invoiced value for the"
                    required={
                      !data.marketingRebateDollar &&
                      data.marketingRebate === "yes"
                    }
                    error={
                      !!errors.marketingRebatePercent &&
                      touched["financialTerms.marketingRebatePercent"]
                    }
                    disabled={!isEditable}
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
                  <TextInput
                    id="marketingRebateDollar"
                    name="marketingRebateDollar"
                    value={data.marketingRebateDollar || ""}
                    onChange={(e) =>
                      onChange("marketingRebateDollar", e.target.value)
                    }
                    onBlur={() => onBlur("marketingRebateDollar")}
                    placeholder="$ of net invoiced value for the"
                    required={
                      !data.marketingRebatePercent &&
                      data.marketingRebate === "yes"
                    }
                    error={
                      !!errors.marketingRebateDollar &&
                      touched["financialTerms.marketingRebateDollar"]
                    }
                    disabled={!isEditable}
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
                  <Dropdown
                    id="marketingRebateTerm"
                    name="marketingRebateTerm"
                    value={data.marketingRebateTerm || ""}
                    onChange={(e) =>
                      onChange("marketingRebateTerm", e.target.value)
                    }
                    onBlur={() => onBlur("marketingRebateTerm")}
                    options={timePeriodOptions}
                    required={data.marketingRebate === "yes"}
                    error={
                      !!errors.marketingRebateTerm &&
                      touched["financialTerms.marketingRebateTerm"]
                    }
                    disabled={!isEditable}
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
        <Dropdown
          id="promotionalFund"
          name="promotionalFund"
          value={data.promotionalFund || ""}
          onChange={(e) => onChange("promotionalFund", e.target.value)}
          onBlur={() => onBlur("promotionalFund")}
          options={yesNoOptions}
          error={
            !!errors.promotionalFund &&
            touched["financialTerms.promotionalFund"]
          }
          disabled={!isEditable}
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
          <TextInput
            id="promotionalFundValue"
            name="promotionalFundValue"
            value={data.promotionalFundValue || ""}
            onChange={(e) => onChange("promotionalFundValue", e.target.value)}
            onBlur={() => onBlur("promotionalFundValue")}
            placeholder="$0.00"
            required={data.promotionalFund === "yes"}
            error={
              !!errors.promotionalFundValue &&
              touched["financialTerms.promotionalFundValue"]
            }
            disabled={!isEditable}
          />
        </FormField>
      )}
    </SectionContainer>
  );
};
