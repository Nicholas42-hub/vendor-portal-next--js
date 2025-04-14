import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import axios from "axios";

/**
 * Updates an existing vendor onboarding record with supplier form data based on email
 */
export async function PUT(req: NextRequest,context: { params: { email: string } }) {
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
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // First, check if vendor record exists with this email
    const checkEmailQuery = {
      query: `
        query {
          vendorOnboardings(filter: {email: {eq: "${email}"}}) {
            items {
              vendor_onboarding_id
              email
              status_code
            }
          }
        }
      `
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
        message: `No vendor record found with email "${formData.email}". Please ensure the vendor is onboarded first.`
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
            id: "${vendorId}"
            item: {
              modified_on: "${currentTimestamp}"
              modified_by: "${userEmail}"
              
              business_name: "${formData.business_name || ""}"
              trading_name: "${formData.trading_name || ""}"
              contact_person: "${formData.contact_person || ""}"
              contact_phone: "${formData.contact_phone || ""}"
              
              website_url: "${formData.website_url || ""}"
              postal_address: "${formData.postal_address || ""}"
              city: "${formData.city || ""}"
              state: "${formData.state || ""}"
              postcode: "${formData.postcode || ""}"
              
              is_gst_registered: "${formData.is_gst_registered || ""}"
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
              status_code: "Supplier Form Completed"
              status_code_record: "${formData.status_code_record || ""}"
              status_update_time: "${currentTimestamp}"
              vendor_setup_status: "${formData.vendor_setup_status || "Pending"}"
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
      timeout: 30000, // 30 seconds timeout
    });

    // Check for GraphQL errors
    if (updateResponse.data.errors) {
      console.error("GraphQL errors updating vendor:", updateResponse.data.errors);
      return NextResponse.json({
        success: false,
        message: `GraphQL Error updating vendor: ${updateResponse.data.errors[0].message}`,
      }, { status: 400 });
    }

    // If we have trading entities, handle them
    if (Array.isArray(formData.trading_entities) && formData.trading_entities.length > 0) {
      console.log("Updating trading entity relationships...");
      
      // First, we'll get existing trading entities for this vendor
      const getExistingEntitiesQuery = {
        query: `
          query {
            vendorTradingEntities(filter: {email: {eq: "${formData.email}"}}) {
              items {
                id
                TradingEntityId
              }
            }
          }
        `
      };
      
      const existingEntitiesResponse = await axios.post(graphqlEndpoint, getExistingEntitiesQuery, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        }
      });
      
      const existingEntities = existingEntitiesResponse.data.data?.vendorTradingEntities?.items || [];
      const existingEntityIds = existingEntities.map(entity => entity.TradingEntityId);
      
      // Determine which entities to add and which might need to be removed
      const newEntities = formData.trading_entities.filter(
        entityId => !existingEntityIds.includes(String(entityId))
      );
      
      // Create any new trading entity relationships
      if (newEntities.length > 0) {
        const tradingEntityPromises = newEntities.map(async (entityId) => {
          const createTradingEntityMutation = {
            query: `
              mutation {
                createVendorTradingEntities(
                  item: {
                    email: "${formData.email}"
                    TradingEntityId: "${String(entityId)}"
                  }
                ) {
                  result
                }
              }
            `,
          };
          
          return axios.post(graphqlEndpoint, createTradingEntityMutation, {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              "Content-Type": "application/json",
            },
          });
        });
        
        try {
          await Promise.all(tradingEntityPromises);
          console.log(`Added ${newEntities.length} new trading entity relationships`);
        } catch (tradingEntityError) {
          console.error("Error adding new trading entities:", tradingEntityError);
          // We'll still return success for the vendor update even if some trading entities fail
        }
      }
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
  } catch (error) {
    console.error("Error updating vendor with supplier form:", error);
    
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || 
                          error.response?.data?.message || 
                          error.message;
      
      return NextResponse.json({
        success: false,
        message: `API Error: ${errorMessage}`,
      }, { status: error.response?.status || 500 });
    }
    
    return NextResponse.json(
      {
        success: false,
        message: `Error updating vendor with supplier form: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}

/**
 * Gets a supplier form by email (used for checking status or prefilling)
 */
export async function GET(req: NextRequest) {
  try {
    // Get the email from query parameters
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    // If no email parameter, return API status
    if (!email) {
      return NextResponse.json({
        success: true,
        message: "Supplier form API is available",
      });
    }
    
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
    
    // Query for the vendor onboarding record with this email
    const getVendorQuery = {
      query: `
        query {
          vendorOnboardings(filter: {email: {eq: "${email}"}}) {
            items {
              vendor_onboarding_id
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
      `
    };
    
    const vendorResponse = await axios.post(graphqlEndpoint, getVendorQuery, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      }
    });
    
    // Get vendor record with this email
    const vendorRecords = vendorResponse.data.data?.vendorOnboardings?.items || [];
    
    if (vendorRecords.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No vendor record found with email "${email}"`,
        exists: false
      }, { status: 404 });
    }
    
    // Get associated trading entities
    const getTradingEntitiesQuery = {
      query: `
        query {
          vendorTradingEntities(filter: {email: {eq: "${email}"}}) {
            items {
              id
              TradingEntityId
            }
          }
        }
      `
    };
    
    const tradingEntitiesResponse = await axios.post(graphqlEndpoint, getTradingEntitiesQuery, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      }
    });
    
    const tradingEntities = tradingEntitiesResponse.data.data?.vendorTradingEntities?.items || [];
    const tradingEntityIds = tradingEntities.map(entity => entity.TradingEntityId);
    
    // Return the vendor record with trading entities
    return NextResponse.json({
      success: true,
      exists: true,
      data: {
        ...vendorRecords[0],
        trading_entities: tradingEntityIds
      }
    });
  } catch (error) {
    console.error("Error getting supplier form:", error);
    return NextResponse.json({
      success: false,
      message: "Error getting supplier form",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}