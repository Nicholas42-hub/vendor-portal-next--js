// src/app/api/approvers-matrix/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET handler to fetch all approvers matrix data
export async function GET(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get business unit from query parameter, if provided
    const url = new URL(req.url);
    const businessUnit = url.searchParams.get('businessUnit');
    
    // Query to fetch data from Fabric Warehouse
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
    
    // Construct GraphQL query to fetch approvers data from the database
    const query = {
      query: `
        query {
          approvers_matrix(
            ${businessUnit ? `filter: { BusinessUnit: { eq: "${businessUnit}" } }` : ''}
            first: 100
          ) {
            items {
              id
              BusinessUnit
              Approver1
              Approver2
              Approver3
              CreatedOn
            }
          }
        }
      `
    };
    
    // Make GraphQL request to Fabric
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });
    
    if (!response.ok) {
      throw new Error(`Fabric API response error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check for GraphQL errors
    if (result.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }
    
    // Transform the response to match the expected format
    const approversMatrix = result.data.approvers_matrix.items.map((item: any) => ({
      id: item.id,
      businessUnit: item.BusinessUnit,
      approver1: item.Approver1,
      approver1_name: "", // Will need to fetch user details separately 
      approver2: item.Approver2,
      approver2_name: "", // Will need to fetch user details separately
      approver3: item.Approver3,
      approver3_name: "", // Will need to fetch user details separately
      createdOn: item.CreatedOn
    }));
    
    return NextResponse.json(approversMatrix);
    
  } catch (error) {
    console.error('Error fetching approvers matrix:', error);
    return NextResponse.json({ error: 'Failed to fetch approvers matrix' }, { status: 500 });
  }
}

// POST handler to create a new approvers matrix entry
export async function POST(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Parse the request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.businessUnit || !data.approver1 || !data.approver2 || !data.approver3) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Query to insert data into Fabric Warehouse
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
    
    // Construct GraphQL mutation to create a new entry
    const mutation = {
      query: `
        mutation {
          createapprovers_matrix(
            item: {
              BusinessUnit: "${data.businessUnit}",
              Approver1: "${data.approver1}",
              Approver2: "${data.approver2}",
              Approver3: "${data.approver3}",
              CreatedOn: "${new Date().toISOString()}"
            }
          ) {
            id
            BusinessUnit
            Approver1
            Approver2
            Approver3
            CreatedOn
          }
        }
      `
    };
    
    // Make GraphQL request to Fabric
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mutation)
    });
    
    if (!response.ok) {
      throw new Error(`Fabric API response error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check for GraphQL errors
    if (result.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }
    
    // Return the created entry
    const createdEntry = result.data.createapprovers_matrix;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Approvers matrix created successfully',
      id: createdEntry.id
    });
    
  } catch (error) {
    console.error('Error creating approvers matrix:', error);
    return NextResponse.json({ error: 'Failed to create approvers matrix' }, { status: 500 });
  }
}

// PATCH handler to update an existing approvers matrix entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const id = params.id;
    
    // Parse the request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.businessUnit || !data.approver1 || !data.approver2 || !data.approver3) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Query to update data in Fabric Warehouse
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
    
    // Construct GraphQL mutation to update the entry
    const mutation = {
      query: `
        mutation {
          updateapprovers_matrix(
            id: "${id}",
            item: {
              BusinessUnit: "${data.businessUnit}",
              Approver1: "${data.approver1}",
              Approver2: "${data.approver2}",
              Approver3: "${data.approver3}"
            }
          ) {
            id
            BusinessUnit
            Approver1
            Approver2
            Approver3
            CreatedOn
          }
        }
      `
    };
    
    // Make GraphQL request to Fabric
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mutation)
    });
    
    if (!response.ok) {
      throw new Error(`Fabric API response error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check for GraphQL errors
    if (result.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }
    
    // Return the updated entry
    const updatedEntry = result.data.updateapprovers_matrix;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Approvers matrix updated successfully',
      id: updatedEntry.id
    });
    
  } catch (error) {
    console.error('Error updating approvers matrix:', error);
    return NextResponse.json({ error: 'Failed to update approvers matrix' }, { status: 500 });
  }
}

// DELETE handler to remove an approvers matrix entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const id = params.id;
    
    // Query to delete data from Fabric Warehouse
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
    
    // Construct GraphQL mutation to delete the entry
    const mutation = {
      query: `
        mutation {
          deleteapprovers_matrix(id: "${id}") {
            id
          }
        }
      `
    };
    
    // Make GraphQL request to Fabric
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mutation)
    });
    
    if (!response.ok) {
      throw new Error(`Fabric API response error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check for GraphQL errors
    if (result.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Approvers matrix deleted successfully',
      id
    });
    
  } catch (error) {
    console.error('Error deleting approvers matrix:', error);
    return NextResponse.json({ error: 'Failed to delete approvers matrix' }, { status: 500 });
  }
}