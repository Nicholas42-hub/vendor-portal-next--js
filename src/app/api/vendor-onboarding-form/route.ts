// src/app/api/vendor-onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";

/**
 * Creates a new vendor onboarding record with junction table for trading entities
 */
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

    // Extract trading entities from form data
    const tradingEntities = formData.generalDetails?.tradingEntities || [];
    
    // Ensure we have approvers for the business unit
    let approverInfo = {};
    try {
      const businessUnit = formData.generalDetails?.primaryTradingBusinessUnit;
      if (businessUnit) {
        // Attempt to get approvers from the approvers API
        const approversResponse = await axios.get(`${process.env.NEXTAUTH_URL}/api/approvers?businessUnit=${businessUnit}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          }
        });
        
        if (approversResponse.data.success && approversResponse.data.approvers?.length > 0) {
          const firstApprover = approversResponse.data.approvers[0];
          approverInfo = {
            current_approver: firstApprover.approver1,
            current_approver_name: firstApprover.approverName || firstApprover.approver1
          };
        }
      }
    } catch (error) {
      console.log("Error fetching approvers, using default:", error);
      // No action needed, we'll use default values
    }

    // Ensure tradingEntities is an array of strings
    const formattedTradingEntities = tradingEntities.map(entity => String(entity));
    
    // Prepare the GraphQL mutation
    const mutation = {
      query: `
        mutation CreateVendorOnboarding($input: VendorOnboardingInput!, $tradingEntities: [String!]!) {
          createVendor(input: $input, tradingEntities: $tradingEntities) {
            vendor_id
            success
            message
          }
        }
      `,
      variables: {
        tradingEntities: formattedTradingEntities,
        input: {
          // General Details
          vendor_home_country: formData.generalDetails?.vendorHomeCountry || "",
          primary_trading_business_unit: formData.generalDetails?.primaryTradingBusinessUnit || "",
          email: formData.generalDetails?.email || "",
          business_name: formData.generalDetails?.businessName || "",
          trading_name: formData.generalDetails?.tradingName || "",
          vendor_type: formData.generalDetails?.vendorType || "",
          
          // Contact Information
          contact_person: formData.contactDetails?.contactPerson || "",
          contact_phone: formData.contactDetails?.contactPhone || "",
          website_url: formData.contactDetails?.websiteUrl || "",
          postal_address: formData.contactDetails?.postalAddress || "",
          city: formData.contactDetails?.city || "",
          state: formData.contactDetails?.state || "",
          postcode: formData.contactDetails?.postcode || "",
          
          // ABN/GST Information
          is_gst_registered: formData.contactDetails?.isGstRegistered || "",
          abn: formData.contactDetails?.abn || "",
          gst: formData.contactDetails?.gst || "",
          
          // Trading Terms
          quotes_obtained: formData.tradingTerms?.quotesObtained || "",
          quotes_obtained_reason: formData.tradingTerms?.quotesObtainedReason || "",
          quotes_pdf_url: formData.tradingTerms?.quotesPdfUrl || "",
          back_order: formData.tradingTerms?.backOrder || "",
          
          // Supply Terms
          exclusive_supply: formData.supplyTerms?.exclusiveSupply || "",
          sale_or_return: formData.supplyTerms?.saleOrReturn || "",
          auth_required: formData.supplyTerms?.authRequired || "",
          delivery_notice: parseInt(formData.supplyTerms?.deliveryNotice) || 0,
          min_order_value: parseFloat(formData.supplyTerms?.minOrderValue) || 0,
          min_order_quantity: parseInt(formData.supplyTerms?.minOrderQuantity) || 0,
          max_order_value: parseFloat(formData.supplyTerms?.maxOrderValue) || 0,
          other_comments: formData.supplyTerms?.otherComments || "",
          
          // Financial Terms
          payment_terms: formData.financialTerms?.paymentTerms || "",
          order_expiry_days: parseInt(formData.financialTerms?.orderExpiryDays) || 0,
          gross_margin: formData.financialTerms?.grossMargin || "",
          invoice_discount: formData.financialTerms?.invoiceDiscount || "",
          invoice_discount_value: formData.financialTerms?.invoiceDiscountValue || "",
          settlement_discount: formData.financialTerms?.settlementDiscount || "",
          settlement_discount_value: formData.financialTerms?.settlementDiscountValue || "",
          settlement_discount_days: formData.financialTerms?.settlementDiscountDays || "",
          
          // Rebate Information
          flat_rebate: formData.financialTerms?.flatRebate || "",
          flat_rebate_percent: formData.financialTerms?.flatRebatePercent || "",
          flat_rebate_dollar: formData.financialTerms?.flatRebateDollar || "",
          flat_rebate_term: formData.financialTerms?.flatRebateTerm || "",
          
          growth_rebate: formData.financialTerms?.growthRebate || "",
          growth_rebate_percent: formData.financialTerms?.growthRebatePercent || "",
          growth_rebate_dollar: formData.financialTerms?.growthRebateDollar || "",
          growth_rebate_term: formData.financialTerms?.growthRebateTerm || "",
          
          marketing_rebate: formData.financialTerms?.marketingRebate || "",
          marketing_rebate_percent: formData.financialTerms?.marketingRebatePercent || "",
          marketing_rebate_dollar: formData.financialTerms?.marketingRebateDollar || "",
          marketing_rebate_term: formData.financialTerms?.marketingRebateTerm || "",
          
          promotional_fund: formData.financialTerms?.promotionalFund || "",
          promotional_fund_value: formData.financialTerms?.promotionalFundValue || "",
          
          // Bank Information based on country
          au_invoice_currency: formData.bankingDetails?.au?.invoiceCurrency || "",
          au_bank_name: formData.bankingDetails?.au?.bankName || "",
          au_bsb: formData.bankingDetails?.au?.bsb || "",
          au_account: formData.bankingDetails?.au?.account || "",
          
          nz_invoice_currency: formData.bankingDetails?.nz?.invoiceCurrency || "",
          nz_bank_name: formData.bankingDetails?.nz?.bankName || "",
          nz_bsb: formData.bankingDetails?.nz?.bsb || "",
          nz_account: formData.bankingDetails?.nz?.account || "",
          
          overseas_iban_switch: formData.bankingDetails?.overseas?.ibanSwitch || "",
          overseas_iban: formData.bankingDetails?.overseas?.iban || "",
          overseas_swift: formData.bankingDetails?.overseas?.swift || "",
          
          // BPay Information
          biller_code: formData.bankingDetails?.bpay?.billerCode || "",
          ref_code: formData.bankingDetails?.bpay?.refCode || "",
          
          // Submission details
          created_by: session.user?.email || null,
          
          // Approver information (from earlier fetch)
          ...approverInfo,
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
      message: "Vendor onboarding form submitted successfully",
      data: response.data.data.createVendor,
    });
  } catch (error) {
    console.error("Error submitting vendor form:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error submitting vendor form: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

/**
 * Retrieves vendor data with their associated trading entities
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const vendorId = url.searchParams.get('id');
    const email = url.searchParams.get('email');
    const status = url.searchParams.get('status');
    const businessUnit = url.searchParams.get('businessUnit');
    const entityId = url.searchParams.get('entityId'); // New parameter to filter by trading entity
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    let query;
    let variables: any = {};

    // Determine which query to use based on parameters
    if (vendorId) {
      // Get vendor by ID with trading entities
      query = `
        query GetVendor($id: ID!) {
          vendor(id: $id) {
            vendor_id
            status_code
            vendor_home_country
            primary_trading_business_unit
            email
            business_name
            trading_name
            vendor_type
            trading_entities {
              entity_id
              entity_name
              entity_description
            }
            # Add other fields as needed
          }
        }
      `;
      variables = { id: vendorId };
    } else if (email) {
      // Get vendor by email with trading entities
      query = `
        query GetVendorByEmail($email: String!) {
          vendorByEmail(email: $email) {
            vendor_id
            status_code
            vendor_home_country
            primary_trading_business_unit
            email
            business_name
            trading_name
            vendor_type
            trading_entities {
              entity_id
              entity_name
              entity_description
            }
            # Add other fields as needed
          }
        }
      `;
      variables = { email };
    } else {
      // Get vendors with optional filtering
      query = `
        query GetVendors($filter: VendorFilterInput, $pagination: PaginationInput) {
          vendors(filter: $filter, pagination: $pagination) {
            vendors {
              vendor_id
              business_name
              email
              primary_trading_business_unit
              status_code
              created_on
              created_by
              trading_entities {
                entity_id
                entity_name
              }
              # Add any other fields needed for listing
            }
            total_count
            page
            page_size
          }
        }
      `;
      
      // Build filter object
      const filter: any = {};
      if (status) filter.status_code = status;
      if (businessUnit) filter.primary_trading_business_unit = businessUnit;
      if (entityId) filter.entity_id = entityId; // Use the trading entity filter
      
      variables = {
        filter,
        pagination: { page, pageSize }
      };
    }

    // Make the GraphQL request
    const response = await axios.post(graphqlEndpoint, 
      { query, variables }, 
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Check for GraphQL errors
    if (response.data.errors) {
      return NextResponse.json({
        success: false,
        message: `GraphQL Error: ${response.data.errors[0].message}`,
      }, { status: 400 });
    }

    // Return the data
    return NextResponse.json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    console.error("Error fetching vendor data:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error fetching vendor data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

/**
 * Updates an existing vendor with their trading entities
 */
export async function PATCH(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse the request body
    const data = await req.json();
    const { id, tradingEntities, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: "Vendor ID is required" 
      }, { status: 400 });
    }

    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // Prepare the GraphQL mutation
    const mutation = {
      query: `
        mutation UpdateVendor($id: ID!, $input: VendorOnboardingInput!, $tradingEntities: [String!]) {
          updateVendor(id: $id, input: $input, tradingEntities: $tradingEntities) {
            vendor_id
            success
            message
          }
        }
      `,
      variables: {
        id,
        tradingEntities: tradingEntities || null, // Only include if provided
        input: {
          ...updateData,
          modified_by: session.user?.email || null,
          modified_on: new Date().toISOString()
        }
      }
    };

    // Make the GraphQL request
    const response = await axios.post(graphqlEndpoint, mutation, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Check for GraphQL errors
    if (response.data.errors) {
      return NextResponse.json({
        success: false,
        message: `GraphQL Error: ${response.data.errors[0].message}`,
      }, { status: 400 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully",
      data: response.data.data.updateVendor,
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error updating vendor: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

/**
 * Processes vendor approval actions
 */
export async function PUT(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse the request body
    const data = await req.json();
    const { vendorId, action, comments } = data;

    if (!vendorId || !action) {
      return NextResponse.json({ 
        success: false, 
        message: "Vendor ID and action are required" 
      }, { status: 400 });
    }

    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // Prepare the GraphQL mutation for approval actions
    const mutation = {
      query: `
        mutation ProcessVendorApproval($input: VendorApprovalInput!) {
          processVendorApproval(input: $input) {
            vendor_id
            success
            message
            new_status
          }
        }
      `,
      variables: {
        input: {
          vendor_id: vendorId,
          action: action.toUpperCase(),
          comments
        }
      }
    };

    // Make the GraphQL request
    const response = await axios.post(graphqlEndpoint, mutation, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Check for GraphQL errors
    if (response.data.errors) {
      return NextResponse.json({
        success: false,
        message: `GraphQL Error: ${response.data.errors[0].message}`,
      }, { status: 400 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Vendor ${action.toLowerCase()} processed successfully`,
      data: response.data.data.processVendorApproval,
    });
  } catch (error) {
    console.error("Error processing vendor approval:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error processing vendor approval: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

/**
 * Deletes a vendor record
 */
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the vendor ID from the query parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: "Vendor ID is required" 
      }, { status: 400 });
    }

    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // Prepare the GraphQL mutation for deletion
    const mutation = {
      query: `
        mutation DeleteVendor($id: ID!) {
          deleteVendor(id: $id)
        }
      `,
      variables: { id }
    };

    // Make the GraphQL request
    const response = await axios.post(graphqlEndpoint, mutation, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Check for GraphQL errors
    if (response.data.errors) {
      return NextResponse.json({
        success: false,
        message: `GraphQL Error: ${response.data.errors[0].message}`,
      }, { status: 400 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error deleting vendor: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}