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
              email
              business_name
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

    const vendorInfo = contacts[0];
    
    // Use a more robust method to determine payment country
    const determinePaymentCountry = (entityId: string) => {
      if (!entityId) return "Unknown";
      
      // This should ideally come from a configuration or database
      if (entityId.startsWith("A")) return "Australia";
      if (entityId.startsWith("N")) return "New Zealand";
      return "Unknown";
    };

    const relatedEntities = entities
      .filter((e: any) => e.email === email && e.TradingEntityId)
      .map((e: any) => ({
        email: e.email,
        TradingEntityId: e.TradingEntityId,
        paymentCountry: determinePaymentCountry(e.TradingEntityId)
      }));
      console.log(relatedEntities)
    return NextResponse.json({ email, vendorInfo, tradingEntities: relatedEntities });
  } catch (error: any) {
    console.error("Error fetching vendor data:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor data", message: error.message }, 
      { status: error.response?.status || 500 }
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
    const vendorId = existingVendor.vendor_onboarding_id;
    console.log(`Found existing vendor with ID: ${vendorId} and email: ${existingVendor.email}`);

    // Current timestamp for modified_on
    const currentTimestamp = new Date().toISOString();
    const userEmail = session.user?.email || "";

    // Construct the GraphQL mutation to update the vendor onboarding record
    const updateVendorMutation = {
      query: `
        mutation {
          updateVendorOnboarding(
            email: "${email}"
            item: {
              # Basic supplier information
              business_name: "${escapeString(formData.business_name || "")}"
              trading_name: "${escapeString(formData.trading_name || "")}"
              country: "${escapeString(formData.country || "")}"
              is_gst_registered: "${escapeString(formData.gst_registered || "")}"
              gst_registered: "${escapeString(formData.gst_registered || "")}"
              abn: "${escapeString(formData.abn || "")}"
              gst: "${escapeString(formData.gst || "")}"
              address: "${escapeString(formData.address || "")}"
              website: "${escapeString(formData.website || "")}"
              city: "${escapeString(formData.city || "")}"
              state: "${escapeString(formData.state || "")}"
              postcode: "${escapeString(formData.postcode || "")}"
              po_email: "${escapeString(formData.po_email || "")}"
              telephone: "${escapeString(formData.telephone || "")}"
              primary_contact_email: "${escapeString(formData.primary_contact_email || "")}"
              contact_phone: "${escapeString(formData.telephone || "")}"
              return_order_email: "${escapeString(formData.return_order_email || "")}"
              
              has_tax_id: "${escapeString(formData.has_tax_id || "")}"
              ABN_GST: "${escapeString(formData.ABN_GST || "")}"
              
              au_payment_method: "${escapeString(formData.au_payment_method || "")}"
              nz_payment_method: "${escapeString(formData.nz_payment_method || "")}"
              
              au_invoice_currency: "${escapeString(formData.au_invoice_currency || "")}"
              au_bank_country: "${escapeString(formData.au_bank_country || "")}"
              au_bank_address: "${escapeString(formData.au_bank_address || "")}"
              au_bank_currency_code: "${escapeString(formData.au_bank_currency_code || "")}"
              au_bank_clearing_code: "${escapeString(formData.au_bank_clearing_code || "")}"
              au_remittance_email: "${escapeString(formData.au_remittance_email || "")}"
              au_bsb: "${escapeString(formData.au_bsb || "")}"
              au_account: "${escapeString(formData.au_account || "")}"
              
              au_iban_switch: "${escapeString(formData.au_iban_switch || "")}"
              au_iban: "${escapeString(formData.au_iban || "")}"
              au_swift: "${escapeString(formData.au_swift || "")}"
              au_biller_code: "${escapeString(formData.au_biller_code || "")}"
              au_ref_code: "${escapeString(formData.au_ref_code || "")}"
              
              nz_invoice_currency: "${escapeString(formData.nz_invoice_currency || "")}"
              nz_bank_country: "${escapeString(formData.nz_bank_country || "")}"
              nz_bank_address: "${escapeString(formData.nz_bank_address || "")}"
              nz_bank_currency_code: "${escapeString(formData.nz_bank_currency_code || "")}"
              nz_bank_clearing_code: "${escapeString(formData.nz_bank_clearing_code || "")}"
              nz_remittance_email: "${escapeString(formData.nz_remittance_email || "")}"
              nz_bsb: "${escapeString(formData.nz_bsb || "")}"
              nz_account: "${escapeString(formData.nz_account || "")}"
              
              nz_iban_switch: "${escapeString(formData.nz_iban_switch || "")}"
              nz_iban: "${escapeString(formData.nz_iban || "")}"
              nz_swift: "${escapeString(formData.nz_swift || "")}"
              nz_biller_code: "${escapeString(formData.nz_biller_code || "")}"
              nz_ref_code: "${escapeString(formData.nz_ref_code || "")}"
              
              status_code: "Requester review"
              modified_on: "${currentTimestamp}"
              modified_by: "${escapeString(userEmail)}"

            }
          ) {
            result
          }
        }
      `
    };

    console.log(`Updating vendor record with ID: ${vendorId}`);

    // Make the GraphQL request to update the vendor
    const updateResponse = await axios.post(graphqlEndpoint, updateVendorMutation, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 50000, // 30 seconds timeout
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
      message: "Supplier form submitted and vendor record updated successfully",
      data: {
        vendorId: vendorId,
        email: formData.email,
        result: updateResponse.data.data?.updateVendorOnboarding?.result
      },
    });
  } catch (error: any) {
    console.error("Error updating vendor data:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update vendor data", 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: error.response?.status || 500 }
    );
  }
}

// Helper function to escape GraphQL string values
function escapeString(value: string): string {
  if (!value) return "";
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
