// src/app/api/vendor-onboarding-form/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";

/**
 * Generate a UUID v4 without external dependencies
 */
function generateUUID() {
  let d = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

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
    console.log("Received form data:", formData);

    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // Extract general details and trading entities from form data
    const generalDetails = formData.generalDetails || {};
    const tradingEntities = generalDetails.tradingEntities || [];
    
    // Get the trading terms, supply terms, and financial terms from the form data
    const tradingTerms = formData.tradingTerms || {};
    const supplyTerms = formData.supplyTerms || {};
    const financialTerms = formData.financialTerms || {};

    // Current timestamp for created_on
    const currentTimestamp = new Date().toISOString();
    const userEmail = session.user?.email || "";
    const vendorEmail = generalDetails.email || "";

    // Validate email is provided
    if (!vendorEmail) {
      return NextResponse.json({
        success: false,
        message: "Vendor email is required",
      }, { status: 400 });
    }

    console.log(`Checking if vendor with email "${vendorEmail}" already exists...`);
    
    // First, check if a vendor with this email already exists
    const checkEmailQuery = {
      query: `
        query {
          vendorOnboardings(filter: {email: {eq: "${vendorEmail}"}}) {
            items {
              email
            }
          }
        }
      `
    };

    let emailIsUnique = false;
    
    try {
      const emailCheckResponse = await axios.post(graphqlEndpoint, checkEmailQuery, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        }
      });

      // Get existing vendors with this email
      const existingVendors = emailCheckResponse.data.data?.VendorOnboarding?.items || [];
      console.log(emailCheckResponse)
      if (existingVendors.length > 0) {
        const existingVendor = existingVendors[0];
        console.log(`Found existing vendor with email "${vendorEmail}": `, existingVendor);
        
        return NextResponse.json({
          success: false,
          message: `A vendor with email "${vendorEmail}" already exists. Please use a different email or update the existing vendor.`,
          existingVendor: existingVendor
        }, { status: 400 });
      } else {
        console.log(`No existing vendor found with email "${vendorEmail}"`);
        emailIsUnique = true;
      }
    } catch (error) {
      console.error("Error checking for existing vendor email:", error);
      
      // Don't continue if we couldn't verify email uniqueness
      return NextResponse.json({
        success: false,
        message: "Could not verify email uniqueness. Please try again later.",
      }, { status: 500 });
    }

    // Only proceed if the email is unique
    if (!emailIsUnique) {
      return NextResponse.json({
        success: false,
        message: "Email uniqueness check failed",
      }, { status: 500 });
    }

    // Generate a UUID for the vendor_onboarding_id
    const vendorUuid = generateUUID();

    // Create the vendor record with the required fields
    const createVendorMutation = {
      query: `
        mutation {
          createVendorOnboarding(
            item: {
              vendor_onboarding_id: "${vendorUuid}"
              created_on: "${currentTimestamp}"
              created_by: "${userEmail}"
              modified_on: "${currentTimestamp}"
              modified_by: "${userEmail}"
              
              vendor_home_country: "${generalDetails.vendor_home_country || ""}"
              primary_trading_business_unit: "${generalDetails.primary_trading_business_unit || ""}"
              email: "${vendorEmail}"
              business_name: "${generalDetails.business_name || ""}"
              trading_name: "${generalDetails.tradingName || ""}"
              vendor_type: "${generalDetails.vendor_type || ""}"
              
              quotes_obtained: "${tradingTerms.quotes_obtained || ""}"
              quotes_obtained_reason: "${tradingTerms.quotes_obtained_reason || ""}"
              quotes_pdf_url: ""
              back_order: "${tradingTerms. back_order || ""}"
              
              exclusive_supply: "${supplyTerms.exclusive_supply || ""}"
              sale_or_return: "${supplyTerms.sale_or_return || ""}"
              auth_required: "${supplyTerms.auth_required || ""}"
              delivery_notice: ${Number(supplyTerms.delivery_notice) || 0}
              min_order_value: ${Number(supplyTerms.min_order_value) || 0}
              min_order_quantity: ${Number(supplyTerms.min_order_quantity) || 0}
              max_order_value: ${Number(supplyTerms.max_order_value) || 0}
              other_comments: "${supplyTerms.other_comments || ""}"
              
              payment_terms: "${financialTerms.payment_terms || ""}"
              order_expiry_days: ${Number(financialTerms.order_expiry_days) || 0}
              gross_margin: "${financialTerms.gross_margin || ""}"
              invoice_discount: "${financialTerms.invoice_discount || ""}"
              invoice_discount_value: "${financialTerms.invoice_discount_value || ""}"
              settlement_discount: "${financialTerms.settlement_discount || ""}"
              settlement_discount_value: "${financialTerms.settlement_discount_value || ""}"
              settlement_discount_days: "${financialTerms.settlement_discount_days || ""}"
              
              flat_rebate: "${financialTerms.flat_rebate || ""}"
              flat_rebate_percent: "${financialTerms.flat_rebate_percent || ""}"
              flat_rebate_dollar: "${financialTerms.flat_rebate_dollar || ""}"
              flat_rebate_term: "${financialTerms.flat_rebate_term || ""}"
              
              growth_rebate: "${financialTerms.growth_rebate || ""}"
              growth_rebate_percent: "${financialTerms.growth_rebate_percent || ""}"
              growth_rebate_dollar: "${financialTerms.growth_rebate_dollar || ""}"
              growth_rebate_term: "${financialTerms.growth_rebate_term || ""}"
              
              marketing_rebate: "${financialTerms.marketing_rebate || ""}"
              marketing_rebate_percent: "${financialTerms.marketing_rebate_percent || ""}"
              marketing_rebate_dollar: "${financialTerms.marketing_rebate_dollar || ""}"
              marketing_rebate_term: "${financialTerms.marketing_rebate_term || ""}"
              
              promotional_fund: "${financialTerms.promotional_fund || ""}"
              promotional_fund_value: "${financialTerms.promotional_fund_value || ""}"
              
              status_code: "Invitation Sent"
            }
          ) {
            result
          }
        }
      `,
    };

    console.log("Submitting create vendor mutation with UUID:", vendorUuid);

    // Make the GraphQL request to create the vendor
    try {
      const vendorResponse = await axios.post(graphqlEndpoint, createVendorMutation, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 seconds timeout
      });

      // Check for GraphQL errors
      if (vendorResponse.data.errors) {
        console.error("GraphQL errors creating vendor:", vendorResponse.data.errors);
        return NextResponse.json({
          success: false,
          message: `GraphQL Error creating vendor: ${vendorResponse.data.errors[0].message}`,
        }, { status: 400 });
      }

      console.log("Vendor created successfully:", vendorResponse.data);

      // If we have trading entities, create entries in the junction table
      if (Array.isArray(tradingEntities) && tradingEntities.length > 0) {
        console.log("Creating trading entity relationships...");
        
        // Create promises for each trading entity creation
        const tradingEntityPromises = tradingEntities.map(async (entityId) => {
          const createTradingEntityMutation = {
            query: `
              mutation {
                createVendorTradingEntities(
                  item: {
                    email: "${vendorEmail}"
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
        
        // Wait for all trading entity creations to complete
        try {
          const tradingEntityResults = await Promise.all(tradingEntityPromises);
          console.log(`Created ${tradingEntityResults.length} trading entity relationships`);
          
          // Check for any errors
          const errors = tradingEntityResults
            .filter(res => res.data.errors)
            .map(res => res.data.errors[0].message);
          
          if (errors.length > 0) {
            console.error("Some trading entities failed to create:", errors);
          }
        } catch (tradingEntityError) {
          console.error("Error creating trading entities:", tradingEntityError);
          // We'll still return success for the vendor creation even if some trading entities fail
        }
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Vendor onboarding form submitted successfully",
        data: {
          vendorId: vendorUuid,
          result: vendorResponse.data.data?.createVendorOnboarding?.result
        },
      });
    } catch (error) {
      console.error("Error in GraphQL request:", error);
      
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
      
      throw error; // Re-throw unexpected errors
    }
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
 * Check if an email already exists in the vendor database
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
        message: "Vendor onboarding API is available",
        isTest: true
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
    
    // Check if a vendor with this email already exists
    const checkEmailQuery = {
      query: `
        query {
          vendorOnboardings(filter: {email: {eq: "${email}"}}) {
            items {
              email
            }
          }
        }
      `
    };
    
    const emailCheckResponse = await axios.post(graphqlEndpoint, checkEmailQuery, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      }
    });
    
    // Get existing vendors with this email
    const existingVendors = emailCheckResponse.data.data?.vendorOnboardings?.items || [];
    console.log("Email to check:", email);
    console.log("Email to check:", emailCheckResponse);
    if (existingVendors.length > 0) {
      const existingVendor = existingVendors[0];
      
      return NextResponse.json({
        success: true,
        exists: true,
        email: existingVendor.email
      });
    } else {
      return NextResponse.json({
        success: true,
        exists: false
      });
    }
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json({
      success: false,
      message: "Error checking email",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}