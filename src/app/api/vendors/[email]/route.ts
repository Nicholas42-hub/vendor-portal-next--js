// File: app/api/vendors/[email]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import axios from 'axios';

// GET handler to fetch vendors by email
export async function GET(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get email from path parameter
    const email = decodeURIComponent(params.email);
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    
    if (!workspaceId || !graphqlId) {
      return NextResponse.json({ error: 'Missing API configuration' }, { status: 500 });
    }
    
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // Construct the GraphQL query to fetch vendor data
    const query = {
      query: `
        query($email: String!) {
          contacts(filter: { emailaddress1: { eq: $email } }) {
            items {
              contactid
              emailaddress1
              fullname
              crb7c_tradingname
              crb7c_abn
              crb7c_gst
              websiteurl
              address1_postofficebox
              address1_city
              address1_stateorprovince
              address1_postalcode
              crb7c_accountcontact
              address1_telephone2
              crb7c_invoicecurrency
              crb7c_primarytradingbusinessunit
              crb7c_bankname
              crb7c_aubsb
              crb7c_auaccount
              crb7c_nzbsb
              crb7c_nzaccount
              crb7c_purchasetype
              crb7c_statuscode
              crb7c_delivery_notice
              crb7c_barcode
              crb7c_min_order_value
              crb7c_max_order_value
              crb7c_paymentterms
              crb7c_exclusivesupply
              crb7c_salesorreturn
              crb7c_salesorexchange
              crb7c_grossmargin
              crb7c_agreeddiscount
              crb7c_invoicediscount
              crb7c_settlementdiscount
              crb7c_settlementdiscountdays
              crb7c_flatrebate
              crb7c_growthrebate
              crb7c_marketingrebate
              crb7c_promotionalfund
              description
              crb7c_approvalcomment
              crb7c_parentvendor
              crb7c_quoteschecked
              crb7c_backorderallowed
              crb7c_tradingentities
              crb7c_orderexpirydays
              crb7c_invoicediscountvalue
              crb7c_settlementdiscountvalue
              crb7c_flatrebatepercent
              crb7c_flatrebatedollar
              crb7c_flatrebateterm
              crb7c_growthrebatepercent
              crb7c_growthrebatedollar
              crb7c_growthrebateterm
              crb7c_marketingrebatepercent
              crb7c_marketingrebatedollar
              crb7c_marketingrebateterm
              crb7c_promotionalfundvalue
              crb7c_poemail
            }
          }
        }
      `,
      variables: { email }
    };

    // Make the GraphQL request
    const response = await axios.post(graphqlEndpoint, query, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    // Check for GraphQL errors
    if (response.data.errors) {
      return NextResponse.json(
        { success: false, error: response.data.errors[0].message },
        { status: 400 }
      );
    }

    // Extract vendor data from the response
    const contacts = response.data.data?.contacts?.items || [];
    
    if (contacts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No vendor found with the specified email' 
      });
    }

    // Return the vendor data
    return NextResponse.json(contacts);
    
  } catch (error) {
    console.error('Error fetching vendor data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor data',
        message: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

// PATCH handler to update vendor status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the vendor email from params
    const email = decodeURIComponent(params.email);
    
    if (!email) {
      return NextResponse.json({ error: 'Vendor email is required' }, { status: 400 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    
    if (!workspaceId || !graphqlId) {
      return NextResponse.json({ error: 'Missing API configuration' }, { status: 500 });
    }
    
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // First, fetch the contact to get its ID
    const getContactQuery = {
      query: `
        query($email: String!) {
          contacts(filter: { emailaddress1: { eq: $email } }) {
            items {
              contactid
            }
          }
        }
      `,
      variables: { email }
    };

    const contactResponse = await axios.post(graphqlEndpoint, getContactQuery, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (contactResponse.data.errors) {
      return NextResponse.json(
        { success: false, error: contactResponse.data.errors[0].message },
        { status: 400 }
      );
    }

    const contacts = contactResponse.data.data?.contacts?.items || [];
    
    if (contacts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No vendor found with the specified email' 
      }, { status: 404 });
    }

    const contactId = contacts[0].contactid;

    // Create the GraphQL mutation with proper variable definitions
    // Note: We use parameters for status code and comment so GraphQL can handle them properly
    const mutation = {
      query: `
        mutation UpdateContact($contactId: ID!, $statusCode: String, $approvalComment: String) {
          updateContact(
            id: $contactId,
            input: {
              crb7c_statuscode: $statusCode,
              crb7c_approvalcomment: $approvalComment
            }
          ) {
            contactid
            crb7c_statuscode
            crb7c_approvalcomment
          }
        }
      `,
      variables: {
        contactId: contactId,
        statusCode: body.crb7c_statuscode || null,
        approvalComment: body.crb7c_approvalcomment || null
      }
    };

    // Log the mutation for debugging
    console.log('Update mutation:', JSON.stringify(mutation, null, 2));

    // Make the GraphQL request
    const updateResponse = await axios.post(graphqlEndpoint, mutation, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Check for GraphQL errors
    if (updateResponse.data.errors) {
      console.error('GraphQL errors:', updateResponse.data.errors);
      return NextResponse.json(
        { success: false, error: updateResponse.data.errors[0].message },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Vendor updated successfully',
      data: updateResponse.data.data.updateContact
    });
    
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update vendor',
        message: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

// DELETE handler for vendor deletion
export async function DELETE(req: NextRequest, { params }: { params: { email: string } }) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the vendor email from params
    const email = decodeURIComponent(params.email);
    
    if (!email) {
      return NextResponse.json({ error: 'Vendor email is required' }, { status: 400 });
    }
    
    // Setup GraphQL endpoint
    const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
    const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
    
    if (!workspaceId || !graphqlId) {
      return NextResponse.json({ error: 'Missing API configuration' }, { status: 500 });
    }
    
    const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

    // First, fetch the contact to get its ID
    const getContactQuery = {
      query: `
        query($email: String!) {
          contacts(filter: { emailaddress1: { eq: $email } }) {
            items {
              contactid
            }
          }
        }
      `,
      variables: { email }
    };

    const contactResponse = await axios.post(graphqlEndpoint, getContactQuery, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (contactResponse.data.errors) {
      return NextResponse.json(
        { success: false, error: contactResponse.data.errors[0].message },
        { status: 400 }
      );
    }

    const contacts = contactResponse.data.data?.contacts?.items || [];
    
    if (contacts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No vendor found with the specified email' 
      }, { status: 404 });
    }

    const contactId = contacts[0].contactid;

    // Construct the GraphQL mutation to delete the contact
    const mutation = {
      query: `
        mutation DeleteContact($contactId: ID!) {
          deleteContact(id: $contactId) {
            contactid
          }
        }
      `,
      variables: { contactId }
    };

    // Make the GraphQL request
    const deleteResponse = await axios.post(graphqlEndpoint, mutation, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Check for GraphQL errors
    if (deleteResponse.data.errors) {
      return NextResponse.json(
        { success: false, error: deleteResponse.data.errors[0].message },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete vendor',
        message: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}