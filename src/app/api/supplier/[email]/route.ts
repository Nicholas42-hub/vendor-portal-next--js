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