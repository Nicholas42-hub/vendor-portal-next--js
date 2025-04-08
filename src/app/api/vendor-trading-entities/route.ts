import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // Construct the GraphQL query to fetch vendor trading entities
    const query = {
      query: `
        query {
          vendorTradingEntities {
            items {
              contactid
              TradingEntityId
              entityName
              entityCountry
            }
          }
        }
      `,
    };

    // Make the GraphQL request
    const response = await axios.post(graphqlEndpoint, query, {
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

    // Extract vendor trading entities from the response
    const data = response.data.data;
    if (!data || !data.vendorTradingEntities || !data.vendorTradingEntities.items) {
      return NextResponse.json({
        success: false,
        message: "No vendor trading entities found",
      });
    }

    // Return the vendor trading entities
    return NextResponse.json({
      success: true,
      data: data.vendorTradingEntities.items,
    });
  } catch (error) {
    console.error("Error fetching vendor trading entities:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error fetching vendor trading entities: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}