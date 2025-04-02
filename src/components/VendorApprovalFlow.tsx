"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popup } from "@/components/ui/Popup";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
      
      // Fetch vendor data - replace with your actual API endpoint
      const response = await axios.get(`/api/vendors?email=${encodeURIComponent(vendorEmail)}`);
      
      if (response.data && response.data.length > 0) {
        const vendor = response.data[0];
        
        // Check if payment terms require CFO approval
        const cfoCriticalTerms = ['1 DAY', '10 DAYS', '13 DAYS', '14 DAYS', '15 DAYS', '20 DAYS', '21 DAYS', '20 EOM'];
        const needsCFOApproval = cfoCriticalTerms.includes(vendor.crb7c_paymentterms?.toUpperCase());
        setRequiresCFOApproval(needsCFOApproval);
        
        // Set vendor data
        setVendorData(vendor);
        
        // Handle region specific fields based on description
        handleRegionSpecificFields(vendor.description);
        
        // Check if parent vendor exists
        if (vendor.crb7c_parentvendor) {
          // Fetch parent vendor data
          const parentResponse = await axios.get(`/api/vendors?email=${encodeURIComponent(vendor.crb7c_parentvendor)}`);
          
          if (parentResponse.data && parentResponse.data.length > 0) {
            const parentVendor = parentResponse.data[0];
            // Merge parent and child vendor data appropriately
            setVendorData(prev => ({
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
              crb7c_nzaccount: parentVendor.crb7c_nzaccount
            }));
          }
        }
        
        // Validate approver access
        validateApproverAccess(vendor.crb7c_statuscode, vendor.crb7c_primarytradingbusinessunit);
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
  const validateApproverAccess = async (statusCode?: ApprovalStatus, businessUnit?: string) => {
    if (!statusCode || !businessUnit || !currentUserEmail) {
      setCanApprove(false);
      return;
    }

    try {
      // Fetch approvers for this business unit
      const response = await axios.get(`/api/approvers?businessUnit=${encodeURIComponent(businessUnit)}`);
      
      if (response.data && response.data.length > 0) {
        const approvers = response.data[0];
        let hasApprovalRights = false;

        switch(statusCode) {
          case 'Pending Manager Approval':
            hasApprovalRights = approvers.crb7c_approver1 === currentUserEmail;
            break;
          case 'Pending CFO Approval':
            hasApprovalRights = approvers.crb7c_approver2 === currentUserEmail;
            break;
          case 'Pending Exco Approval':
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
      await axios.put(`/api/vendors/${vendorData.contactid}`, {
        ...vendorData,
        crb7c_statuscode: "Pending Manager Approval" as ApprovalStatus,
        crb7c_approvalcomment: "",
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
      switch(vendorData.crb7c_statuscode) {
        case 'Pending Manager Approval':
          if (requiresCFOApproval) {
            newStatus = 'Pending CFO Approval';
            // In a real implementation, fetch the CFO email and name
            // For now using placeholder
            nextApprover = "cfo@example.com";
            nextApproverName = "CFO User";
          } else {
            newStatus = 'Pending Exco Approval';
            // In a real implementation, fetch the Exco email and name
            nextApprover = "exco@example.com";
            nextApproverName = "Exco User";
          }
          break;
        case 'Pending CFO Approval':
          newStatus = 'Pending Exco Approval';
          // In a real implementation, fetch the Exco email and name
          nextApprover = "exco@example.com";
          nextApproverName = "Exco User";
          break;
        case 'Pending Exco Approval':
          newStatus = 'Creation approved';
          nextApprover = "";
          nextApproverName = "";
          break;
        default:
          throw new Error("Invalid approval flow state");
      }
      
      // Update vendor status
      await axios.put(`/api/vendors/${vendorData.contactid}`, {
        ...vendorData,
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
      await axios.put(`/api/vendors/${vendorData.contactid}`, {
        ...vendorData,
        crb7c_statuscode: "Declined" as ApprovalStatus,
        crb7c_approvalcomment: declineComment,
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

  // Determine which approval steps to show based on requirement for CFO approval
  const approvalSteps = [
    { id: 'manager', label: 'Manager Approval', status: vendorData.crb7c_statuscode },
    ...(requiresCFOApproval ? [{ id: 'cfo', label: 'CFO Approval', status: vendorData.crb7c_statuscode }] : []),
    { id: 'exco', label: 'Exco Approval', status: vendorData.crb7c_statuscode },
    { id: 'completed', label: 'Completed', status: vendorData.crb7c_statuscode === 'Creation approved' ? 'Creation approved' : 'Pending' }
  ];

  // Helper function to get step status
  const getStepStatus = (stepIndex: number, currentStatus?: ApprovalStatus) => {
    if (!currentStatus) return { text: 'Pending', cssClass: 'bg-yellow-100 text-yellow-700' };
    
    // Define all possible statuses in the approval workflow
    const allStatuses = [
      'Pending Manager Approval',
      'Pending CFO Approval',
      'Pending Exco Approval',
      'Creation approved'
    ];
    
    // Filter based on CFO approval requirement
    const statuses = [
      'Pending Manager Approval',
      ...(requiresCFOApproval ? ['Pending CFO Approval'] : []),
      'Pending Exco Approval',
      'Creation approved'
    ];
    
    if (currentStatus === 'Declined' || currentStatus === 'Invitation sent') {
      return { text: currentStatus, cssClass: 'bg-red-100 text-red-700' };
    }
    
    // Get the index of the current status in the workflow
    const currentStatusIndex = allStatuses.indexOf(currentStatus);
    // Get the index of the step we're checking in the filtered workflow
    const adjustedStepIndex = stepIndex >= 1 && !requiresCFOApproval ? stepIndex + 1 : stepIndex;
    
    // Check if step should be shown as approved
    const isApproved = currentStatusIndex > adjustedStepIndex;
    // Check if step is the current one
    const isCurrent = currentStatusIndex === adjustedStepIndex;
    
    if (isApproved) {
      return { text: 'Approved', cssClass: 'bg-green-100 text-green-700' };
    } else if (isCurrent) {
      return { text: currentStatus, cssClass: 'bg-blue-100 text-blue-700' };
    } else {
      return { text: 'Pending', cssClass: 'bg-yellow-100 text-yellow-700' };
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
      <div className="relative min-h-screen">
        {/* Background image with transparency */}
        <div
          className="absolute inset-0 z-0 w-full h-full"
          style={{
            backgroundImage: "url(/images/LtrAWPL.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.2,
          }}
        ></div>

        {/* Back button */}
        <div className="relative z-10 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            Back to Vendor List
          </Button>
        </div>

        {/* Main content */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vendor details card */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Vendor Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-600 mb-2">General Information</h3>
                    <p><span className="font-medium">Trading Name:</span> {vendorData.crb7c_tradingname || "N/A"}</p>
                    <p><span className="font-medium">ABN:</span> {vendorData.crb7c_abn || "N/A"}</p>
                    <p><span className="font-medium">GST Registered:</span> {vendorData.crb7c_gst || "N/A"}</p>
                    <p><span className="font-medium">Website:</span> {vendorData.websiteurl || "N/A"}</p>
                    <p><span className="font-medium">Business Unit:</span> {vendorData.crb7c_primarytradingbusinessunit || "N/A"}</p>
                    <p><span className="font-medium">Purchase Type:</span> {vendorData.crb7c_purchasetype || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-600 mb-2">Contact Information</h3>
                    <p><span className="font-medium">Contact:</span> {vendorData.crb7c_accountcontact || "N/A"}</p>
                    <p><span className="font-medium">Phone:</span> {vendorData.address1_telephone2 || "N/A"}</p>
                    <p><span className="font-medium">Email:</span> {vendorData.emailaddress1 || "N/A"}</p>
                    <p><span className="font-medium">Address:</span> {vendorData.address1_postofficebox ? `${vendorData.address1_postofficebox}, ` : ""}
                      {vendorData.address1_city ? `${vendorData.address1_city}, ` : ""}
                      {vendorData.address1_stateorprovince || ""} {vendorData.address1_postalcode || "N/A"}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-600 mb-2">Trading Terms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><span className="font-medium">Payment Terms:</span> {vendorData.crb7c_paymentterms || "N/A"}</p>
                    <p><span className="font-medium">Invoice Currency:</span> {vendorData.crb7c_invoicecurrency || "N/A"}</p>
                    <p><span className="font-medium">Minimum Order Value:</span> {vendorData.crb7c_min_order_value || "N/A"}</p>
                    <p><span className="font-medium">Maximum Order Value:</span> {vendorData.crb7c_max_order_value || "N/A"}</p>
                    <p><span className="font-medium">Agreed Discount:</span> {vendorData.crb7c_agreeddiscount || "N/A"}</p>
                    <p><span className="font-medium">Invoice Discount:</span> {vendorData.crb7c_invoicediscount || "N/A"}</p>
                  </div>
                </div>
                
                {/* Status information */}
                <div className="mt-6 bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold text-gray-600 mb-2">Approval Information</h3>
                  <p><span className="font-medium">Current Status:</span> {vendorData.crb7c_statuscode || "N/A"}</p>
                  <p><span className="font-medium">Current Approver:</span> {vendorData.crb7c_currentapprovername || "N/A"}</p>
                  <p><span className="font-medium">Next Approver:</span> {vendorData.crb7c_nextapprovername || "N/A"}</p>
                  <p><span className="font-medium">Last Updated:</span> {vendorData.crb7c_statusupdatetime ? new Date(vendorData.crb7c_statusupdatetime).toLocaleString() : "N/A"}</p>
                  
                  {vendorData.crb7c_approvalcomment && (
                    <div className="mt-2">
                      <p className="font-medium">Comments:</p>
                      <p className="italic text-gray-600">{vendorData.crb7c_approvalcomment}</p>
                    </div>
                  )}
                </div>
                
                {/* Admin actions if status is Declined */}
                {vendorData.crb7c_statuscode === 'Declined' && (
                  <div className="mt-6 flex gap-4">
                    <Button 
                      onClick={handleResubmit} 
                      variant="default"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Resubmit Vendor"}
                    </Button>
                    <Button 
                      onClick={handleDelete} 
                      variant="destructive"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Delete Vendor"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Approval status card */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Approval Status</h2>
                
                {/* Approval steps */}
                <div className="mb-6">
                  {approvalSteps.map((step, index) => {
                    const status = getStepStatus(index, step.status as ApprovalStatus);
                    return (
                      <div key={step.id} className="mb-4">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${status.cssClass}`}>
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium">{step.label}</h3>
                            <p className="text-xs text-gray-500">{status.text}</p>
                          </div>
                        </div>
                        {index < approvalSteps.length - 1 && (
                          <div className="ml-4 mt-2 mb-2 w-0.5 h-6 bg-gray-300"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Action buttons */}
                {canApprove && vendorData.crb7c_statuscode && !['Creation approved', 'Declined', 'Invitation sent'].includes(vendorData.crb7c_statuscode as string) && (
                  <div className="flex flex-col gap-3 mt-6">
                    <Button 
                      onClick={handleApprove} 
                      variant="default"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Approve"}
                    </Button>
                    <Button 
                      onClick={handleDecline} 
                      variant="destructive"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Decline"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Popups and Dialog boxes */}
        {/* Approval confirmation popup */}
        <Popup
          isOpen={showConfirmation}
          title="Confirm Approval"
          message={`Are you sure you want to approve this vendor? The vendor will be moved to the next approval stage.`}
          confirmText="Approve"
          cancelText="Cancel"
          onConfirm={confirmApproval}
          onCancel={() => setShowConfirmation(false)}
          isConfirmation={true}
        />
        
        {/* Decline popup with reason */}
        <Popup
          isOpen={showDeclinePopup}
          title="Decline Vendor"
          onConfirm={confirmDecline}
          onCancel={() => setShowDeclinePopup(false)}
          confirmText="Decline"
          cancelText="Cancel"
          isConfirmation={true}
        >
          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for declining *
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              required
            >
              <option value="">Select a reason</option>
              <option value="Information incomplete">Information incomplete</option>
              <option value="Information incorrect">Information incorrect</option>
              <option value="Vendor already exists">Vendor already exists</option>
              <option value="Not approved by management">Not approved by management</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional comments
            </label>
            <Textarea
              className="w-full"
              placeholder="Add any additional details or feedback"
              value={declineComment}
              onChange={(e) => setDeclineComment(e.target.value)}
            />
          </div>
        </Popup>
        
        {/* Delete confirmation popup */}
        <Popup
          isOpen={showDeleteConfirmation}
          title="Delete Vendor"
          message="Are you sure you want to permanently delete this vendor? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirmation(false)}
          isConfirmation={true}
        />
        
        {/* Success popup */}
        <Popup
          isOpen={showSuccess}
          title="Success"
          message={successMessage}
          confirmText="OK"
          onConfirm={handleSuccessClose}
          isConfirmation={false}
        />
      </div>
    </div>
  );
}