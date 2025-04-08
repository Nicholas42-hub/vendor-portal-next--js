import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse the request body
    const formData = await req.json();

    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // Construct the GraphQL mutation to submit the supplier form
    const mutation = {
      query: `
        mutation CreateSupplierOnboarding($input: SupplierOnboardingInput!) {
          createSupplierOnboarding(input: $input) {
            id
            success
            message
          }
        }
      `,
      variables: {
        input: {
          business_name: formData.business_name,
          trading_name: formData.trading_name,
          country: formData.country,
          gst_registered: formData.gst_registered,
          abn: formData.abn || null,
          gst: formData.gst || null,
          address: formData.address || null,
          website: formData.website || null,
          postal_address: formData.postal_address,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          primary_contact_email: formData.primary_contact_email,
          telephone: formData.telephone,
          po_email: formData.po_email,
          return_order_email: formData.return_order_email,
          trading_entities: formData.trading_entities,
          payment_method: formData.payment_method,
          // AU Banking details
          au_invoice_currency: formData.au_invoice_currency || null,
          au_bank_country: formData.au_bank_country || null,
          au_bank_address: formData.au_bank_address || null,
          au_bank_currency_code: formData.au_bank_currency_code || null,
          au_bank_clearing_code: formData.au_bank_clearing_code || null,
          au_remittance_email: formData.au_remittance_email || null,
          au_bsb: formData.au_bsb || null,
          au_account: formData.au_account || null,
          // NZ Banking details
          nz_invoice_currency: formData.nz_invoice_currency || null,
          nz_bank_country: formData.nz_bank_country || null,
          nz_bank_address: formData.nz_bank_address || null,
          nz_bank_currency_code: formData.nz_bank_currency_code || null,
          nz_bank_clearing_code: formData.nz_bank_clearing_code || null,
          nz_remittance_email: formData.nz_remittance_email || null,
          nz_bsb: formData.nz_bsb || null,
          nz_account: formData.nz_account || null,
          // Overseas Banking details
          overseas_iban_switch: formData.overseas_iban_switch || null,
          overseas_iban: formData.overseas_iban || null,
          overseas_swift: formData.overseas_swift || null,
          // BPay details
          biller_code: formData.biller_code || null,
          ref_code: formData.ref_code || null,
          // Submission details
          submitted_by: session.user?.email || null,
          submitted_at: new Date().toISOString(),
          status: "Pending",
        },
      },
    };

    // Make the GraphQL request
    const response = await axios.post(graphqlEndpoint, mutation, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Check response status
    if (response.status !== 200) {
      return NextResponse.json({
        success: false,
        message: `Connection failed with status: ${response.status}`,
      });
    }

    // Check for GraphQL errors
    if (response.data.errors) {
      return NextResponse.json({
        success: false,
        message: `GraphQL Error: ${response.data.errors[0].message}`,
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Supplier onboarding form submitted successfully",
      data: response.data.data.createSupplierOnboarding,
    });
  } catch (error) {
    console.error("Error submitting supplier form:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error submitting supplier form: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}