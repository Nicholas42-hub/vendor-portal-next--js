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
    const query = `query {
  vendorOnboardings(
    filter: { status_code: { neq: "Creation approved" } }
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
}`;
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
    // Extract vendor onboardings  from the response
    const data = response.data.data;
    if (!data || !data.vendorOnboardings || !data.vendorOnboardings.items) {
      return NextResponse.json({
        success: false,
        message: "No vendor onboardings found",
      });
    }

    // Return the vendor onboardings
    return NextResponse.json({
      success: true,
      data: data.vendorOnboardings.items,
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
