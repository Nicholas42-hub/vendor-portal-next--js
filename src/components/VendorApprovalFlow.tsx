"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

// Import CSS styles (you'll need to create this file)
import "../styles/approval-flow.css";

// Define types for approval states and form data
type ApprovalStatus =
  | "Pending Manager Approval"
  | "Pending CFO Approval"
  | "Pending Exco Approval"
  | "Creation approved"
  | "Declined"
  | "Invitation sent";

interface VendorData {
  contactid?: string;
  crb7c_tradingname?: string;
  crb7c_abn?: string;
  crb7c_gst?: string;
  websiteurl?: string;
  address1_postofficebox?: string;
  address1_city?: string;
  address1_stateorprovince?: string;
  address1_postalcode?: string;
  crb7c_accountcontact?: string;
  address1_telephone2?: string;
  emailaddress1?: string;
  crb7c_invoicecurrency?: string;
  crb7c_primarytradingbusinessunit?: string;
  crb7c_bankname?: string;
  crb7c_aubsb?: string;
  crb7c_auaccount?: string;
  crb7c_nzbsb?: string;
  crb7c_nzaccount?: string;
  crb7c_purchasetype?: string;
  crb7c_statuscode?: ApprovalStatus;
  crb7c_delivery_notice?: string;
  crb7c_barcode?: string;
  crb7c_min_order_value?: string;
  crb7c_max_order_value?: string;
  crb7c_paymentterms?: string;
  crb7c_exclusivesupply?: string;
  crb7c_salesorreturn?: string;
  crb7c_salesorexchange?: string;
  crb7c_grossmargin?: string;
  crb7c_agreeddiscount?: string;
  crb7c_invoicediscount?: string;
  crb7c_settlementdiscount?: string;
  crb7c_settlementdiscountdays?: string;
  crb7c_flatrebate?: string;
  crb7c_growthrebate?: string;
  crb7c_marketingrebate?: string;
  crb7c_promotionalfund?: string;
  description?: string;
  crb7c_approvalcomment?: string;
  crb7c_parentvendor?: string;
  crb7c_statuscode_record?: string;
  // Additional fields for approval flow
  crb7c_nextapprover?: string;
  crb7c_nextapprovername?: string;
  crb7c_currentapprover?: string;
  crb7c_currentapprovername?: string;
  crb7c_statusupdatetime?: string;
  crb7c_vendorsetupstatus?: string;
}

export default function VendorApprovalFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const email = searchParams?.get("email");

  // State variables
  const [vendorData, setVendorData] = useState<VendorData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeclinePopup, setShowDeclinePopup] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [declineComment, setDeclineComment] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [requiresCFOApproval, setRequiresCFOApproval] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    if (session?.user?.email) {
      setCurrentUserEmail(session.user.email);
    }

    if (email) {
      fetchVendorData(email);
    }
  }, [email, session]);

  // Fetch vendor data from API
  const fetchVendorData = async (vendorEmail: string) => {
    try {
      setIsLoading(true);

      // Fetch vendor data
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

        // Handle region specific fields based on description
        handleRegionSpecificFields(vendor.description);

        // Check if parent vendor exists
        if (vendor.crb7c_parentvendor) {
          // Fetch parent vendor data
          const parentResponse = await axios.get(
            `/api/vendors?email=${encodeURIComponent(
              vendor.crb7c_parentvendor
            )}`
          );

          if (parentResponse.data && parentResponse.data.length > 0) {
            const parentVendor = parentResponse.data[0];
            // Merge parent and child vendor data appropriately
            setVendorData((prev) => ({
              ...prev,
              // Fields from parent vendor
              crb7c_tradingname: parentVendor.crb7c_tradingname,
              crb7c_abn: parentVendor.crb7c_abn,
              crb7c_gst: parentVendor.crb7c_gst,
              websiteurl: parentVendor.websiteurl,
              address1_postofficebox: parentVendor.address1_postofficebox,
              address1_city: parentVendor.address1_city,
              address1_stateorprovince: parentVendor.address1_stateorprovince,
              address1_postalcode: parentVendor.address1_postalcode,
              crb7c_accountcontact: parentVendor.crb7c_accountcontact,
              address1_telephone2: parentVendor.address1_telephone2,
              emailaddress1: parentVendor.emailaddress1,
              crb7c_invoicecurrency: parentVendor.crb7c_invoicecurrency,
              crb7c_bankname: parentVendor.crb7c_bankname,
              crb7c_aubsb: parentVendor.crb7c_aubsb,
              crb7c_auaccount: parentVendor.crb7c_auaccount,
              crb7c_nzbsb: parentVendor.crb7c_nzbsb,
              crb7c_nzaccount: parentVendor.crb7c_nzaccount,
            }));
          }
        }

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

  // Handle region-specific fields visibility
  const handleRegionSpecificFields = (description?: string) => {
    // This will be handled in CSS/JSX conditionals
  };

  // Validate if current user can approve
  const validateApproverAccess = async (
    statusCode?: ApprovalStatus,
    businessUnit?: string
  ) => {
    if (!statusCode || !businessUnit || !currentUserEmail) {
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
            hasApprovalRights = approvers.crb7c_approver1 === currentUserEmail;
            break;
          case "Pending CFO Approval":
            hasApprovalRights = approvers.crb7c_approver2 === currentUserEmail;
            break;
          case "Pending Exco Approval":
            hasApprovalRights = approvers.crb7c_approver3 === currentUserEmail;
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

  // Handle resubmit button click
  const handleResubmit = async () => {
    try {
      setIsSubmitting(true);

      // API call to resubmit vendor
      await axios.patch(`/api/vendors/${vendorData.contactid}`, {
        ...vendorData,
        crb7c_statuscode:
          vendorData.crb7c_statuscode_record || "Pending Manager Approval",
        crb7c_approvalcomment: null,
      });

      // Show success popup
      setSuccessMessage("Vendor successfully resubmitted for approval.");
      setShowSuccess(true);

      // Refresh data after resubmission
      if (email) {
        await fetchVendorData(email);
      }
    } catch (error) {
      console.error("Error resubmitting vendor:", error);
      alert("Failed to resubmit vendor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm approval
  const confirmApproval = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmation(false);

      let newStatus: ApprovalStatus;
      let nextApprover = "";
      let nextApproverName = "";

      // Determine next status based on current status
      switch (vendorData.crb7c_statuscode) {
        case "Pending Manager Approval":
          if (requiresCFOApproval) {
            newStatus = "Pending CFO Approval";
            // In a real implementation, fetch the CFO email and name
            // For now using placeholder
            nextApprover = "cfo@example.com";
            nextApproverName = "CFO User";
          } else {
            newStatus = "Pending Exco Approval";
            // In a real implementation, fetch the Exco email and name
            nextApprover = "exco@example.com";
            nextApproverName = "Exco User";
          }
          break;
        case "Pending CFO Approval":
          newStatus = "Pending Exco Approval";
          // In a real implementation, fetch the Exco email and name
          nextApprover = "exco@example.com";
          nextApproverName = "Exco User";
          break;
        case "Pending Exco Approval":
          newStatus = "Creation approved";
          nextApprover = "";
          nextApproverName = "";
          break;
        default:
          throw new Error("Invalid approval flow state");
      }

      // Update vendor status
      await axios.patch(`/api/vendors/${vendorData.contactid}`, {
        crb7c_statuscode: newStatus,
        crb7c_nextapprover: nextApprover,
        crb7c_nextapprovername: nextApproverName,
        crb7c_currentapprover: currentUserEmail,
        crb7c_currentapprovername: session?.user?.name || "Unknown",
        crb7c_statusupdatetime: new Date().toISOString(),
      });

      // Show success popup
      setSuccessMessage(`Vendor successfully moved to ${newStatus} status.`);
      setShowSuccess(true);

      // Refresh data after approval
      if (email) {
        await fetchVendorData(email);
      }
    } catch (error) {
      console.error("Error approving vendor:", error);
      alert("Failed to approve vendor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm decline
  const confirmDecline = async () => {
    if (!declineReason) {
      alert("Please provide a reason for declining.");
      return;
    }

    try {
      setIsSubmitting(true);
      setShowDeclinePopup(false);

      // Update vendor status
      await axios.patch(`/api/vendors/${vendorData.contactid}`, {
        crb7c_statuscode: "Declined" as ApprovalStatus,
        crb7c_approvalcomment: declineComment,
        crb7c_statuscode_record: vendorData.crb7c_statuscode, // Store current status for resubmission
        crb7c_currentapprover: currentUserEmail,
        crb7c_currentapprovername: session?.user?.name || "Unknown",
        crb7c_statusupdatetime: new Date().toISOString(),
      });

      // Show success popup
      setSuccessMessage("Vendor has been declined.");
      setShowSuccess(true);

      // Clear decline form
      setDeclineComment("");
      setDeclineReason("");

      // Refresh data after decline
      if (email) {
        await fetchVendorData(email);
      }
    } catch (error) {
      console.error("Error declining vendor:", error);
      alert("Failed to decline vendor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      setShowDeleteConfirmation(false);

      // Delete vendor
      await axios.delete(`/api/vendors/${vendorData.contactid}`);

      // Success message and redirect
      alert("Vendor has been deleted successfully.");
      router.push("/");
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Failed to delete vendor. Please try again.");
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
      <div className="relative min-h-screen">
        {/* Back button */}
        <div className="relative z-10 mb-6">
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
          {/* Vendor details section */}
          <div className="md:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Vendor Details</h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p>
                    <strong>Trading Name:</strong>{" "}
                    {vendorData.crb7c_tradingname || "N/A"}
                  </p>
                  <p>
                    <strong>ABN:</strong> {vendorData.crb7c_abn || "N/A"}
                  </p>
                  <p>
                    <strong>Website:</strong> {vendorData.websiteurl || "N/A"}
                  </p>
                  <p>
                    <strong>Business Unit:</strong>{" "}
                    {vendorData.crb7c_primarytradingbusinessunit || "N/A"}
                  </p>
                  <p>
                    <strong>Purchase Type:</strong>{" "}
                    {vendorData.crb7c_purchasetype || "N/A"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Contact:</strong>{" "}
                    {vendorData.crb7c_accountcontact || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {vendorData.address1_telephone2 || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {vendorData.emailaddress1 || "N/A"}
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    {vendorData.address1_postofficebox || "N/A"},{" "}
                    {vendorData.address1_city || ""},{" "}
                    {vendorData.address1_stateorprovince || ""}{" "}
                    {vendorData.address1_postalcode || ""}
                  </p>
                  <p>
                    <strong>Currency:</strong>{" "}
                    {vendorData.crb7c_invoicecurrency || "N/A"}
                  </p>
                </div>
              </div>

              {/* Banking details */}
              <h3 className="font-semibold mb-3">Banking Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p>
                    <strong>Bank Name:</strong>{" "}
                    {vendorData.crb7c_bankname || "N/A"}
                  </p>
                  <p>
                    <strong>BSB:</strong>{" "}
                    {vendorData.crb7c_aubsb || vendorData.crb7c_nzbsb || "N/A"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Account Number:</strong>{" "}
                    {vendorData.crb7c_auaccount ||
                      vendorData.crb7c_nzaccount ||
                      "N/A"}
                  </p>
                </div>
              </div>

              {/* Trading details */}
              <h3 className="font-semibold mb-3">Trading Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p>
                    <strong>Payment Terms:</strong>{" "}
                    {vendorData.crb7c_paymentterms || "N/A"}
                  </p>
                  <p>
                    <strong>Min Order Value:</strong>{" "}
                    {vendorData.crb7c_min_order_value || "N/A"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Max Order Value:</strong>{" "}
                    {vendorData.crb7c_max_order_value || "N/A"}
                  </p>
                  <p>
                    <strong>Delivery Notice:</strong>{" "}
                    {vendorData.crb7c_delivery_notice || "N/A"}
                  </p>
                </div>
              </div>

              {/* Approval comment if declined */}
              {vendorData.crb7c_statuscode === "Declined" &&
                vendorData.crb7c_approvalcomment && (
                  <div className="decline-message">
                    <h3>Decline Reason</h3>
                    <p>
                      {vendorData.crb7c_approvalcomment || "No reason provided"}
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Approval flow section */}
          <div className="approval-flow">
            <h2 className="text-xl font-semibold mb-6">Approval Flow</h2>

            {vendorData.crb7c_statuscode &&
              vendorData.crb7c_statuscode !== "Declined" &&
              vendorData.crb7c_statuscode !== "Invitation sent" && (
                <div className="approval-steps" id="approvalSteps">
                  {/* Step 1: Manager Approval */}
                  <div
                    id="step1"
                    className={`approval-step ${
                      isStatus(
                        vendorData.crb7c_statuscode,
                        "Pending Manager Approval"
                      )
                        ? "current"
                        : isStatus(vendorData.crb7c_statuscode, [
                            "Pending CFO Approval",
                            "Pending Exco Approval",
                            "Creation approved",
                          ])
                        ? "approved"
                        : ""
                    }`}
                  >
                    <h3>Step 1: Manager Approval</h3>
                    <p>
                      <span>Status: </span>
                      <span
                        id="step1Status"
                        className={`status-indicator ${
                          isStatus(
                            vendorData.crb7c_statuscode,
                            "Pending Manager Approval"
                          )
                            ? "status-current"
                            : isStatus(vendorData.crb7c_statuscode, [
                                "Pending CFO Approval",
                                "Pending Exco Approval",
                                "Creation approved",
                              ])
                            ? "status-approved"
                            : "status-pending"
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
                    </p>
                  </div>

                  {/* Step 2: CFO Approval - only show if required */}
                  {requiresCFOApproval && (
                    <div
                      id="step2"
                      className={`approval-step ${
                        isStatus(
                          vendorData.crb7c_statuscode,
                          "Pending CFO Approval"
                        )
                          ? "current"
                          : isStatus(vendorData.crb7c_statuscode, [
                              "Pending Exco Approval",
                              "Creation approved",
                            ])
                          ? "approved"
                          : ""
                      }`}
                    >
                      <h3>Step 2: CFO Approval</h3>
                      <p>
                        <span>Status: </span>
                        <span
                          id="step2Status"
                          className={`status-indicator ${
                            isStatus(
                              vendorData.crb7c_statuscode,
                              "Pending CFO Approval"
                            )
                              ? "status-current"
                              : isStatus(vendorData.crb7c_statuscode, [
                                  "Pending Exco Approval",
                                  "Creation approved",
                                ])
                              ? "status-approved"
                              : "status-pending"
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
                      </p>
                    </div>
                  )}

                  {/* Step 3: Exco Approval */}
                  <div
                    id="step3"
                    className={`approval-step ${
                      isStatus(
                        vendorData.crb7c_statuscode,
                        "Pending Exco Approval"
                      )
                        ? "current"
                        : isStatus(
                            vendorData.crb7c_statuscode,
                            "Creation approved"
                          )
                        ? "approved"
                        : ""
                    }`}
                  >
                    <h3>
                      Step {requiresCFOApproval ? "3" : "2"}: Exco Approval
                    </h3>
                    <p>
                      <span>Status: </span>
                      <span
                        id="step3Status"
                        className={`status-indicator ${
                          isStatus(
                            vendorData.crb7c_statuscode,
                            "Pending Exco Approval"
                          )
                            ? "status-current"
                            : isStatus(
                                vendorData.crb7c_statuscode,
                                "Creation approved"
                              )
                            ? "status-approved"
                            : "status-pending"
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
                    </p>
                  </div>

                  {/* Step 4: Completed */}
                  <div
                    id="step4"
                    className={`approval-step no-arrow ${
                      isStatus(vendorData.crb7c_statuscode, "Creation approved")
                        ? "approved"
                        : ""
                    }`}
                  >
                    <h3>Step {requiresCFOApproval ? "4" : "3"}: Completed</h3>
                    <p>
                      <span>Status: </span>
                      <span
                        id="step4Status"
                        className={`status-indicator ${
                          isStatus(
                            vendorData.crb7c_statuscode,
                            "Creation approved"
                          )
                            ? "status-approved"
                            : "status-pending"
                        }`}
                      >
                        {isStatus(
                          vendorData.crb7c_statuscode,
                          "Creation approved"
                        )
                          ? "Creation approved"
                          : "Pending"}
                      </span>
                    </p>
                  </div>
                </div>
              )}

            {/* Show decline message when status is Declined */}
            {vendorData.crb7c_statuscode === "Declined" && (
              <div id="declineMessage" className="decline-message">
                <h3>Declined</h3>
                <p>Reason for decline:</p>
                <p id="declineReason">
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
                <div className="button-container">
                  <button
                    type="button"
                    className="approve-btn"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    className="decline-btn"
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
                className="resubmit-btn"
                onClick={handleResubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Re-submit"}
              </button>
            )}

            {/* Delete button for Invitation sent status */}
            {vendorData.crb7c_statuscode === "Invitation sent" && (
              <button
                type="button"
                className="delete-btn"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="popup-overlay open-popup-overlay">
          <div className="popup open-popup" id="confirmPopup">
            <h2>Would you like to proceed?</h2>
            <p>Are you sure you want to approve this vendor?</p>
            <div className="button-container">
              <button
                type="button"
                className="btn-yes"
                onClick={confirmApproval}
              >
                Yes
              </button>
              <button
                type="button"
                className="btn-no"
                onClick={() => setShowConfirmation(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Popup */}
      {showDeclinePopup && (
        <div className="popup-overlay open-popup-overlay">
          <div className="popup open-popup" id="declinePopup">
            <h2>Are you sure you want to decline?</h2>
            <div id="declineCommentContainer">
              <label htmlFor="declineComment">Please provide a reason:</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md mb-3"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="Information incomplete">
                  Information incomplete
                </option>
                <option value="Information incorrect">
                  Information incorrect
                </option>
                <option value="Vendor already exists">
                  Vendor already exists
                </option>
                <option value="Not approved by management">
                  Not approved by management
                </option>
                <option value="Other">Other</option>
              </select>
              <textarea
                id="declineComment"
                placeholder="Enter additional comments here..."
                value={declineComment}
                onChange={(e) => setDeclineComment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md h-24"
              ></textarea>
            </div>
            <div className="button-container">
              <button
                type="button"
                className="btn-yes"
                onClick={confirmDecline}
              >
                Yes
              </button>
              <button
                type="button"
                className="btn-no"
                onClick={() => setShowDeclinePopup(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirmation && (
        <div className="popup-overlay open-popup-overlay">
          <div className="popup open-popup" id="deletePopup">
            <h2>Are you sure you want to DELETE this request?</h2>
            <div className="button-container">
              <button type="button" className="btn-yes" onClick={confirmDelete}>
                Yes
              </button>
              <button
                type="button"
                className="btn-no"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thank You Popup */}
      {showSuccess && (
        <div className="popup-overlay open-popup-overlay">
          <div className="popup open-popup" id="thankYouPopup">
            <h2>Thank you!</h2>
            <p>{successMessage}</p>
            <div className="button-container-ok">
              <button
                type="button"
                className="btn-ok"
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
