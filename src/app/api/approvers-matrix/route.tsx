import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Type definitions for form data (if needed in future operations)
interface ApproverMatrixFormData {
  businessUnit: string;
  approver1: string;
  approver1backup?: string;
  approver2: string;
  approver2backup?: string;
  approver3: string;
  approver3backup?: string;
}

export async function GET(request: NextRequest) {
  // Authenticate the request
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get optional businessUnit parameter from the URL
  const url = new URL(request.url);
  const businessUnit = url.searchParams.get("businessUnit");

  // Setup GraphQL endpoint using environment variables
  const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
  const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
  const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

  const query = `
  query {
    contacts(first: 1000) {
      items {
        contactid
        crb7c_vendoremail
        lastname
        createdon
        adx_createdbyusername
        crb7c_statuscode
      }
    }
  }
  `;

  const variables = {};
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.accessToken}`,
  };

  try {
    // Fetch data from the GraphQL endpoint
    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
    const result = await response.json();

    // Return the result as JSON
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
