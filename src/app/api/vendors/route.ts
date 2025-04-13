import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import axios from 'axios';

// GET handler to fetch vendors
export async function GET(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get email from query parameter
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
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