import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import axios from "axios";

export async function GET(req: NextRequest, context: { params: { email: string } }) {
  
  try {

    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Wait for params to be available
    const params = await context.params;
    const email = params.email;
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "Invalid email parameter" }, { status: 400 });
    }

    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    
    if (!workspaceId || !graphqlId) {
      return NextResponse.json({ error: "Missing API configuration" }, { status: 500 });
    }
    
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    const query = {
      query: `
        query($email: String!) {
          vendorTradingEntities(filter: { email: { eq: $email } }) {
            items {
              email
              TradingEntityId
            }
          }
          vendorOnboardings(filter: { email: { eq: $email } }) {
            items {
    primary_trading_business_unit
    email
    business_name
    trading_name
    vendor_type
    contact_person
    contact_phone
    website_url
    postal_address
    city
    state
    postcode
    is_gst_registered
    abn
    gst
    quotes_obtained
    quotes_obtained_reason
    quotes_pdf_url
    back_order
    exclusive_supply
    sale_or_return
    auth_required
    delivery_notice
    min_order_value
    min_order_quantity
    max_order_value
    other_comments
    payment_terms
    order_expiry_days
    gross_margin
    invoice_discount
    invoice_discount_value
    settlement_discount
    settlement_discount_value
    settlement_discount_days
    flat_rebate
    flat_rebate_percent
    flat_rebate_dollar
    flat_rebate_term
    growth_rebate
    growth_rebate_percent
    growth_rebate_dollar
    growth_rebate_term
    marketing_rebate
    marketing_rebate_percent
    marketing_rebate_dollar
    marketing_rebate_term
    promotional_fund
    promotional_fund_value
    au_invoice_currency
    au_bank_country
    au_bank_name
    au_bank_address
    au_bank_currency_code
    au_bank_clearing_code
    au_remittance_email
    au_bsb
    au_account
    nz_invoice_currency
    nz_bank_country
    nz_bank_name
    nz_bank_address
    nz_bank_currency_code
    nz_bank_clearing_code
    nz_remittance_email
    nz_bsb
    nz_account
    overseas_iban_switch
    overseas_iban
    overseas_swift
    biller_code
    ref_code
    vendor_setup_status
    status_code
    status_code_record
    status_update_time
    approval_comment
    current_approver
    current_approver_name
    next_approver
    next_approver_name
            }
          }
        }
      `,
      variables: { email },
    };
    
    const response = await axios.post(graphqlEndpoint, query, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Check for GraphQL errors
    if (response.data.errors) {
      return NextResponse.json({ error: "GraphQL error", details: response.data.errors }, { status: 500 });
    }

    const responseData = response.data.data || {};
    const contacts = responseData.vendorOnboardings?.items || [];
    const entities = responseData.vendorTradingEntities?.items || [];

    const vendor = contacts[0];
    
    // Use a more robust method to determine payment country
    const determinePaymentCountry = (entityId: string) => {
      if (!entityId) return "Unknown";
      
      // This should ideally come from a configuration or database
      if (entityId.startsWith("A")) return "Australia";
      if (entityId.startsWith("N")) return "New Zealand";
      return "Unknown";
    };

    const relatedEntities = entities
      .filter((e: { email: string; TradingEntityId?: string }) => e.email === email && e.TradingEntityId)
      .map((e: { email: string; TradingEntityId: string }) => ({
        email: e.email,
        TradingEntityId: e.TradingEntityId,
        paymentCountry: determinePaymentCountry(e.TradingEntityId)
      }));
      console.log(relatedEntities)
    return NextResponse.json({ email, vendor, tradingEntities_data: relatedEntities });
  } catch (error) {
    console.error("Error fetching vendor data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStatus = error instanceof Error && 'response' in error && error.response?.status ? error.response.status : 500;
    
    return NextResponse.json(
      { error: "Failed to fetch vendor data", message: errorMessage }, 
      { status: errorStatus }
    );
  }
}

export async function PUT(req: NextRequest, context: { params: { email: string } }) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse the request body
    const formData = await req.json();
    
    // Wait for params to be available
    const params = await context.params;
    const email = params.email;
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "Invalid email parameter" }, { status: 400 });
    }

    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    
    if (!workspaceId || !graphqlId) {
      return NextResponse.json({ error: "Missing API configuration" }, { status: 500 });
    }
    
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // First, check if vendor record exists with this email
    const checkEmailQuery = {
        query: `
          query($email: String!) {
            vendorOnboardings(filter: { email: { eq: $email } }) {
              items {
                email
                business_name
                status_code
              }
            }
          }
        `,
        variables: { email },
      };
    
    // Check if vendor exists with this email
    const emailCheckResponse = await axios.post(graphqlEndpoint, checkEmailQuery, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      }
    });
    
    // Get existing vendor with this email
    const existingVendors = emailCheckResponse.data.data?.vendorOnboardings?.items || [];
    
    if (existingVendors.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No vendor record found with email "${email}". Please ensure the vendor is onboarded first.`
      }, { status: 404 });
    }
    
    const existingVendor = existingVendors[0];
    console.log(`Found existing vendor email: ${existingVendor.email}`);

    // Current timestamp for modified_on
    const currentTimestamp = new Date().toISOString();

    // Check if this is a status update (approval flow) or a form update
    if (formData.status_code) {
      // This is an approval action - only update status fields
      console.log(`Updating approval status to: ${formData.status_code}`);
      
      // Handle vendor setup status based on status code
      let vendorSetupStatus = "Pending";
      if (formData.status_code === "Creation approved") {
        vendorSetupStatus = "Active";
      } else if (formData.status_code === "Declined") {
        vendorSetupStatus = "Declined";
      }
      
      // If declined, set status to "Requester review" to send it back to requester
      // Otherwise use the provided status code
      const effectiveStatusCode = formData.status_code === "Declined" 
        ? "Requester review" 
        : formData.status_code;
      
// For status updates, use a minimal mutation
const updateStatusMutation = {
  query: `
        mutation {
          updateVendorOnboarding(
            email: "${email}"
            item: {
          status_code: "${formData.status_code}"
          status_update_time: "${currentTimestamp}"
          delivery_notice: ${formData.delivery_notice || 0}
        }
      ) {
        result
      }
    }
  `
};

      // Make the GraphQL request to update the vendor status
      const updateResponse = await axios.post(graphqlEndpoint, updateStatusMutation, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 50000, // 30 seconds timeout
      });

      // Check for GraphQL errors
      if (updateResponse.data.errors) {
        console.error("GraphQL errors updating vendor status:", updateResponse.data.errors);
        return NextResponse.json({
          success: false,
          message: `GraphQL Error updating vendor status: ${updateResponse.data.errors[0].message}`,
        }, { status: 400 });
      }

      // Return success response with appropriate message based on status
      let messageText = `Vendor approval status updated to ${formData.status_code} successfully`;
      if (formData.status_code === "Declined") {
        messageText = "Vendor has been declined. It has been sent back to the requester for review.";
      } else if (formData.status_code === "Creation approved") {
        messageText = "Vendor has been fully approved. Setup is now complete.";
      }

      return NextResponse.json({
        success: true,
        message: messageText,
        data: {
          email: email,
          status: formData.status_code === "Declined" ? "Requester review" : formData.status_code,
          result: updateResponse.data.data?.updateVendorOnboarding?.result
        },
      });
    } else {
      // This is a form update - update all fields
      const updateVendorMutation = {
        query: `
          mutation {
            updateVendorOnboarding(
              email: "${email}"
              item: {
                business_name: "${formData.business_name || ""}"
                trading_name: "${formData.trading_name || ""}"
                contact_person: "${formData.primary_contact_email || ""}"
                contact_phone: "${formData.telephone || ""}"
                
                website_url: "${formData.website || ""}"
                postal_address: "${formData.address || ""}"
                city: "${formData.city || ""}"
                state: "${formData.state || ""}"
                postcode: "${formData.postcode || ""}"
                delivery_notice: "${formData.delivery_notice || ""}"
                is_gst_registered: "${formData.gst_registered || ""}"
                abn: "${formData.abn || ""}"
                gst: "${formData.gst || ""}"
                
                // AU Banking details
                au_invoice_currency: "${formData.au_invoice_currency || ""}"
                au_bank_country: "${formData.au_bank_country || ""}"
                au_bank_name: "${formData.au_bank_name || ""}"
                au_bank_address: "${formData.au_bank_address || ""}"
                au_bank_currency_code: "${formData.au_bank_currency_code || ""}"
                au_bank_clearing_code: "${formData.au_bank_clearing_code || ""}"
                au_remittance_email: "${formData.au_remittance_email || ""}"
                au_bsb: "${formData.au_bsb || ""}"
                au_account: "${formData.au_account || ""}"
                
                // NZ Banking details
                nz_invoice_currency: "${formData.nz_invoice_currency || ""}"
                nz_bank_country: "${formData.nz_bank_country || ""}"
                nz_bank_name: "${formData.nz_bank_name || ""}"
                nz_bank_address: "${formData.nz_bank_address || ""}"
                nz_bank_currency_code: "${formData.nz_bank_currency_code || ""}"
                nz_bank_clearing_code: "${formData.nz_bank_clearing_code || ""}"
                nz_remittance_email: "${formData.nz_remittance_email || ""}"
                nz_bsb: "${formData.nz_bsb || ""}"
                nz_account: "${formData.nz_account || ""}"
                
                // Overseas Banking details
                overseas_iban_switch: "${formData.overseas_iban_switch || ""}"
                overseas_iban: "${formData.overseas_iban || ""}"
                overseas_swift: "${formData.overseas_swift || ""}"
                
                // BPay details
                biller_code: "${formData.biller_code || ""}"
                ref_code: "${formData.ref_code || ""}"
                
                // Update status fields
                status_code: "Procurement Approval"
                status_update_time: "${currentTimestamp}"
                vendor_setup_status: "Pending"
                approval_comment: ""
              }
            ) {
              result
            }
          }
        `
      };

      console.log(`Updating vendor form data for email: ${email}`);

      // Make the GraphQL request to update the vendor
      const updateResponse = await axios.post(graphqlEndpoint, updateVendorMutation, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 50000, // 50 seconds timeout
      });

      // Check for GraphQL errors
      if (updateResponse.data.errors) {
        console.error("GraphQL errors updating vendor:", updateResponse.data.errors);
        return NextResponse.json({
          success: false,
          message: `GraphQL Error updating vendor: ${updateResponse.data.errors[0].message}`,
        }, { status: 400 });
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Vendor form updated and resubmitted for approval successfully",
        data: {
          email: email,
          result: updateResponse.data.data?.updateVendorOnboarding?.result
        },
      });
    }
  } catch (error) {
    console.error("Error updating vendor data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error && process.env.NODE_ENV === 'development' ? error.stack : undefined;
    const errorStatus = error instanceof Error && 'response' in error && error.response?.status ? error.response.status : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update vendor data", 
        message: errorMessage,
        stack: errorStack
      }, 
      { status: errorStatus }
    );
  }
}


export async function formresubmit(
  req: NextRequest,
  context: { params: { email: string } }
) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get and validate email param
    const { email } = context.params;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email parameter" }, { status: 400 });
    }

    // Parse body
    const formData = await req.json();
    const { status_code, delivery_notice } = formData;

    // GraphQL endpoint config
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID!;
    const graphqlId   = process.env.NEXT_PUBLIC_GRAPHQL_ID!;
    const endpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // 1) Verify vendor exists
    const checkResponse = await axios.post(
      endpoint,
      {
        query: `
          query($email: String!) {
            vendorOnboardings(filter: { email: { eq: $email } }) {
              items { email }
            }
          }
        `,
        variables: { email },
      },
      { headers: { 
          Authorization: `Bearer ${session.accessToken}`, 
          "Content-Type": "application/json" 
        } }
    );
    const items = checkResponse.data.data.vendorOnboardings.items;
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: `No vendor with email "${email}"` },
        { status: 404 }
      );
    }

    // 2) Perform the status update
    const now = new Date().toISOString();
    const mutation = `
      mutation(
        $email: String!
        $status: String!
        $time: DateTime!
        $notice: Int
      ) {
        updateVendorOnboarding(
          email: $email
          item: {
            status_code: $status
            status_update_time: $time
            ${delivery_notice != null ? "delivery_notice: $notice" : ""}
          }
        ) {
          result
        }
      }
    `;
    const variables: any = { email, status: status_code, time: now };
    if (typeof delivery_notice === "number") {
      variables.notice = delivery_notice;
    }

    const updateResp = await axios.post(
      endpoint,
      { query: mutation, variables },
      {
        headers: { 
          Authorization: `Bearer ${session.accessToken}`, 
          "Content-Type": "application/json" 
        },
        timeout: 30000,
      }
    );
    if (updateResp.data.errors) {
      throw new Error(updateResp.data.errors[0].message);
    }

    // Prepare response message
    let message = `Vendor status updated to ${status_code}.`;
    if (status_code === "Declined") {
      message = "Vendor declined and sent back for requester review.";
    } else if (status_code === "Creation approved") {
      message = "Vendor fully approved—setup complete.";
    }

    return NextResponse.json({
      success: true,
      message,
      data: { email, status: status_code, result: updateResp.data.data.updateVendorOnboarding.result },
    });
  } catch (err: any) {
    console.error("formresubmit error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}