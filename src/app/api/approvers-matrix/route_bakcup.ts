import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';



// Type definitions
interface ApproverMatrixFormData {
  businessUnit: string;
  approver1: string;
  approver1backup?: string;
  approver2: string;
  approver2backup?: string;
  approver3: string;
  approver3backup?: string;
}


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
    
    // Setup GraphQL access
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
    
    // Construct query for contacts
    const contactsQuery = {
      query: `
        query {
          contacts(first: 500) {
            items {
              contactid
              emailaddress1
              firstname
              lastname
              jobtitle
            }
          }
        }
      `
    };
    
    // Fetch contacts
    const contactsResponse = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactsQuery)
    });
    
    if (!contactsResponse.ok) {
      throw new Error(`Fabric API response error for contacts: ${contactsResponse.status}`);
    }
    
    const contactsResult = await contactsResponse.json();
    
    if (contactsResult.errors) {
      throw new Error(`GraphQL error for contacts: ${JSON.stringify(contactsResult.errors)}`);
    }
    
    // Process contacts data
    const contactsData = contactsResult.data.contacts.items
      .filter((contact: any) => 
        contact.emailaddress1 && 
        contact.lastname && 
        !contact.emailaddress1.includes('test') && 
        !contact.emailaddress1.includes('sample')
      )
      .map((contact: any) => ({
        id: contact.contactid,
        email: contact.emailaddress1,
        name: `${contact.firstname || ''} ${contact.lastname || ''}`.trim(),
        lastname: contact.lastname,
        jobtitle: contact.jobtitle
      }));
    
    // Construct query for approvers matrix
    const matrixQuery = {
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
    
    // Fetch approvers matrix
    const matrixResponse = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(matrixQuery)
    });
    
    if (!matrixResponse.ok) {
      throw new Error(`Fabric API response error for matrix: ${matrixResponse.status}`);
    }
    
    const matrixResult = await matrixResponse.json();
    
    if (matrixResult.errors) {
      throw new Error(`GraphQL error for matrix: ${JSON.stringify(matrixResult.errors)}`);
    }
    
    // Process matrix data
    const matrixData = matrixResult.data.approvers_matrix.items.map((item: any) => {
      const approver1Contact = contactsData.find(
        (contact: any) => contact.email === item.Approver1
      );
      const approver2Contact = contactsData.find(
        (contact: any) => contact.email === item.Approver2
      );
      const approver3Contact = contactsData.find(
        (contact: any) => contact.email === item.Approver3
      );
      
      return {
        id: item.id,
        businessUnit: item.BusinessUnit,
        approver1: item.Approver1 || '',
        approver1_name: approver1Contact?.name || '',
        approver2: item.Approver2 || '',
        approver2_name: approver2Contact?.name || '',
        approver3: item.Approver3 || '',
        approver3_name: approver3Contact?.name || '',
        createdOn: item.CreatedOn
      };
    });
    
    // Return combined data
    return NextResponse.json({
      contacts: contactsData,
      matrices: matrixData
    });
    
  } catch (error) {
    console.error('Error fetching approvers matrix data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvers matrix data', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST handler to create or update an approvers matrix entry
export async function POST(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Parse the request body
    const data: ApproverMatrixFormData & { id?: string } = await req.json();
    
    // Validate required fields
    if (!data.businessUnit) {
      return NextResponse.json({ error: 'Business unit is required' }, { status: 400 });
    }
    
    // Setup GraphQL access
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
    
    // Determine if this is an update or create operation
    const isUpdate = !!data.id;
    
    // Prepare the mutation fields
    const mutationFields = [
      `BusinessUnit: "${data.businessUnit}"`,
    ];
    
    // Add optional fields if they exist
    if (data.approver1) mutationFields.push(`Approver1: "${data.approver1}"`);
    if (data.approver1backup) mutationFields.push(`Approver1backup: "${data.approver1backup}"`);
    if (data.approver2) mutationFields.push(`Approver2: "${data.approver2}"`);
    if (data.approver2backup) mutationFields.push(`Approver2backup: "${data.approver2backup}"`);
    if (data.approver3) mutationFields.push(`Approver3: "${data.approver3}"`);
    if (data.approver3backup) mutationFields.push(`Approver3backup: "${data.approver3backup}"`);
    
    // Add created date for new entries
    if (!isUpdate) {
      mutationFields.push(`CreatedOn: "${new Date().toISOString()}"`);
    }
    
    // Construct the appropriate GraphQL mutation
    const mutation = {
      query: isUpdate
        ? `
          mutation {
            updateapprovers_matrix(
              id: "${data.id}",
              item: {
                ${mutationFields.join(',\n                ')}
              }
            ) {
              result
            }
          }
        `
        : `
          mutation {
            createapprovers_matrix(
              item: {
                ${mutationFields.join(',\n                ')}
              }
            ) {
              result
            }
          }
        `
    };
    
    // Make the GraphQL request
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
    
    if (result.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: isUpdate 
        ? 'Approvers matrix updated successfully' 
        : 'Approvers matrix created successfully'
    });
    
  } catch (error) {
    console.error('Error saving approvers matrix:', error);
    return NextResponse.json(
      { error: 'Failed to save approvers matrix', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE handler to remove an approvers matrix entry
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }
    
    // Setup GraphQL access
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
    
    // Construct the delete mutation
    const mutation = {
      query: `
        mutation {
          deleteapprovers_matrix(
            id: "${id}"
          ) {
            result
          }
        }
      `
    };
    
    // Make the GraphQL request
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
    
    if (result.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`);
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Approvers matrix deleted successfully',
      id: id
    });
    
  } catch (error) {
    console.error('Error deleting approvers matrix:', error);
    return NextResponse.json(
      { error: 'Failed to delete approvers matrix', details: (error as Error).message },
      { status: 500 }
    );
  }
}


