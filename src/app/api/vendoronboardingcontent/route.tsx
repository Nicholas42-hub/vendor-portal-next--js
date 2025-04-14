import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";

export interface QueryResult {
  success: boolean;
  message?: string;
  data?: any; // Allow storing the full response data
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // Configuration
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // Format the GraphQL query properly
    const queryData = {
      query: `
        query {
          vendorOnboardings(
            first: 1000
          ) {
            items {
              email
              business_name
              created_on
              created_by
              status_code
            }
          }
        }
      `,
    };

    // Make the GraphQL request
    const response = await axios.post(graphqlEndpoint, queryData, {
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

    // Log response for debugging
    console.log("GraphQL Response:", JSON.stringify(response.data, null, 2));

    // Extract vendor onboardings from the response
    const data = response.data.data;
    if (!data || !data.vendorOnboardings || !data.vendorOnboardings.items) {
      return NextResponse.json({
        success: false,
        message: "No vendor onboardings found",
      });
    }

    // Transform the data if needed
    const formattedData = data.vendorOnboardings.items.map((item: any) => ({
      crb7c_poemail: item.email || "",
      crb7c_businessname: item.business_name || "",
      adx_createdbyusername: item.created_by || "",
      createdon_formatted: item.created_on || "",
      statecodename: item.status_code || "",
      originalStatus: item.status_code || "",
    }));

    // Return the vendor onboardings
    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching vendor onboardings:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Error fetching vendor onboardings: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
