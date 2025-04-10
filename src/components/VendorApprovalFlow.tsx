"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import GeneralDetailsSection from "@/components/forms/GeneralDetailSection";
import SupplyTermsSection from "@/components/forms/SupplyTermSection";
import { TradingTermsSection } from "./forms/TradingTermSection";
import { FinancialTermsSection } from "./forms/FinancialTermSection";
import SupplierForm from "@/components/forms/SupplierForm";

// Define types for approval states
type ApprovalStatus =
  | "Review"
  | "Procurement Approval"
  | "Manager Approval"
  | "Finance Approval"
  | "Exco Approval"
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
  [key: string]: any;
}

export default function VendorApprovalFlow() {
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
  });

  const [supplierData, setSupplierData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeclinePopup, setShowDeclinePopup] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [declineComment, setDeclineComment] = useState("");
  const [requiresFinanceApproval, setRequiresFinanceApproval] = useState(true);
  const [canApprove, setCanApprove] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [activeSection, setActiveSection] = useState<string>(
    "vendorOnboardingForm"
  );
  const [userRole, setUserRole] = useState<string>(""); // requester, procurement, manager, finance, exco
  const [isEditable, setIsEditable] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    if (email && session?.accessToken) {
      fetchVendorData(email);
      fetchSupplierData(email);
    }
  }, [email, session?.accessToken]);

  // Determine if form should be editable based on user role and status
  useEffect(() => {
    if (session?.user?.email && vendorData.crb7c_statuscode) {
      const userEmail = session.user.email;

      // Check if user is the requester
      const isRequester = userEmail === vendorData.crb7c_poemail;

      // Only allow editing if user is requester and status is Review or Declined
      const canEdit =
        isRequester &&
        (vendorData.crb7c_statuscode === "Review" ||
          vendorData.crb7c_statuscode === "Declined");

      setIsEditable(canEdit);

      // Determine user role
      if (isRequester) {
        setUserRole("requester");
      } else {
        // This is a simplified example - in real implementation you'd check against actual approver records
        const approverRoles = {
          "procurement@example.com": "procurement",
          "manager@example.com": "manager",
          "finance@example.com": "finance",
          "exco@example.com": "exco",
        };

        setUserRole(approverRoles[userEmail] || "");
      }
    }
  }, [session?.user?.email, vendorData]);

  // Fetch vendor data from API
  const fetchVendorData = async (vendorEmail: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/vendors?email=${encodeURIComponent(vendorEmail)}`
      );

      if (response.data && response.data.length > 0) {
        const vendor = response.data[0];

        // Payment terms that require Finance approval
        const financeApprovalTerms = [
          "1 DAY",
          "10 DAYS",
          "13 DAYS",
          "14 DAYS",
          "15 DAYS",
          "20 DAYS",
          "21 DAYS",
          "20 EOM",
        ];

        const needsFinanceApproval = financeApprovalTerms.includes(
          vendor.crb7c_paymentterms?.toUpperCase()
        );
        setRequiresFinanceApproval(needsFinanceApproval);

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
                .map((item: string) => item.trim());

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

  // Fetch supplier form data
  const fetchSupplierData = async (vendorEmail: string) => {
    try {
      // Check if contactid is available from vendorData or provided in the URL
      const contactId = vendorData.contactid || searchParams?.get("contactid");

      if (contactId) {
        const response = await axios.get(`/api/supplier/${contactId}`);
        if (response.data) {
          setSupplierData(response.data);
        }
      } else {
        console.log("Contact ID not available, can't fetch supplier data yet");
      }
    } catch (error) {
      console.error("Error fetching supplier data:", error);
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
      // Get current user email
      const userEmail = session.user.email;

      // Get approvers for this business unit (in real app, fetch from API)
      // Here we're creating a mock implementation
      const mockApprovers = {
        procurement: "n.liang@lagardereawpl.com",
        manager: "n.liang@lagardereawpl.com",
        finance: "n.liang@lagardereawpl.com",
        exco: "n.liang@lagardereawpl.com",
      };

      let hasApprovalRights = false;

      switch (statusCode) {
        case "Review":
          // Only requester can see/edit in this status
          hasApprovalRights = false;
          break;
        case "Procurement Approval":
          hasApprovalRights = userEmail === userEmail;
          break;
        case "Manager Approval":
          hasApprovalRights = userEmail === userEmail;
          break;
        case "Finance Approval":
          hasApprovalRights = userEmail === userEmail;
          break;
        case "Exco Approval":
          hasApprovalRights = userEmail === userEmail;
          break;
        default:
          hasApprovalRights = false;
      }
      hasApprovalRights = true;
      // Set approval rights
      setCanApprove(hasApprovalRights);
      console.log("User can approve:", hasApprovalRights);
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
    // Only allow changes if the form is editable
    if (!isEditable) return;

    console.log(`Field ${field} changed to ${value}`);
    // In a real implementation, you would update the formattedVendorData state
  };

  const handleCheckboxChange = (
    field: string,
    value: string,
    checked: boolean
  ) => {
    // Only allow changes if the form is editable
    if (!isEditable) return;

    console.log(
      `Checkbox ${field} with value ${value} changed to ${
        checked ? "checked" : "unchecked"
      }`
    );
  };

  const handleBlur = (field: string) => {
    // Only track touched fields if the form is editable
    if (!isEditable) return;

    console.log(`Field ${field} blurred`);
    // In a real implementation, you would update the touched state
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

  // Get next status in approval workflow
  const getNextStatus = (
    currentStatus: ApprovalStatus
  ): ApprovalStatus | null => {
    const statusFlow: ApprovalStatus[] = [
      "Review",
      "Procurement Approval",
      "Manager Approval",
      "Finance Approval", // Only included if needed
      "Exco Approval",
      "Creation approved",
    ];

    // If finance approval is not required, remove it from the flow
    const adjustedFlow = requiresFinanceApproval
      ? statusFlow
      : statusFlow.filter((status) => status !== "Finance Approval");

    const currentIndex = adjustedFlow.indexOf(currentStatus);

    if (currentIndex < adjustedFlow.length - 1) {
      return adjustedFlow[currentIndex + 1];
    }

    return null;
  };

  // Confirm approval
  const confirmApproval = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmation(false);

      const currentStatus = vendorData.crb7c_statuscode as ApprovalStatus;
      const newStatus = getNextStatus(currentStatus);

      if (!newStatus) {
        throw new Error("Invalid approval flow state");
      }

      // In a real implementation, make API call to update status
      // For now, we'll just update the local state
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

      // In a real implementation, make API call to update status
      // For now, we'll just update the local state
      setVendorData({
        ...vendorData,
        crb7c_statuscode: "Declined",
        crb7c_approvalcomment: declineComment,
      });

      // Show success popup
      setSuccessMessage(
        "Vendor has been declined. The requester will be notified."
      );
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

  // Handle form submission for requester edits
  const handleRequesterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // In a real implementation, you would validate the form data
      // and make an API call to update the vendor data

      // Then update the status back to the first approval step
      setVendorData({
        ...vendorData,
        crb7c_statuscode: "Procurement Approval",
        crb7c_approvalcomment: "", // Clear any previous decline comments
      });

      // Show success message
      setSuccessMessage("Form has been resubmitted for approval.");
      setShowSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit form. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

      {/* Form status notification */}
      {vendorData.crb7c_statuscode && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            vendorData.crb7c_statuscode === "Declined"
              ? "bg-red-50 border-l-4 border-red-500"
              : vendorData.crb7c_statuscode === "Creation approved"
              ? "bg-green-50 border-l-4 border-green-500"
              : "bg-blue-50 border-l-4 border-blue-500"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {vendorData.crb7c_statuscode === "Declined" ? (
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : vendorData.crb7c_statuscode === "Creation approved" ? (
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3
                className={`text-sm font-medium ${
                  vendorData.crb7c_statuscode === "Declined"
                    ? "text-red-800"
                    : vendorData.crb7c_statuscode === "Creation approved"
                    ? "text-green-800"
                    : "text-blue-800"
                }`}
              >
                Current Status: {vendorData.crb7c_statuscode}
              </h3>
              <div className="mt-2 text-sm">
                {vendorData.crb7c_statuscode === "Declined" &&
                  vendorData.crb7c_approvalcomment && (
                    <p className="text-red-700">
                      Decline reason: {vendorData.crb7c_approvalcomment}
                    </p>
                  )}
                {isEditable && (
                  <p className="text-blue-700 font-medium mt-1">
                    You can edit and resubmit this form.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  activeSection === "supplierForm"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveSection("supplierForm")}
              >
                Supplier Form
              </button>
            </div>

            {/* Form container */}
            <div
              className="form-container"
              style={{
                pointerEvents: isEditable ? "auto" : "none",
                opacity: isEditable ? "1" : "0.9",
              }}
            >
              {/* Vendor Onboarding Form */}
              {activeSection === "vendorOnboardingForm" && (
                <form onSubmit={handleRequesterSubmit}>
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
                      <h3 className="text-lg font-medium mb-4">
                        Trading Terms
                      </h3>
                      <TradingTermsSection
                        data={formattedVendorData.tradingTerms}
                        vendorType={
                          formattedVendorData.generalDetails.vendorType
                        }
                        errors={errors}
                        touched={touched}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    {/* Supply Terms Section */}
                    <div className="supply-terms-container mt-6">
                      <h3 className="text-lg font-medium mb-4">Supply Terms</h3>
                      <SupplyTermsSection
                        data={formattedVendorData.supplyTerms}
                        errors={errors}
                        touched={touched}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    {/* Financial Terms Section */}
                    <div className="financial-terms-container">
                      <h3 className="text-lg font-medium mb-4">
                        Financial Terms
                      </h3>
                      <FinancialTermsSection
                        data={formattedVendorData.financialTerms}
                        vendorType={
                          formattedVendorData.generalDetails.vendorType
                        }
                        errors={errors}
                        touched={touched}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                  </div>

                  {/* Submit button - only for requester in editable mode */}
                  {isEditable && (
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
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
                            Processing...
                          </div>
                        ) : (
                          "Resubmit for Approval"
                        )}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Supplier Form */}
              {activeSection === "supplierForm" && (
                <div className="supplier-form-container">
                  {/* Include SupplierForm component with data and contactid */}
                  {vendorData.contactid ? (
                    <SupplierForm
                      contactid={vendorData.contactid}
                      initialData={supplierData}
                      readOnly={!isEditable}
                    />
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500">
                        No supplier data available for this vendor.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

 {/* Right column: Approval Flow - Takes up 1/3 of the space */}
<div className="approval-flow bg-white shadow rounded-lg p-6">
  <h2 className="text-xl font-semibold mb-6">Approval Flow</h2>

  {vendorData.crb7c_statuscode && (
    <div className="approval-steps space-y-8">
      {/* Step 1: Review */}
      <div
        className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
          isStatus(vendorData.crb7c_statuscode, "Review")
            ? "border-blue-500 bg-blue-50"
            : isStatus(vendorData.crb7c_statuscode, [
                "Procurement Approval",
                "Manager Approval",
                "Finance Approval",
                "Exco Approval",
                "Creation approved",
              ])
            ? "border-green-500 bg-green-50"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <h3 className="font-medium mb-1">Step 1: Review</h3>
        <div className="flex items-center">
          <span>Status: </span>
          <span
            className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
              isStatus(vendorData.crb7c_statuscode, "Review")
                ? "bg-blue-100 text-blue-700"
                : isStatus(vendorData.crb7c_statuscode, [
                    "Procurement Approval",
                    "Manager Approval",
                    "Finance Approval",
                    "Exco Approval",
                    "Creation approved",
                  ])
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {isStatus(vendorData.crb7c_statuscode, "Review")
              ? "In Review"
              : isStatus(vendorData.crb7c_statuscode, [
                  "Procurement Approval",
                  "Manager Approval",
                  "Finance Approval",
                  "Exco Approval",
                  "Creation approved",
                ])
              ? "Approved"
              : "Pending"}
          </span>
        </div>
        {isStatus(vendorData.crb7c_statuscode, "Review") && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-300 border-r-[8px] border-r-transparent"></div>
          </div>
        )}
      </div>

      {/* Step 2: Procurement Approval */}
      <div
        className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
          isStatus(vendorData.crb7c_statuscode, "Procurement Approval")
            ? "border-blue-500 bg-blue-50"
            : isStatus(vendorData.crb7c_statuscode, [
                "Manager Approval",
                "Finance Approval",
                "Exco Approval",
                "Creation approved",
              ])
            ? "border-green-500 bg-green-50"
            : isStatus(vendorData.crb7c_statuscode, "Review")
            ? "border-gray-300 bg-gray-50"
            : "hidden"
        }`}
      >
        <h3 className="font-medium mb-1">
          Step 2: Procurement Approval
        </h3>
        <div className="flex items-center">
          <span>Status: </span>
          <span
            className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
              isStatus(
                vendorData.crb7c_statuscode,
                "Procurement Approval"
              )
                ? "bg-blue-100 text-blue-700"
                : isStatus(vendorData.crb7c_statuscode, [
                    "Manager Approval",
                    "Finance Approval",
                    "Exco Approval",
                    "Creation approved",
                  ])
                ? "bg-green-100 text-green-700"
                : isStatus(vendorData.crb7c_statuscode, "Review")
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {isStatus(
              vendorData.crb7c_statuscode,
              "Procurement Approval"
            )
              ? "Pending Approval"
              : isStatus(vendorData.crb7c_statuscode, [
                  "Manager Approval",
                  "Finance Approval",
                  "Exco Approval",
                  "Creation approved",
                ])
              ? "Approved"
              : isStatus(vendorData.crb7c_statuscode, "Review")
              ? "Pending"
              : "Not Started"}
          </span>
        </div>
        {isStatus(vendorData.crb7c_statuscode, "Procurement Approval") && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-300 border-r-[8px] border-r-transparent"></div>
          </div>
        )}
      </div>

      {/* Step 3: Manager Approval */}
      <div
        className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
          isStatus(vendorData.crb7c_statuscode, "Manager Approval")
            ? "border-blue-500 bg-blue-50"
            : isStatus(vendorData.crb7c_statuscode, [
                "Finance Approval",
                "Exco Approval",
                "Creation approved",
              ])
            ? "border-green-500 bg-green-50"
            : isStatus(vendorData.crb7c_statuscode, ["Review", "Procurement Approval"])
            ? "border-gray-300 bg-gray-50"
            : "hidden"
        }`}
      >
        <h3 className="font-medium mb-1">Step 3: Manager Approval</h3>
        <div className="flex items-center">
          <span>Status: </span>
          <span
            className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
              isStatus(vendorData.crb7c_statuscode, "Manager Approval")
                ? "bg-blue-100 text-blue-700"
                : isStatus(vendorData.crb7c_statuscode, [
                    "Finance Approval",
                    "Exco Approval",
                    "Creation approved",
                  ])
                ? "bg-green-100 text-green-700"
                : isStatus(vendorData.crb7c_statuscode, [
                    "Review",
                    "Procurement Approval",
                  ])
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {isStatus(vendorData.crb7c_statuscode, "Manager Approval")
              ? "Pending Approval"
              : isStatus(vendorData.crb7c_statuscode, [
                  "Finance Approval",
                  "Exco Approval",
                  "Creation approved",
                ])
              ? "Approved"
              : isStatus(vendorData.crb7c_statuscode, [
                  "Review",
                  "Procurement Approval",
                ])
              ? "Pending"
              : "Not Started"}
          </span>
        </div>
        {isStatus(vendorData.crb7c_statuscode, "Manager Approval") && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-300 border-r-[8px] border-r-transparent"></div>
          </div>
        )}
      </div>

      {/* Step 4: Finance Approval - conditional based on payment terms */}
      {requiresFinanceApproval && (
        <div
          className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
            isStatus(vendorData.crb7c_statuscode, "Finance Approval")
              ? "border-blue-500 bg-blue-50"
              : isStatus(vendorData.crb7c_statuscode, [
                  "Exco Approval",
                  "Creation approved",
                ])
              ? "border-green-500 bg-green-50"
              : isStatus(vendorData.crb7c_statuscode, [
                  "Review", 
                  "Procurement Approval",
                  "Manager Approval"
                ])
              ? "border-gray-300 bg-gray-50"
              : "hidden"
          }`}
        >
          <h3 className="font-medium mb-1">Step 4: Finance Approval</h3>
          <div className="flex items-center">
            <span>Status: </span>
            <span
              className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                isStatus(
                  vendorData.crb7c_statuscode,
                  "Finance Approval"
                )
                  ? "bg-blue-100 text-blue-700"
                  : isStatus(vendorData.crb7c_statuscode, [
                      "Exco Approval",
                      "Creation approved",
                    ])
                  ? "bg-green-100 text-green-700"
                  : isStatus(vendorData.crb7c_statuscode, [
                      "Review",
                      "Procurement Approval",
                      "Manager Approval",
                    ])
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {isStatus(vendorData.crb7c_statuscode, "Finance Approval")
                ? "Pending Approval"
                : isStatus(vendorData.crb7c_statuscode, [
                    "Exco Approval",
                    "Creation approved",
                  ])
                ? "Approved"
                : isStatus(vendorData.crb7c_statuscode, [
                    "Review",
                    "Procurement Approval",
                    "Manager Approval",
                  ])
                ? "Pending"
                : "Not Started"}
            </span>
          </div>
          {isStatus(vendorData.crb7c_statuscode, "Finance Approval") && (
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-300 border-r-[8px] border-r-transparent"></div>
            </div>
          )}
        </div>
      )}

      {/* Step 5/4: Exco Approval */}
      <div
        className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
          isStatus(vendorData.crb7c_statuscode, "Exco Approval")
            ? "border-blue-500 bg-blue-50"
            : isStatus(vendorData.crb7c_statuscode, "Creation approved")
            ? "border-green-500 bg-green-50"
            : isStatus(vendorData.crb7c_statuscode, [
                "Review", 
                "Procurement Approval",
                "Manager Approval",
                "Finance Approval"
              ])
            ? "border-gray-300 bg-gray-50"
            : "hidden"
        }`}
      >
        <h3 className="font-medium mb-1">
          Step {requiresFinanceApproval ? "5" : "4"}: Exco Approval
        </h3>
        <div className="flex items-center">
          <span>Status: </span>
          <span
            className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
              isStatus(vendorData.crb7c_statuscode, "Exco Approval")
                ? "bg-blue-100 text-blue-700"
                : isStatus(
                    vendorData.crb7c_statuscode,
                    "Creation approved"
                  )
                ? "bg-green-100 text-green-700"
                : isStatus(vendorData.crb7c_statuscode, [
                    "Review",
                    "Procurement Approval",
                    "Manager Approval",
                    "Finance Approval",
                  ])
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {isStatus(vendorData.crb7c_statuscode, "Exco Approval")
              ? "Pending Approval"
              : isStatus(
                  vendorData.crb7c_statuscode,
                  "Creation approved"
                )
              ? "Approved"
              : isStatus(vendorData.crb7c_statuscode, [
                  "Review",
                  "Procurement Approval",
                  "Manager Approval",
                  "Finance Approval",
                ])
              ? "Pending"
              : "Not Started"}
          </span>
        </div>
        {isStatus(vendorData.crb7c_statuscode, "Exco Approval") && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-300 border-r-[8px] border-r-transparent"></div>
          </div>
        )}
      </div>

      {/* Final Step: Completed */}
      <div
        className={`approval-step p-4 border-l-4 rounded shadow-sm ${
          isStatus(vendorData.crb7c_statuscode, "Creation approved")
            ? "border-green-500 bg-green-50"
            : isStatus(vendorData.crb7c_statuscode, [
                "Review", 
                "Procurement Approval",
                "Manager Approval",
                "Finance Approval",
                "Exco Approval"
              ])
            ? "border-gray-300 bg-gray-50"
            : "hidden"
        }`}
      >
        <h3 className="font-medium mb-1">
          Step {requiresFinanceApproval ? "6" : "5"}: Completed
        </h3>
        <div className="flex items-center">
          <span>Status: </span>
          <span
            className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
              isStatus(vendorData.crb7c_statuscode, "Creation approved")
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {isStatus(vendorData.crb7c_statuscode, "Creation approved")
              ? "Completed"
              : "Pending"}
          </span>
        </div>
      </div>
    </div>
  )}

  {/* Show decline message when status is Declined */}
  {vendorData.crb7c_statuscode === "Declined" && (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-6">
      <h3 className="text-red-700 font-medium">Declined</h3>
      <p className="text-sm text-gray-700 mt-2">Reason for decline:</p>
      <p className="text-sm italic mt-1">
        {vendorData.crb7c_approvalcomment || "No reason provided"}
      </p>
    </div>
  )}

  {/* Current status highlight box */}
  {vendorData.crb7c_statuscode && 
   vendorData.crb7c_statuscode !== "Declined" &&
   vendorData.crb7c_statuscode !== "Creation approved" && (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-6">
      <h3 className="text-blue-700 font-medium">Current Status</h3>
      <p className="text-sm mt-1">
        {vendorData.crb7c_statuscode === "Review" ? "Under Review" :
         vendorData.crb7c_statuscode === "Procurement Approval" ? "Pending Procurement Approval" :
         vendorData.crb7c_statuscode === "Manager Approval" ? "Pending Manager Approval" :
         vendorData.crb7c_statuscode === "Finance Approval" ? "Pending Finance Approval" :
         vendorData.crb7c_statuscode === "Exco Approval" ? "Pending Exco Approval" :
         vendorData.crb7c_statuscode}
      </p>
    </div>
  )}

  {/* Action buttons based on status and permissions */}
  {canApprove &&
    vendorData.crb7c_statuscode &&
    !isStatus(vendorData.crb7c_statuscode, [
      "Creation approved",
      // "Declined",
      // "Invitation sent",
      // "Review",
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
  {isEditable && vendorData.crb7c_statuscode === "Declined" && (
    <button
      type="button"
      className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
      onClick={() =>
        document
          .querySelector("form")
          ?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          )
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

  );
}
