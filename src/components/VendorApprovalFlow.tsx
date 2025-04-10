"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import GeneralDetailsSection from "@/components/forms/GeneralDetailSection";
import SupplyTermsSection from "@/components/forms/SupplyTermSection";
import { TradingTermsSection } from "./forms/TradingTermSection";
import { FinancialTermsSection } from "./forms/FinancialTermSection";

// Define types for approval states
type ApprovalStatus =
  | "Pending Manager Approval"
  | "Pending CFO Approval"
  | "Pending Exco Approval"
  | "Creation approved"
  | "Declined"
  | "Invitation sent";

// Type definitions for VendorData
interface VendorData {
  contactid?: string;
  crb7c_tradingname?: string;
  crb7c_statuscode?: ApprovalStatus;
  crb7c_approvalcomment?: string;
  generalDetails?: any;
  supplyTerms?: any;
  tradingTerms?: any;
  financialTerms?: any;
  supplierform?:any;
  [key: string]: any;
}

export default function CompleteVendorApprovalFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const email = searchParams?.get("email");

  // State variables

  const [vendorData, setVendorData] = useState<VendorData>({});
  const [formattedVendorData, setFormattedVendorData] = useState({
    generalDetails: {
      tradingEntities: [],
      vendorHomeCountry: "",
      primaryTradingBusinessUnit: "",
      email: "",
      businessName: "",
      vendorType: "",
    },
    supplyTerms: {
      exclusiveSupply: "",
      saleOrReturn: "",
      authRequired: "",
      deliveryNotice: 0,
      minOrderValue: 0,
      minOrderQuantity: 0,
      maxOrderValue: 0,
      otherComments: "",
    },
    tradingTerms: {
      quotesObtained: "",
      quotesObtainedReason: "",
      quotesPdf: null,
      backOrder: "",
    },
    financialTerms: {
      paymentTerms: "",
      orderExpiryDays: 0,
      grossMargin: "",
      invoiceDiscount: "",
      invoiceDiscountValue: "",
      settlementDiscount: "",
      settlementDiscountValue: "",
      settlementDiscountDays: "",
      flatRebate: "",
      flatRebatePercent: "",
      flatRebateDollar: "",
      flatRebateTerm: "",
      growthRebate: "",
      growthRebatePercent: "",
      growthRebateDollar: "",
      growthRebateTerm: "",
      marketingRebate: "",
      marketingRebatePercent: "",
      marketingRebateDollar: "",
      marketingRebateTerm: "",
      promotionalFund: "",
      promotionalFundValue: "",
    },
    interface SupplierFormData {
      business_name: string;
      trading_name: string;
      country: string;
      gst_registered: string;
      abn?: string;
      gst?: string;
      address: string;
      website: string;
      city: string;
      state: string;
      postcode: string;
      primary_contact_email: string;
      telephone: string;
      po_email: string;
      return_order_email: string;
      trading_entities: string[];
      ANB_GST: string;
      // Payment method
      payment_method: string;
    
      // AU specific fields
      au_invoice_currency?: string;
      au_bank_country?: string;
      au_bank_address?: string;
      au_bank_currency_code?: string;
      au_bank_clearing_code?: string;
      au_remittance_email?: string;
      au_bsb?: string;
      au_account?: string;
    
      // NZ specific fields
      nz_invoice_currency?: string;
      nz_bank_country?: string;
      nz_bank_address?: string;
      nz_bank_currency_code?: string;
      nz_bank_clearing_code?: string;
      nz_remittance_email?: string;
      nz_bsb?: string;
      nz_account?: string;
    
      // Overseas banking
      overseas_iban_switch?: string;
      overseas_iban?: string;
      overseas_swift?: string;
    
      // BPay
      biller_code?: string;
      ref_code?: string;
    
      // Terms agreement
      iAgree: boolean;
    }

  });
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeclinePopup, setShowDeclinePopup] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [declineComment, setDeclineComment] = useState("");
  const [requiresCFOApproval, setRequiresCFOApproval] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [activeSection, setActiveSection] = useState<string>(
    "vendorOnboardingForm"
  );
  // Fetch data when component mounts
  useEffect(() => {
    if (email) {
      fetchVendorData(email);
    }
  }, [email, session]);

  // Fetch vendor data from API
  const fetchVendorData = async (vendorEmail: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/vendors?email=${encodeURIComponent(vendorEmail)}`
      );

      if (response.data && response.data.length > 0) {
        const vendor = response.data[0];

        // Check if payment terms require CFO approval
        const cfoCriticalTerms = [
          "1 DAY",
          "10 DAYS",
          "13 DAYS",
          "14 DAYS",
          "15 DAYS",
          "20 DAYS",
          "21 DAYS",
          "20 EOM",
        ];
        const needsCFOApproval = cfoCriticalTerms.includes(
          vendor.crb7c_paymentterms?.toUpperCase()
        );
        setRequiresCFOApproval(needsCFOApproval);

        // Set vendor data
        setVendorData(vendor);

        // Format the data for form sections
        const tradingEntities = [];
        if (vendor.crb7c_tradingentities) {
          // Assuming crb7c_tradingentities is a comma-separated string or an array
          const entitiesArray = Array.isArray(vendor.crb7c_tradingentities)
            ? vendor.crb7c_tradingentities
            : vendor.crb7c_tradingentities
                .split(",")
                .map((item) => item.trim());

          tradingEntities.push(...entitiesArray);
        }

        // Format data for all form sections
        setFormattedVendorData({
          generalDetails: {
            tradingEntities: tradingEntities,
            vendorHomeCountry: vendor.description || "",
            primaryTradingBusinessUnit:
              vendor.crb7c_primarytradingbusinessunit || "",
            email: vendor.emailaddress1 || "",
            businessName: vendor.crb7c_tradingname || "",
            vendorType: vendor.crb7c_purchasetype || "",
          },
          supplyTerms: {
            exclusiveSupply: vendor.crb7c_exclusivesupply || "",
            saleOrReturn: vendor.crb7c_salesorreturn || "",
            authRequired: vendor.crb7c_salesorexchange || "",
            deliveryNotice: parseInt(vendor.crb7c_delivery_notice || "0"),
            minOrderValue: parseInt(vendor.crb7c_min_order_value || "0"),
            minOrderQuantity: parseInt(vendor.crb7c_min_order_value || "0"), // Using min_order_value as a fallback
            maxOrderValue: parseInt(vendor.crb7c_max_order_value || "0"),
            otherComments: vendor.description || "",
          },
          tradingTerms: {
            quotesObtained: vendor.crb7c_quoteschecked || "",
            quotesObtainedReason: vendor.crb7c_approvalcomment || "",
            quotesPdf: null,
            backOrder: vendor.crb7c_backorderallowed || "",
          },
          financialTerms: {
            paymentTerms: vendor.crb7c_paymentterms || "",
            orderExpiryDays: parseInt(vendor.crb7c_orderexpirydays || "0"),
            grossMargin: vendor.crb7c_grossmargin || "",
            invoiceDiscount: vendor.crb7c_invoicediscount || "",
            invoiceDiscountValue: vendor.crb7c_invoicediscountvalue || "",
            settlementDiscount: vendor.crb7c_settlementdiscount || "",
            settlementDiscountValue: vendor.crb7c_settlementdiscountvalue || "",
            settlementDiscountDays: vendor.crb7c_settlementdiscountdays || "",
            flatRebate: vendor.crb7c_flatrebate || "",
            flatRebatePercent: vendor.crb7c_flatrebatepercent || "",
            flatRebateDollar: vendor.crb7c_flatrebatedollar || "",
            flatRebateTerm: vendor.crb7c_flatrebateterm || "",
            growthRebate: vendor.crb7c_growthrebate || "",
            growthRebatePercent: vendor.crb7c_growthrebatepercent || "",
            growthRebateDollar: vendor.crb7c_growthrebatedollar || "",
            growthRebateTerm: vendor.crb7c_growthrebateterm || "",
            marketingRebate: vendor.crb7c_marketingrebate || "",
            marketingRebatePercent: vendor.crb7c_marketingrebatepercent || "",
            marketingRebateDollar: vendor.crb7c_marketingrebatedollar || "",
            marketingRebateTerm: vendor.crb7c_marketingrebateterm || "",
            promotionalFund: vendor.crb7c_promotionalfund || "",
            promotionalFundValue: vendor.crb7c_promotionalfundvalue || "",
          },
        });

        // Validate approver access
        validateApproverAccess(
          vendor.crb7c_statuscode,
          vendor.crb7c_primarytradingbusinessunit
        );
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate if current user can approve
  const validateApproverAccess = async (
    statusCode?: ApprovalStatus,
    businessUnit?: string
  ) => {
    if (!statusCode || !businessUnit || !session?.user?.email) {
      setCanApprove(false);
      return;
    }

    try {
      // Fetch approvers for this business unit
      const response = await axios.get(
        `/api/approvers?businessUnit=${encodeURIComponent(businessUnit)}`
      );

      if (response.data && response.data.length > 0) {
        const approvers = response.data[0];
        let hasApprovalRights = false;

        switch (statusCode) {
          case "Pending Manager Approval":
            hasApprovalRights =
              approvers.crb7c_approver1 === session.user.email;
            break;
          case "Pending CFO Approval":
            hasApprovalRights =
              approvers.crb7c_approver2 === session.user.email;
            break;
          case "Pending Exco Approval":
            hasApprovalRights =
              approvers.crb7c_approver3 === session.user.email;
            break;
          default:
            hasApprovalRights = false;
        }

        setCanApprove(hasApprovalRights);
      }
    } catch (error) {
      console.error("Error validating approver access:", error);
      setCanApprove(false);
    }
  };

  // Helper function to check if status is in a specific state
  const isStatus = (
    status?: ApprovalStatus,
    targetStatus?: ApprovalStatus | ApprovalStatus[]
  ): boolean => {
    if (!status) return false;

    if (Array.isArray(targetStatus)) {
      return targetStatus.includes(status);
    }

    return status === targetStatus;
  };

  // Placeholder functions for the form components props
  const handleChange = (field: string, value: any) => {
    // Read-only, so no actual changes
    console.log(`Field ${field} would change to ${value}`);
  };

  const handleCheckboxChange = (
    field: string,
    value: string,
    checked: boolean
  ) => {
    // Read-only, so no actual changes
    console.log(
      `Checkbox ${field} with value ${value} would be ${
        checked ? "checked" : "unchecked"
      }`
    );
  };

  const handleBlur = (field: string) => {
    // Read-only, so no actual blur handling
    console.log(`Field ${field} blurred`);
  };

  // Handle approval button click
  const handleApprove = () => {
    setShowConfirmation(true);
  };

  // Handle decline button click
  const handleDecline = () => {
    setShowDeclinePopup(true);
  };

  // Handle delete button click
  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  // Confirm approval
  const confirmApproval = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmation(false);

      let newStatus: ApprovalStatus;

      // Determine next status based on current status
      switch (vendorData.crb7c_statuscode) {
        case "Pending Manager Approval":
          newStatus = requiresCFOApproval
            ? "Pending CFO Approval"
            : "Pending Exco Approval";
          break;
        case "Pending CFO Approval":
          newStatus = "Pending Exco Approval";
          break;
        case "Pending Exco Approval":
          newStatus = "Creation approved";
          break;
        default:
          throw new Error("Invalid approval flow state");
      }

      // Update vendor status (in a real app, this would make the API call)
      setVendorData({ ...vendorData, crb7c_statuscode: newStatus });

      // Show success popup
      setSuccessMessage(`Vendor successfully moved to ${newStatus} status.`);
      setShowSuccess(true);
    } catch (error) {
      console.error("Error approving vendor:", error);
      alert("Failed to approve vendor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm decline
  const confirmDecline = async () => {
    if (!declineComment) {
      alert("Please provide a reason for declining.");
      return;
    }

    try {
      setIsSubmitting(true);
      setShowDeclinePopup(false);

      // Update vendor status
      setVendorData({
        ...vendorData,
        crb7c_statuscode: "Declined",
        crb7c_approvalcomment: declineComment,
      });

      // Show success popup
      setSuccessMessage("Vendor has been declined.");
      setShowSuccess(true);
    } catch (error) {
      console.error("Error declining vendor:", error);
      alert("Failed to decline vendor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle success popup close
  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back button */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-100"
          onClick={() => router.push("/")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
            />
          </svg>
          Back to Vendor List
        </button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Forms - Takes up 2/3 of the space */}
        <div className="md:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Vendor Details</h2>

            {/* Section tabs */}
            <div className="flex mb-6 border-b">
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  activeSection === "vendorOnboardingForm"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveSection("vendorOnboardingForm")}
              >
                Vendor Onboarding Form
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm ${
                  activeSection === "financialTerms"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveSection("financialTerms")}
              >
                Financial Terms
              </button>
            </div>

            {/* Form container with consistent styling */}
            <div
              className="form-container"
              style={{ pointerEvents: "none", opacity: "0.95" }}
            >
              {/* Vendor Onboarding Form (grouped first three sections) */}
              {activeSection === "vendorOnboardingForm" && (
                <div className="vendor-onboarding-container space-y-6">
                  {/* General Details Section */}
                  <div className="general-details-container">
                    <h3 className="text-lg font-medium mb-4">
                      General Details
                    </h3>
                    <GeneralDetailsSection
                      data={formattedVendorData.generalDetails}
                      errors={errors}
                      touched={touched}
                      onChange={handleChange}
                      onCheckboxChange={handleCheckboxChange}
                      onBlur={handleBlur}
                    />
                  </div>

                  {/* Trading Terms Section */}
                  <div className="trading-terms-container mt-6">
                    <h3 className="text-lg font-medium mb-4">Trading Terms</h3>
                    <TradingTermsSection
                      data={formattedVendorData.tradingTerms}
                      vendorType={formattedVendorData.generalDetails.vendorType}
                      errors={errors}
                      touched={touched}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>

                  {/* Supply Terms Section */}
                  <div className="supplier-form-container mt-6">
                    <h3 className="text-lg font-medium mb-4">Supply Terms</h3>
                    <SupplyTermsSection
                      data={formattedVendorData.supplyTerms}
                      errors={errors}
                      touched={touched}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                    {/* Supply Terms Section */}
                    <div className="financial-terms-container">
                  <h3 className="text-lg font-medium mb-4">Financial Terms</h3>
                  <FinancialTermsSection
                    data={formattedVendorData.financialTerms}
                    vendorType={formattedVendorData.generalDetails.vendorType}
                    errors={errors}
                    touched={touched}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    />
                  </div>
                </div>
              )}

              {/* Financial Terms Section */}
              {activeSection === "supplierforn" && (
                <div className="financial-terms-container">
                  <h3 className="text-lg font-medium mb-4">Supplier Form</h3>
                  <FinancialTermsSection
                    data={formattedVendorData.financialTerms}
                    vendorType={formattedVendorData.generalDetails.vendorType}
                    errors={errors}
                    touched={touched}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Right column: Approval Flow - Takes up 1/3 of the space */}
        <div className="approval-flow bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Approval Flow</h2>

          {vendorData.crb7c_statuscode &&
            vendorData.crb7c_statuscode !== "Declined" &&
            vendorData.crb7c_statuscode !== "Invitation sent" && (
              <div className="approval-steps space-y-8">
                {/* Step 1: Manager Approval */}
                <div
                  className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
                    isStatus(
                      vendorData.crb7c_statuscode,
                      "Pending Manager Approval"
                    )
                      ? "border-blue-500 bg-blue-50"
                      : isStatus(vendorData.crb7c_statuscode, [
                          "Pending CFO Approval",
                          "Pending Exco Approval",
                          "Creation approved",
                        ])
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <h3 className="font-medium mb-1">Step 1: Manager Approval</h3>
                  <div className="flex items-center">
                    <span>Status: </span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        isStatus(
                          vendorData.crb7c_statuscode,
                          "Pending Manager Approval"
                        )
                          ? "bg-blue-100 text-blue-700"
                          : isStatus(vendorData.crb7c_statuscode, [
                              "Pending CFO Approval",
                              "Pending Exco Approval",
                              "Creation approved",
                            ])
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {isStatus(
                        vendorData.crb7c_statuscode,
                        "Pending Manager Approval"
                      )
                        ? "Pending Manager Approval"
                        : isStatus(vendorData.crb7c_statuscode, [
                            "Pending CFO Approval",
                            "Pending Exco Approval",
                            "Creation approved",
                          ])
                        ? "Approved"
                        : "Pending"}
                    </span>
                  </div>
                  {!isStatus(vendorData.crb7c_statuscode, [
                    "Pending CFO Approval",
                    "Pending Exco Approval",
                    "Creation approved",
                  ]) && (
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-300 border-r-[8px] border-r-transparent"></div>
                    </div>
                  )}
                </div>

                {/* Step 2: CFO Approval - only show if required */}
                {requiresCFOApproval && (
                  <div
                    className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
                      isStatus(
                        vendorData.crb7c_statuscode,
                        "Pending CFO Approval"
                      )
                        ? "border-blue-500 bg-blue-50"
                        : isStatus(vendorData.crb7c_statuscode, [
                            "Pending Exco Approval",
                            "Creation approved",
                          ])
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <h3 className="font-medium mb-1">Step 2: CFO Approval</h3>
                    <div className="flex items-center">
                      <span>Status: </span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          isStatus(
                            vendorData.crb7c_statuscode,
                            "Pending CFO Approval"
                          )
                            ? "bg-blue-100 text-blue-700"
                            : isStatus(vendorData.crb7c_statuscode, [
                                "Pending Exco Approval",
                                "Creation approved",
                              ])
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {isStatus(
                          vendorData.crb7c_statuscode,
                          "Pending CFO Approval"
                        )
                          ? "Pending CFO Approval"
                          : isStatus(vendorData.crb7c_statuscode, [
                              "Pending Exco Approval",
                              "Creation approved",
                            ])
                          ? "Approved"
                          : "Pending"}
                      </span>
                    </div>
                    {!isStatus(vendorData.crb7c_statuscode, [
                      "Pending Exco Approval",
                      "Creation approved",
                    ]) && (
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-300 border-r-[8px] border-r-transparent"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Exco Approval */}
                <div
                  className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
                    isStatus(
                      vendorData.crb7c_statuscode,
                      "Pending Exco Approval"
                    )
                      ? "border-blue-500 bg-blue-50"
                      : isStatus(
                          vendorData.crb7c_statuscode,
                          "Creation approved"
                        )
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <h3 className="font-medium mb-1">
                    Step {requiresCFOApproval ? "3" : "2"}: Exco Approval
                  </h3>
                  <div className="flex items-center">
                    <span>Status: </span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        isStatus(
                          vendorData.crb7c_statuscode,
                          "Pending Exco Approval"
                        )
                          ? "bg-blue-100 text-blue-700"
                          : isStatus(
                              vendorData.crb7c_statuscode,
                              "Creation approved"
                            )
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {isStatus(
                        vendorData.crb7c_statuscode,
                        "Pending Exco Approval"
                      )
                        ? "Pending Exco Approval"
                        : isStatus(
                            vendorData.crb7c_statuscode,
                            "Creation approved"
                          )
                        ? "Approved"
                        : "Pending"}
                    </span>
                  </div>
                  {!isStatus(
                    vendorData.crb7c_statuscode,
                    "Creation approved"
                  ) && (
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-300 border-r-[8px] border-r-transparent"></div>
                    </div>
                  )}
                </div>

                {/* Step 4: Completed */}
                <div
                  className={`approval-step p-4 border-l-4 rounded shadow-sm ${
                    isStatus(vendorData.crb7c_statuscode, "Creation approved")
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <h3 className="font-medium mb-1">
                    Step {requiresCFOApproval ? "4" : "3"}: Completed
                  </h3>
                  <div className="flex items-center">
                    <span>Status: </span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        isStatus(
                          vendorData.crb7c_statuscode,
                          "Creation approved"
                        )
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {isStatus(
                        vendorData.crb7c_statuscode,
                        "Creation approved"
                      )
                        ? "Creation approved"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* Show decline message when status is Declined */}
          {vendorData.crb7c_statuscode === "Declined" && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <h3 className="text-red-700 font-medium">Declined</h3>
              <p className="text-sm text-gray-700 mt-2">Reason for decline:</p>
              <p className="text-sm italic mt-1">
                {vendorData.crb7c_approvalcomment || "No reason provided"}
              </p>
            </div>
          )}

          {/* Action buttons based on status and permissions */}
          {canApprove &&
            vendorData.crb7c_statuscode &&
            !isStatus(vendorData.crb7c_statuscode, [
              "Creation approved",
              "Declined",
              "Invitation sent",
            ]) && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : null}
                  {isSubmitting ? "Processing..." : "Approve"}
                </button>
                <button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium"
                  onClick={handleDecline}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Decline"}
                </button>
              </div>
            )}

          {/* Resubmit button for declined status */}
          {vendorData.crb7c_statuscode === "Declined" && (
            <button
              type="button"
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
              onClick={() =>
                alert("Resubmit functionality would be implemented here")
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Re-submit"}
            </button>
          )}

          {/* Delete button for Invitation sent status */}
          {vendorData.crb7c_statuscode === "Invitation sent" && (
            <button
              type="button"
              className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Delete"}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">
              Would you like to proceed?
            </h2>
            <p className="mb-6">
              Are you sure you want to approve this vendor?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setShowConfirmation(false)}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={confirmApproval}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Popup */}
      {showDeclinePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">
              Are you sure you want to decline?
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please provide a reason:
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md h-24"
                value={declineComment}
                onChange={(e) => setDeclineComment(e.target.value)}
                placeholder="Enter your comment here..."
              ></textarea>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDeclinePopup(false)}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={confirmDecline}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">
              Are you sure you want to DELETE this request?
            </h2>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  alert("Delete functionality would be implemented here");
                  router.push("/");
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Thank you!</h2>
            <p className="mb-6">{successMessage}</p>
            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={handleSuccessClose}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
