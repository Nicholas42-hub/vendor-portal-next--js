import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import axios from "axios";

/**
 * Sanitizes and escapes string values for GraphQL queries to prevent injection attacks
 * @param value The string value to escape
 * @returns Escaped string safe for GraphQL queries
 */
function escapeGraphQLString(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const stringValue = String(value);
  return stringValue
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

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
              created_on
              created_by
              modified_on
              modified_by
              vendor_home_country
              primary_trading_business_unit
              email
              business_name
              trading_name
              vendor_type
              contact_person
              contact_phone
              website
              postal_address
              city
              state
              postcode
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
              vendor_setup_status
              status_code
              status_code_record
              status_update_time
              approval_comment
              current_approver
              current_approver_name
              next_approver
              next_approver_name
              au_iban_switch
              au_iban
              au_swift
              au_biller_code
              au_ref_code
              nz_iban_switch
              nz_iban
              nz_swift
              nz_biller_code
              nz_ref_code
              country
              gst_registered
              address
              primary_contact_email
              return_order_email
              has_tax_id
              ABN_GST
              au_payment_method
              nz_payment_method
              po_email
              telephone
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
    if (formData.status_code === "Declined" || formData.status_code === "Requester review") {
      // This is an approval action - only update status fields
      console.log(`Updating approval status to: ${formData.status_code}`);
      
      // Handle vendor setup status based on status code
      let vendorSetupStatus = "Pending";
      if (formData.status_code === "Creation approved") {
        vendorSetupStatus = "Active";
      } else if (formData.status_code === "Declined") {
        vendorSetupStatus = "Declined";
      }
      

// For status updates, use a minimal mutation
const updateStatusMutation = {
  query: `
        mutation {
          updateVendorOnboarding(
            email: "${email}"
            item: {
          status_code: "${formData.status_code}"
          status_update_time: "${currentTimestamp}"
          approval_comment: "${formData.approval_comment || ''}"
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
                business_name: "${escapeGraphQLString(formData.business_name)}"
                trading_name: "${escapeGraphQLString(formData.trading_name)}"
                country: "${escapeGraphQLString(formData.country)}"
                address: "${escapeGraphQLString(formData.address)}"
                website: "${escapeGraphQLString(formData.website)}"
                city: "${escapeGraphQLString(formData.city)}"
                state: "${escapeGraphQLString(formData.state)}"
                postcode: "${escapeGraphQLString(formData.postcode)}"
                
                # Contact information
                contact_person: "${escapeGraphQLString(formData.primary_contact_email)}"
                contact_phone: "${escapeGraphQLString(formData.telephone)}"
                primary_contact_email: "${escapeGraphQLString(formData.primary_contact_email)}"
                po_email: "${escapeGraphQLString(formData.po_email)}"
                return_order_email: "${escapeGraphQLString(formData.return_order_email)}"
                telephone: "${escapeGraphQLString(formData.telephone)}"
                payment_terms: "${escapeGraphQLString(formData.payment_terms)}"
                # Tax information
                gst_registered: "${escapeGraphQLString(formData.gst_registered)}"
                abn: "${escapeGraphQLString(formData.abn)}"
                gst: "${escapeGraphQLString(formData.gst)}"
                has_tax_id: "${escapeGraphQLString(formData.has_tax_id)}"
                ABN_GST: "${escapeGraphQLString(formData.ABN_GST)}"
                
                # Delivery information
                delivery_notice: ${parseInt(formData.delivery_notice) || 0}
                
                # AU banking details
                au_payment_method: "${escapeGraphQLString(formData.au_payment_method)}"
                au_invoice_currency: "${escapeGraphQLString(formData.au_invoice_currency)}"
                au_bank_country: "${escapeGraphQLString(formData.au_bank_country)}"
                au_bank_name: "${escapeGraphQLString(formData.au_bank_name)}"
                au_bank_address: "${escapeGraphQLString(formData.au_bank_address)}"
                au_bank_currency_code: "${escapeGraphQLString(formData.au_bank_currency_code)}"
                au_bank_clearing_code: "${escapeGraphQLString(formData.au_bank_clearing_code)}"
                au_remittance_email: "${escapeGraphQLString(formData.au_remittance_email)}"
                au_bsb: "${escapeGraphQLString(formData.au_bsb)}"
                au_account: "${escapeGraphQLString(formData.au_account)}"
                au_iban_switch: "${escapeGraphQLString(formData.au_iban_switch)}"
                au_iban: "${escapeGraphQLString(formData.au_iban)}"
                au_swift: "${escapeGraphQLString(formData.au_swift)}"
                au_biller_code: "${escapeGraphQLString(formData.au_biller_code)}"
                au_ref_code: "${escapeGraphQLString(formData.au_ref_code)}"
                
                # NZ banking details
                nz_payment_method: "${escapeGraphQLString(formData.nz_payment_method)}"
                nz_invoice_currency: "${escapeGraphQLString(formData.nz_invoice_currency)}"
                nz_bank_country: "${escapeGraphQLString(formData.nz_bank_country)}"
                nz_bank_name: "${escapeGraphQLString(formData.nz_bank_name)}"
                nz_bank_address: "${escapeGraphQLString(formData.nz_bank_address)}"
                nz_bank_currency_code: "${escapeGraphQLString(formData.nz_bank_currency_code)}"
                nz_bank_clearing_code: "${escapeGraphQLString(formData.nz_bank_clearing_code)}"
                nz_remittance_email: "${escapeGraphQLString(formData.nz_remittance_email)}"
                nz_bsb: "${escapeGraphQLString(formData.nz_bsb)}"
                nz_account: "${escapeGraphQLString(formData.nz_account)}"
                nz_iban_switch: "${escapeGraphQLString(formData.nz_iban_switch)}"
                nz_iban: "${escapeGraphQLString(formData.nz_iban)}"
                nz_swift: "${escapeGraphQLString(formData.nz_swift)}"
                nz_biller_code: "${escapeGraphQLString(formData.nz_biller_code)}"
                nz_ref_code: "${escapeGraphQLString(formData.nz_ref_code)}"
                
                # Promotional information
                promotional_fund: "${escapeGraphQLString(formData.promotional_fund)}"
                promotional_fund_value: "${escapeGraphQLString(formData.promotional_fund_value)}"
                
                # Status information - preserved as hardcoded values
                status_code: "Procurement Approval"
                status_update_time: "${currentTimestamp}"
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
