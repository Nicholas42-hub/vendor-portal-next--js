"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import GeneralDetailsSection from "@/components/forms/GeneralDetailSection";
import SupplyTermsSection from "@/components/forms/SupplyTermSection";
import { TradingTermsSection } from "./forms/TradingTermSection";
import { FinancialTermsSection } from "./forms/FinancialTermSection";
import SupplierForm from "@/components/forms/supplierform";

// Define types for approval states
type ApprovalStatus =
  | "Requester review"
  | "Procurement Approval"
  | "Manager Approval"
  | "Finance Approval"
  | "Exco Approval"
  | "Creation approved"
  | "Declined"
  | "Invitation Sent";

// Type definitions for VendorData
interface VendorData {
  vendor_onboarding_id?: string;
  created_on?: string;
  created_by?: string;
  modified_on?: string;
  modified_by?: string;
  vendor_home_country?: string;
  primary_trading_business_unit?: string;
  email?: string;
  business_name?: string;
  trading_name?: string;
  vendor_type?: string;
  contact_person?: string;
  contact_phone?: string;
  website_url?: string;
  postal_address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  is_gst_registered?: boolean;
  abn?: string;
  gst?: string;
  quotes_obtained?: boolean;
  quotes_obtained_reason?: string;
  quotes_pdf_url?: string;
  back_order?: boolean;
  exclusive_supply?: boolean;
  sale_or_return?: boolean;
  auth_required?: boolean;
  delivery_notice?: number;
  min_order_value?: number;
  min_order_quantity?: number;
  max_order_value?: number;
  other_comments?: string;
  payment_terms?: string;
  order_expiry_days?: number;
  gross_margin?: string;
  invoice_discount?: boolean;
  invoice_discount_value?: string;
  settlement_discount?: boolean;
  settlement_discount_value?: string;
  settlement_discount_days?: string;
  flat_rebate?: boolean;
  flat_rebate_percent?: string;
  flat_rebate_dollar?: string;
  flat_rebate_term?: string;
  growth_rebate?: boolean;
  growth_rebate_percent?: string;
  growth_rebate_dollar?: string;
  growth_rebate_term?: string;
  marketing_rebate?: boolean;
  marketing_rebate_percent?: string;
  marketing_rebate_dollar?: string;
  marketing_rebate_term?: string;
  promotional_fund?: boolean;
  promotional_fund_value?: string;
  au_invoice_currency?: string;
  au_bank_country?: string;
  au_bank_name?: string;
  au_bank_address?: string;
  au_bank_currency_code?: string;
  au_bank_clearing_code?: string;
  au_remittance_email?: string;
  au_bsb?: string;
  au_account?: string;
  nz_invoice_currency?: string;
  nz_bank_country?: string;
  nz_bank_name?: string;
  nz_bank_address?: string;
  nz_bank_currency_code?: string;
  nz_bank_clearing_code?: string;
  nz_remittance_email?: string;
  nz_bsb?: string;
  nz_account?: string;
  overseas_iban_switch?: boolean;
  overseas_iban?: string;
  overseas_swift?: string;
  biller_code?: string;
  ref_code?: string;
  vendor_setup_status?: string;
  status_code?: ApprovalStatus;
  status_code_record?: string;
  status_update_time?: string;
  approval_comment?: string;
  current_approver?: string;
  current_approver_name?: string;
  next_approver?: string;
  next_approver_name?: string;
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
      vendor_home_country: "",
      primary_trading_business_unit: "",
      email: "",
      business_name: "",
      trading_name: "",
      vendor_type: "",
      contact_person: "",
      contact_phone: "",
      website_url: "",
      postal_address: "",
      city: "",
      state: "",
      postcode: "",
      is_gst_registered: false,
      abn: "",
      gst: "",
    },
    supplyTerms: {
      exclusive_supply: false,
      sale_or_return: false,
      auth_required: false,
      delivery_notice: 0,
      min_order_value: 0,
      min_order_quantity: 0,
      max_order_value: 0,
      other_comments: "",
    },
    tradingTerms: {
      quotes_obtained: false,
      quotes_obtained_reason: "",
      quotes_pdf_url: "",
      back_order: false,
    },
    financialTerms: {
      payment_terms: "",
      order_expiry_days: 0,
      gross_margin: "",
      invoice_discount: false,
      invoice_discount_value: "",
      settlement_discount: false,
      settlement_discount_value: "",
      settlement_discount_days: "",
      flat_rebate: false,
      flat_rebate_percent: "",
      flat_rebate_dollar: "",
      flat_rebate_term: "",
      growth_rebate: false,
      growth_rebate_percent: "",
      growth_rebate_dollar: "",
      growth_rebate_term: "",
      marketing_rebate: false,
      marketing_rebate_percent: "",
      marketing_rebate_dollar: "",
      marketing_rebate_term: "",
      promotional_fund: false,
      promotional_fund_value: "",
    },
    bankDetails: {
      au_invoice_currency: "",
      au_bank_country: "",
      au_bank_name: "",
      au_bank_address: "",
      au_bank_currency_code: "",
      au_bank_clearing_code: "",
      au_remittance_email: "",
      au_bsb: "",
      au_account: "",
      nz_invoice_currency: "",
      nz_bank_country: "",
      nz_bank_name: "",
      nz_bank_address: "",
      nz_bank_currency_code: "",
      nz_bank_clearing_code: "",
      nz_remittance_email: "",
      nz_bsb: "",
      nz_account: "",
      overseas_iban_switch: false,
      overseas_iban: "",
      overseas_swift: "",
      biller_code: "",
      ref_code: "",
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
    if (session?.user?.email && vendorData.status_code) {
      const userEmail = searchParams.get("email");

      // Check if user is the requester
      const isRequester = userEmail === vendorData.email;

      // Only allow editing if user is requester and status is Review or Declined
      const canEdit =
        isRequester &&
        (vendorData.status_code === "Requester review" ||
          vendorData.status_code === "Declined" ||
          vendorData.status_code === "Invitation Sent");

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

  const fetchVendorData = async (vendorEmail) => {
    try {
      setIsLoading(true);
      const email = searchParams.get("email");
      const response = await axios.get(`/api/vendor-approval/${email}`);

      const { vendor, tradingEntities_data } = response.data;

      // Payment terms that require Finance approval
      const financeApprovalTerms = ["20 EOM"];

      const needsFinanceApproval = financeApprovalTerms.includes(
        vendor.payment_terms?.toUpperCase()
      );
      setRequiresFinanceApproval(needsFinanceApproval);

      // Set vendor data
      setVendorData(vendor);

      // Format the data for form sections
      const tradingEntities = [];
      if (vendor.trading_name) {
        tradingEntities.push(vendor.trading_name);
      }

      // Fix 2: Ensure proper type conversion for numeric values
      // and handle boolean values consistently
      setFormattedVendorData({
        generalDetails: {
          tradingEntities: tradingEntities,
          vendor_home_country: vendor.vendor_home_country || "",
          primary_trading_business_unit:
            vendor.primary_trading_business_unit || "",
          email: vendor.email || "",
          business_name: vendor.business_name || "",
          trading_name: vendor.trading_name || "",
          vendor_type: vendor.vendor_type || "",
          contact_person: vendor.contact_person || "",
          contact_phone: vendor.contact_phone || "",
          website_url: vendor.website_url || "",
          postal_address: vendor.postal_address || "",
          city: vendor.city || "",
          state: vendor.state || "",
          postcode: vendor.postcode || "",
          is_gst_registered: Boolean(vendor.is_gst_registered),
          abn: vendor.abn || "",
          gst: vendor.gst || "",
        },
        supplyTerms: {
          exclusive_supply: Boolean(vendor.exclusive_supply),
          sale_or_return: Boolean(vendor.sale_or_return),
          auth_required: Boolean(vendor.auth_required),
          delivery_notice: Number(vendor.delivery_notice || 0),
          min_order_value: Number(vendor.min_order_value || 0),
          min_order_quantity: Number(vendor.min_order_quantity || 0),
          max_order_value: Number(vendor.max_order_value || 0),
          other_comments: vendor.other_comments || "",
        },
        tradingTerms: {
          quotes_obtained: Boolean(vendor.quotes_obtained),
          quotes_obtained_reason: vendor.quotes_obtained_reason || "",
          quotes_pdf_url: vendor.quotes_pdf_url || "",
          back_order: Boolean(vendor.back_order),
        },
        financialTerms: {
          payment_terms: vendor.payment_terms || "",
          order_expiry_days: Number(vendor.order_expiry_days || 0),
          gross_margin: vendor.gross_margin || "",
          invoice_discount: Boolean(vendor.invoice_discount),
          invoice_discount_value: vendor.invoice_discount_value || "",
          settlement_discount: Boolean(vendor.settlement_discount),
          settlement_discount_value: vendor.settlement_discount_value || "",
          settlement_discount_days: vendor.settlement_discount_days || "",
          flat_rebate: Boolean(vendor.flat_rebate),
          flat_rebate_percent: vendor.flat_rebate_percent || "",
          flat_rebate_dollar: vendor.flat_rebate_dollar || "",
          flat_rebate_term: vendor.flat_rebate_term || "",
          growth_rebate: Boolean(vendor.growth_rebate),
          growth_rebate_percent: vendor.growth_rebate_percent || "",
          growth_rebate_dollar: vendor.growth_rebate_dollar || "",
          growth_rebate_term: vendor.growth_rebate_term || "",
          marketing_rebate: Boolean(vendor.marketing_rebate),
          marketing_rebate_percent: vendor.marketing_rebate_percent || "",
          marketing_rebate_dollar: vendor.marketing_rebate_dollar || "",
          marketing_rebate_term: vendor.marketing_rebate_term || "",
          promotional_fund: Boolean(vendor.promotional_fund),
          promotional_fund_value: vendor.promotional_fund_value || "",
        },
        bankDetails: {
          au_invoice_currency: vendor.au_invoice_currency || "",
          au_bank_country: vendor.au_bank_country || "",
          au_bank_name: vendor.au_bank_name || "",
          au_bank_address: vendor.au_bank_address || "",
          au_bank_currency_code: vendor.au_bank_currency_code || "",
          au_bank_clearing_code: vendor.au_bank_clearing_code || "",
          au_remittance_email: vendor.au_remittance_email || "",
          au_bsb: vendor.au_bsb || "",
          au_account: vendor.au_account || "",
          nz_invoice_currency: vendor.nz_invoice_currency || "",
          nz_bank_country: vendor.nz_bank_country || "",
          nz_bank_name: vendor.nz_bank_name || "",
          nz_bank_address: vendor.nz_bank_address || "",
          nz_bank_currency_code: vendor.nz_bank_currency_code || "",
          nz_bank_clearing_code: vendor.nz_bank_clearing_code || "",
          nz_remittance_email: vendor.nz_remittance_email || "",
          nz_bsb: vendor.nz_bsb || "",
          nz_account: vendor.nz_account || "",
          overseas_iban_switch: Boolean(vendor.overseas_iban_switch),
          overseas_iban: vendor.overseas_iban || "",
          overseas_swift: vendor.overseas_swift || "",
          biller_code: vendor.biller_code || "",
          ref_code: vendor.ref_code || "",
        },
      });

      // Validate approver access
      validateApproverAccess(
        vendor.status_code,
        vendor.primary_trading_business_unit
      );
    } catch (error) {
      console.error("Error fetching vendor data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch supplier form data
  const fetchSupplierData = async (vendorEmail: string) => {
    try {
      if (vendorEmail) {
        const response = await axios.get(
          `/api/supplier-onboarding/${vendorEmail}`
        );
        if (response.data) {
          setSupplierData(response.data);
        }
      } else {
        console.log(
          "Vendor email not available, can't fetch supplier data yet"
        );
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
        case "Requester review":
          // Only requester can see/edit in this status
          hasApprovalRights = userEmail === userEmail;
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
  const statusOrder: ApprovalStatus[] = [
    "Requester review",
    "Procurement Approval",
    "Manager Approval",
    "Finance Approval",
    "Exco Approval",
    "Creation approved",
  ];

  const hasReachedStatus = (target: ApprovalStatus): boolean => {
    if (!vendorData.status_code) return false;
    return (
      statusOrder.indexOf(vendorData.status_code) >= statusOrder.indexOf(target)
    );
  };
  // Form field change handlers
  const handleChange = (field: string, value: any) => {
    console.log(`Field ${field} changed to ${value}`);
    // Update the formattedVendorData state based on which section the field belongs to
    const sections = {
      vendorHomeCountry: "generalDetails",
      primaryTradingBusinessUnit: "generalDetails",
      email: "generalDetails",
      businessName: "generalDetails",
      tradingName: "generalDetails",
      vendorType: "generalDetails",
      quotesObtained: "tradingTerms",
      quotesObtainedReason: "tradingTerms",
      quotesPdf: "tradingTerms",
      backOrder: "tradingTerms",
      exclusiveSupply: "supplyTerms",
      saleOrReturn: "supplyTerms",
      authRequired: "supplyTerms",
      delivery_notice: "supplyTerms",
      minOrderValue: "supplyTerms",
      minOrderQuantity: "supplyTerms",
      maxOrderValue: "supplyTerms",
      otherComments: "supplyTerms",
      paymentTerms: "financialTerms",
      orderExpiryDays: "financialTerms",
      grossMargin: "financialTerms",
      invoiceDiscount: "financialTerms",
      invoiceDiscountValue: "financialTerms",
      settlementDiscount: "financialTerms",
      settlementDiscountValue: "financialTerms",
      settlementDiscountDays: "financialTerms",
      flatRebate: "financialTerms",
      flatRebatePercent: "financialTerms",
      flatRebateDollar: "financialTerms",
      flatRebateTerm: "financialTerms",
      growthRebate: "financialTerms",
      growthRebatePercent: "financialTerms",
      growthRebateDollar: "financialTerms",
      growthRebateTerm: "financialTerms",
      marketingRebate: "financialTerms",
      marketingRebatePercent: "financialTerms",
      marketingRebateDollar: "financialTerms",
      marketingRebateTerm: "financialTerms",
      promotionalFund: "financialTerms",
      promotionalFundValue: "financialTerms",
    };

    const section = sections[field] || "generalDetails";

    setFormattedVendorData((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value,
      },
    }));
  };
  // Handle supply terms section changes
  const handleSupplyTermsChange = (field: string, value: any) => {
    handleChange("supplyTerms", field, value);
  };
  const handleCheckboxChange = (
    field: string,
    value: string,
    checked: boolean
  ) => {
    console.log(
      `Checkbox ${field} with value ${value} changed to ${
        checked ? "checked" : "unchecked"
      }`
    );

    // Handle trading entities checkbox selection
    if (field === "tradingEntities") {
      setFormattedVendorData((prevData) => {
        const currentEntities = [...prevData.generalDetails.tradingEntities];

        if (checked) {
          // Add the entity if it's not already in the array
          if (!currentEntities.includes(value)) {
            currentEntities.push(value);
          }
        } else {
          // Remove the entity if it's in the array
          const index = currentEntities.indexOf(value);
          if (index !== -1) {
            currentEntities.splice(index, 1);
          }
        }

        return {
          ...prevData,
          generalDetails: {
            ...prevData.generalDetails,
            tradingEntities: currentEntities,
          },
        };
      });
    }
  };

  const handleBlur = (field: string) => {
    console.log(`Field ${field} blurred`);
    // Update the touched state to track which fields have been interacted with
    setTouched((prevTouched) => ({
      ...prevTouched,
      [field]: true,
    }));
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

  // Confirm deletion
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      setShowDeleteConfirmation(false);

      // Make API call to delete the vendor
      if (vendorData.email) {
        const response = await axios.delete(
          `/api/vendor-approval/${vendorData.email}`
        );

        if (!response.data.success) {
          throw new Error("Failed to delete vendor");
        }
      } else {
        throw new Error("Vendor email not found");
      }

      // Show success message
      setSuccessMessage("Vendor has been deleted successfully.");
      setShowSuccess(true);

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Failed to delete vendor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get next status in approval workflow
  const getNextStatus = (
    currentStatus: ApprovalStatus
  ): ApprovalStatus | null => {
    const statusFlow: ApprovalStatus[] = [
      "Requester review",
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

  // Updated confirmApproval function in VendorApprovalFlow.tsx

  const confirmApproval = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmation(false);

      const currentStatus = vendorData.status_code as ApprovalStatus;
      const newStatus = getNextStatus(currentStatus);

      if (!newStatus) {
        throw new Error("Invalid approval flow state");
      }

      console.log(`Updating status from ${currentStatus} to ${newStatus}`);

      // Make API call to update the status in Dynamics
      if (vendorData.email) {
        // Use correct API endpoint structure
        const response = await axios.put(
          `/api/vendor-approval/${encodeURIComponent(vendorData.email)}`,
          {
            status_code: newStatus,
          }
        );

        if (!response.data.success) {
          console.error("API error:", response.data);
          throw new Error(
            `Failed to update vendor status: ${
              response.data.error || "Unknown error"
            }`
          );
        }

        console.log("API response:", response.data);
      } else {
        throw new Error("Vendor email not found");
      }

      // Update local state
      setVendorData({ ...vendorData, status_code: newStatus });

      // Show success popup
      setSuccessMessage(`Vendor successfully moved to ${newStatus} status.`);
      setShowSuccess(true);
    } catch (error) {
      console.error("Error approving vendor:", error);
      alert(
        `Failed to approve vendor: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Similarly update confirmDecline function
  const confirmDecline = async () => {
    if (!declineComment) {
      alert("Please provide a reason for declining.");
      return;
    }

    try {
      setIsSubmitting(true);
      setShowDeclinePopup(false);

      // Make API call to update the status and decline comment in Dynamics
      if (vendorData.email) {
        const response = await axios.put(
          `/api/vendor-approval/${encodeURIComponent(vendorData.email)}`,
          {
            status_code: "Declined",
            approval_comment: declineComment,
            delivery_notice: Number(vendorData.delivery_notice),
          }
        );

        if (!response.data.success) {
          console.error("API error:", response.data);
          throw new Error(
            `Failed to update vendor status: ${
              response.data.error || "Unknown error"
            }`
          );
        }
      } else {
        throw new Error("Vendor email not found");
      }

      // Update local state
      setVendorData({
        ...vendorData,
        status_code: "Declined",
        approval_comment: declineComment,
      });

      // Show success popup
      setSuccessMessage(
        "Vendor has been declined. The requester will be notified."
      );
      setShowSuccess(true);
    } catch (error) {
      console.error("Error declining vendor:", error);
      alert(
        `Failed to decline vendor: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle success popup close
  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  // Fix 6: Update the handleRequesterSubmit function to collect and submit the form data
  const handleRequesterSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Collect form data from formattedVendorData state
      const formData = {
        // General Details
        // vendor_home_country:
        //   formattedVendorData.generalDetails.vendor_home_country,
        // primary_trading_business_unit:
        //   formattedVendorData.generalDetails.primary_trading_business_unit,
        // business_name: formattedVendorData.generalDetails.business_name,
        // trading_name: formattedVendorData.generalDetails.trading_name,
        // vendor_type: formattedVendorData.generalDetails.vendor_type,
        // contact_person: formattedVendorData.generalDetails.contact_person,
        // contact_phone: formattedVendorData.generalDetails.contact_phone,
        // website_url: formattedVendorData.generalDetails.website_url,
        // postal_address: formattedVendorData.generalDetails.postal_address,
        // city: formattedVendorData.generalDetails.city,
        // state: formattedVendorData.generalDetails.state,
        // postcode: formattedVendorData.generalDetails.postcode,
        // is_gst_registered: formattedVendorData.generalDetails.is_gst_registered,
        // abn: formattedVendorData.generalDetails.abn,
        // gst: formattedVendorData.generalDetails.gst,

        // // Supply Terms
        // exclusive_supply: formattedVendorData.supplyTerms.exclusive_supply,
        // sale_or_return: formattedVendorData.supplyTerms.sale_or_return,
        // auth_required: formattedVendorData.supplyTerms.auth_required,
        delivery_notice: formattedVendorData.supplyTerms.delivery_notice,
        // min_order_value: formattedVendorData.supplyTerms.min_order_value,
        // min_order_quantity: formattedVendorData.supplyTerms.min_order_quantity,
        // max_order_value: formattedVendorData.supplyTerms.max_order_value,
        // other_comments: formattedVendorData.supplyTerms.other_comments,

        // // Trading Terms
        // quotes_obtained: formattedVendorData.tradingTerms.quotes_obtained,
        // quotes_obtained_reason:
        //   formattedVendorData.tradingTerms.quotes_obtained_reason,
        // quotes_pdf_url: formattedVendorData.tradingTerms.quotes_pdf_url,
        // back_order: formattedVendorData.tradingTerms.back_order,

        // // Financial Terms
        // payment_terms: formattedVendorData.financialTerms.payment_terms,
        // order_expiry_days: formattedVendorData.financialTerms.order_expiry_days,
        // gross_margin: formattedVendorData.financialTerms.gross_margin,
        // invoice_discount: formattedVendorData.financialTerms.invoice_discount,
        // invoice_discount_value:
        //   formattedVendorData.financialTerms.invoice_discount_value,
        // settlement_discount:
        //   formattedVendorData.financialTerms.settlement_discount,
        // settlement_discount_value:
        //   formattedVendorData.financialTerms.settlement_discount_value,
        // settlement_discount_days:
        //   formattedVendorData.financialTerms.settlement_discount_days,
        // flat_rebate: formattedVendorData.financialTerms.flat_rebate,
        // flat_rebate_percent:
        //   formattedVendorData.financialTerms.flat_rebate_percent,
        // flat_rebate_dollar:
        //   formattedVendorData.financialTerms.flat_rebate_dollar,
        // flat_rebate_term: formattedVendorData.financialTerms.flat_rebate_term,
        // growth_rebate: formattedVendorData.financialTerms.growth_rebate,
        // growth_rebate_percent:
        //   formattedVendorData.financialTerms.growth_rebate_percent,
        // growth_rebate_dollar:
        //   formattedVendorData.financialTerms.growth_rebate_dollar,
        // growth_rebate_term:
        //   formattedVendorData.financialTerms.growth_rebate_term,
        // marketing_rebate: formattedVendorData.financialTerms.marketing_rebate,
        // marketing_rebate_percent:
        //   formattedVendorData.financialTerms.marketing_rebate_percent,
        // marketing_rebate_dollar:
        //   formattedVendorData.financialTerms.marketing_rebate_dollar,
        // marketing_rebate_term:
        //   formattedVendorData.financialTerms.marketing_rebate_term,
        // promotional_fund: formattedVendorData.financialTerms.promotional_fund,
        // promotional_fund_value:
        //   formattedVendorData.financialTerms.promotional_fund_value,

        // // Bank Details
        // au_invoice_currency:
        //   formattedVendorData.bankDetails.au_invoice_currency,
        // au_bank_country: formattedVendorData.bankDetails.au_bank_country,
        // au_bank_name: formattedVendorData.bankDetails.au_bank_name,
        // au_bank_address: formattedVendorData.bankDetails.au_bank_address,
        // au_bank_currency_code:
        //   formattedVendorData.bankDetails.au_bank_currency_code,
        // au_bank_clearing_code:
        //   formattedVendorData.bankDetails.au_bank_clearing_code,
        // au_remittance_email:
        //   formattedVendorData.bankDetails.au_remittance_email,
        // au_bsb: formattedVendorData.bankDetails.au_bsb,
        // au_account: formattedVendorData.bankDetails.au_account,
        // nz_invoice_currency:
        //   formattedVendorData.bankDetails.nz_invoice_currency,
        // nz_bank_country: formattedVendorData.bankDetails.nz_bank_country,
        // nz_bank_name: formattedVendorData.bankDetails.nz_bank_name,
        // nz_bank_address: formattedVendorData.bankDetails.nz_bank_address,
        // nz_bank_currency_code:
        //   formattedVendorData.bankDetails.nz_bank_currency_code,
        // nz_bank_clearing_code:
        //   formattedVendorData.bankDetails.nz_bank_clearing_code,
        // nz_remittance_email:
        //   formattedVendorData.bankDetails.nz_remittance_email,
        // nz_bsb: formattedVendorData.bankDetails.nz_bsb,
        // nz_account: formattedVendorData.bankDetails.nz_account,
        // overseas_iban_switch:
        //   formattedVendorData.bankDetails.overseas_iban_switch,
        // overseas_iban: formattedVendorData.bankDetails.overseas_iban,
        // overseas_swift: formattedVendorData.bankDetails.overseas_swift,
        // biller_code: formattedVendorData.bankDetails.biller_code,
        // ref_code: formattedVendorData.bankDetails.ref_code,
      };

      // Make API call to update the status and form data
      if (vendorData.email) {
        const response = await axios.put(
          `/api/vendor-approval/${vendorData.email}`,
          {
            delivery_notice: formattedVendorData.supplyTerms.delivery_notice,
            status_code: "Procurement Approval",
            approval_comment: "", // Clear any previous decline comments
          }
        );

        if (!response.data.success) {
          throw new Error("Failed to update vendor data");
        }
      } else {
        throw new Error("Vendor email not found");
      }

      // Update local state
      setVendorData({
        ...vendorData,
        ...formData,
        status_code: "Procurement Approval",
        approval_comment: "",
      });

      // Show success message
      setSuccessMessage("Form has been resubmitted for approval.");
      setShowSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
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
      {vendorData.status_code && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            vendorData.status_code === "Declined"
              ? "bg-red-50 border-l-4 border-red-500"
              : vendorData.status_code === "Creation approved"
              ? "bg-green-50 border-l-4 border-green-500"
              : "bg-blue-50 border-l-4 border-blue-500"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {vendorData.status_code === "Declined" ? (
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
              ) : vendorData.status_code === "Creation approved" ? (
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
                  vendorData.status_code === "Declined"
                    ? "text-red-800"
                    : vendorData.status_code === "Creation approved"
                    ? "text-green-800"
                    : "text-blue-800"
                }`}
              >
                Current Status: {vendorData.status_code}
              </h3>
              <div className="mt-2 text-sm">
                {vendorData.status_code === "Declined" &&
                  vendorData.approval_comment && (
                    <p className="text-red-700">
                      Decline reason: {vendorData.approval_comment}
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
        {/* Left column: Forms */}
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

            {/* Form container with conditional styling */}
            <div
              className="form-container"
              style={{
                opacity: isEditable ? "1" : "0.9",
              }}
            >
              {activeSection === "vendorOnboardingForm" && (
                <form onSubmit={handleRequesterSubmit}>
                  <div className="vendor-onboarding-container space-y-6">
                    {/* General Details Section */}
                    <div className="general-details-container">
                      <GeneralDetailsSection
                        data={formattedVendorData.generalDetails}
                        errors={errors}
                        touched={touched}
                        onChange={isEditable ? handleChange : undefined}
                        onCheckboxChange={
                          isEditable ? handleCheckboxChange : undefined
                        }
                        onBlur={isEditable ? handleBlur : undefined}
                        isEditable={isEditable}
                      />
                    </div>
                    {/* Trading Terms Section */}
                    <div className="trading-terms-container mt-6">
                      <TradingTermsSection
                        data={formattedVendorData.tradingTerms}
                        vendorType={
                          formattedVendorData.generalDetails.vendor_type
                        }
                        errors={errors}
                        touched={touched}
                        onChange={isEditable ? handleChange : undefined}
                        onBlur={isEditable ? handleBlur : undefined}
                        isEditable={isEditable}
                      />
                    </div>
                    {/* Supply Terms Section */}
                    <div className="supply-terms-container mt-6">
                      <SupplyTermsSection
                        data={formattedVendorData.supplyTerms}
                        errors={errors}
                        touched={touched}
                        onChange={isEditable ? handleChange : undefined}
                        onBlur={isEditable ? handleBlur : undefined}
                        isEditable={isEditable}
                      />
                    </div>
                    {/* Financial Terms Section */}
                    <div className="financial-terms-container">
                      <FinancialTermsSection
                        data={formattedVendorData.financialTerms}
                        vendorType={
                          formattedVendorData.generalDetails.vendor_type
                        }
                        errors={errors}
                        touched={touched}
                        onChange={isEditable ? handleChange : undefined}
                        onBlur={isEditable ? handleBlur : undefined}
                        isEditable={isEditable}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>
                </form>
              )}
              {activeSection === "supplierForm" && (
                <div className="supplier-form-container">
                  {vendorData.email ? (
                    <SupplierForm
                      isEditable={isEditable}
                      email={vendorData.email}
                      onDataChange={(data) => {
                        // Optional: Handle supplier form data changes if needed
                        console.log("Supplier form data updated:", data);
                      }}
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

        {/* Right column: Approval Flow */}
        <div className="approval-flow bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Approval Flow</h2>

          {vendorData.status_code && (
            <div className="approval-steps space-y-8">
              {/* Only show statuses that are current or have been reached */}

              {/* Step 1: Review */}
              <div
                className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
                  isStatus(vendorData.status_code, "Requester review")
                    ? "border-blue-500 bg-blue-50" // Current status
                    : hasReachedStatus("Procurement Approval")
                    ? "border-green-500 bg-green-50" // Past status
                    : "hidden" // Future status - hidden
                }`}
              >
                <h3 className="font-medium mb-1">Step 1: Requester review</h3>
                <div className="flex items-center">
                  <span>Status: </span>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      isStatus(vendorData.status_code, "Requester review")
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {isStatus(vendorData.status_code, "Requester review")
                      ? "In Progress"
                      : "Completed"}
                  </span>
                </div>
              </div>

              {/* Step 2: Procurement Approval */}
              <div
                className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
                  isStatus(vendorData.status_code, "Procurement Approval")
                    ? "border-blue-500 bg-blue-50" // Current status
                    : hasReachedStatus("Manager Approval")
                    ? "border-green-500 bg-green-50" // Past status
                    : !hasReachedStatus("Procurement Approval")
                    ? "hidden" // Future status - hidden
                    : "border-gray-300 bg-gray-50" // Upcoming status (showing only the next one)
                }`}
              >
                <h3 className="font-medium mb-1">
                  Step 2: Procurement Approval
                </h3>
                <div className="flex items-center">
                  <span>Status: </span>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      isStatus(vendorData.status_code, "Procurement Approval")
                        ? "bg-blue-100 text-blue-800"
                        : hasReachedStatus("Manager Approval")
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isStatus(vendorData.status_code, "Procurement Approval")
                      ? "In Progress"
                      : hasReachedStatus("Manager Approval")
                      ? "Completed"
                      : "Pending"}
                  </span>
                </div>
              </div>

              {/* Step 3: Manager Approval */}
              <div
                className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
                  isStatus(vendorData.status_code, "Manager Approval")
                    ? "border-blue-500 bg-blue-50" // Current status
                    : hasReachedStatus("Finance Approval") ||
                      (hasReachedStatus("Exco Approval") &&
                        !requiresFinanceApproval)
                    ? "border-green-500 bg-green-50" // Past status
                    : !hasReachedStatus("Manager Approval")
                    ? "hidden" // Future status - hidden
                    : "border-gray-300 bg-gray-50" // Upcoming status (showing only the next one)
                }`}
              >
                <h3 className="font-medium mb-1">Step 3: Manager Approval</h3>
                <div className="flex items-center">
                  <span>Status: </span>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      isStatus(vendorData.status_code, "Manager Approval")
                        ? "bg-blue-100 text-blue-800"
                        : hasReachedStatus("Finance Approval") ||
                          (hasReachedStatus("Exco Approval") &&
                            !requiresFinanceApproval)
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isStatus(vendorData.status_code, "Manager Approval")
                      ? "In Progress"
                      : hasReachedStatus("Finance Approval") ||
                        (hasReachedStatus("Exco Approval") &&
                          !requiresFinanceApproval)
                      ? "Completed"
                      : "Pending"}
                  </span>
                </div>
              </div>

              {/* Step 4: Finance Approval - Only show if required */}
              {requiresFinanceApproval && (
                <div
                  className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
                    isStatus(vendorData.status_code, "Finance Approval")
                      ? "border-blue-500 bg-blue-50" // Current status
                      : hasReachedStatus("Exco Approval")
                      ? "border-green-500 bg-green-50" // Past status
                      : !hasReachedStatus("Finance Approval")
                      ? "hidden" // Future status - hidden
                      : "border-gray-300 bg-gray-50" // Upcoming status (showing only the next one)
                  }`}
                >
                  <h3 className="font-medium mb-1">Step 4: Finance Approval</h3>
                  <div className="flex items-center">
                    <span>Status: </span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        isStatus(vendorData.status_code, "Finance Approval")
                          ? "bg-blue-100 text-blue-800"
                          : hasReachedStatus("Exco Approval")
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {isStatus(vendorData.status_code, "Finance Approval")
                        ? "In Progress"
                        : hasReachedStatus("Exco Approval")
                        ? "Completed"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              )}

              {/* Step 5: Exco Approval */}
              <div
                className={`approval-step p-4 border-l-4 rounded shadow-sm relative ${
                  isStatus(vendorData.status_code, "Exco Approval")
                    ? "border-blue-500 bg-blue-50" // Current status
                    : hasReachedStatus("Creation approved")
                    ? "border-green-500 bg-green-50" // Past status
                    : !hasReachedStatus("Exco Approval")
                    ? "hidden" // Future status - hidden
                    : "border-gray-300 bg-gray-50" // Upcoming status (showing only the next one)
                }`}
              >
                <h3 className="font-medium mb-1">
                  Step {requiresFinanceApproval ? "5" : "4"}: Exco Approval
                </h3>
                <div className="flex items-center">
                  <span>Status: </span>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      isStatus(vendorData.status_code, "Exco Approval")
                        ? "bg-blue-100 text-blue-800"
                        : hasReachedStatus("Creation approved")
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isStatus(vendorData.status_code, "Exco Approval")
                      ? "In Progress"
                      : hasReachedStatus("Creation approved")
                      ? "Completed"
                      : "Pending"}
                  </span>
                </div>
              </div>

              {/* Final Step: Completed */}
              <div
                className={`approval-step p-4 border-l-4 rounded shadow-sm ${
                  isStatus(vendorData.status_code, "Creation approved")
                    ? "border-green-500 bg-green-50" // Current/final status
                    : !hasReachedStatus("Creation approved")
                    ? "hidden" // Future status - hidden
                    : "border-gray-300 bg-gray-50" // Upcoming status (showing only the next one)
                }`}
              >
                <h3 className="font-medium mb-1">
                  Step {requiresFinanceApproval ? "6" : "5"}: Completed
                </h3>
                <div className="flex items-center">
                  <span>Status: </span>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      isStatus(vendorData.status_code, "Creation approved")
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isStatus(vendorData.status_code, "Creation approved")
                      ? "Completed"
                      : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Status-specific displays and action buttons */}
          {vendorData.status_code === "Declined" && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-6">
              <h3 className="text-red-700 font-medium">Declined</h3>
              <p className="text-sm text-gray-700 mt-2">Reason for decline:</p>
              <p className="text-sm italic mt-1">
                {vendorData.approval_comment || "No reason provided"}
              </p>
            </div>
          )}

          {canApprove &&
            vendorData.status_code !== "Declined" &&
            vendorData.status_code !== "Invitation Sent" &&
            vendorData.status_code &&
            !isStatus(vendorData.status_code, ["Creation approved"]) && (
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
          {isEditable && vendorData.status_code === "Declined" && (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
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
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Delete"}
              </button>
            </div>
          )}
          {isEditable && vendorData.status_code === "Invitation Sent" && (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
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
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
      {showConfirmation && (
        <>
          <div
            className="fixed inset-0 bg-transparent z-50"
            onClick={() => setShowConfirmation(false)}
          />
          <div className="w-[400px] bg-white rounded-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center p-8 text-gray-800 shadow-lg z-[1000] animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-medium mt-4 mb-4">
              Would you like to proceed?
            </h2>
            <p className="text-base mb-6">
              Are you sure you want to approve this vendor?
            </p>
            <div className="flex justify-around gap-4">
              <button
                className="w-[100px] py-3 px-4 bg-green-600 text-white border-none rounded-md text-base cursor-pointer hover:bg-green-700"
                onClick={confirmApproval}
              >
                Yes
              </button>
              <button
                className="w-[100px] py-3 px-4 bg-red-600 text-white border-none rounded-md text-base cursor-pointer hover:bg-red-700"
                onClick={() => setShowConfirmation(false)}
              >
                No
              </button>
            </div>
          </div>
        </>
      )}
      {showDeclinePopup && (
        <>
          <div
            className="fixed inset-0 bg-transparent z-50"
            onClick={() => setShowDeclinePopup(false)}
          />
          <div className="w-[400px] bg-white rounded-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center p-8 text-gray-800 shadow-lg z-[1000] animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-medium mt-4 mb-4">
              Are you sure you want to decline?
            </h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Please provide a reason:
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md h-24"
                value={declineComment}
                onChange={(e) => setDeclineComment(e.target.value)}
                placeholder="Enter your comment here..."
              ></textarea>
            </div>
            <div className="flex justify-around gap-4">
              <button
                className="w-[100px] py-3 px-4 bg-green-600 text-white border-none rounded-md text-base cursor-pointer hover:bg-green-700"
                onClick={confirmDecline}
              >
                Yes
              </button>
              <button
                className="w-[100px] py-3 px-4 bg-red-600 text-white border-none rounded-md text-base cursor-pointer hover:bg-red-700"
                onClick={() => setShowDeclinePopup(false)}
              >
                No
              </button>
            </div>
          </div>
        </>
      )}
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
                  setSuccessMessage("Vendor has been deleted successfully.");
                  setShowSuccess(true);
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccess && (
        <>
          <div
            className="fixed inset-0 bg-transparent z-50"
            onClick={handleSuccessClose}
          />
          <div className="w-[400px] bg-white rounded-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center p-8 text-gray-800 shadow-lg z-[1000] animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-medium mt-4 mb-4">Thank you!</h2>
            <p className="text-base mb-6">{successMessage}</p>
            <div className="flex justify-center">
              <button
                className="w-[100px] py-3 px-4 bg-green-600 text-white border-none rounded-md text-base cursor-pointer hover:bg-green-700"
                onClick={handleSuccessClose}
              >
                OK
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
