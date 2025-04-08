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
    
    // Construct the query to Dynamics 365
    // In a real implementation, you would use the actual Dynamics 365 API endpoints
    // This is a simplified example
    
    // Example: Making a request to Dynamics 365 Web API
    // You would need to replace with your actual Dynamics 365 CE endpoint and query
    const dynamics365Endpoint = process.env.DYNAMICS_365_API_ENDPOINT;
    const query = `contacts?$filter=emailaddress1 eq '${encodeURIComponent(email)}'&$select=contactid,crb7c_tradingname,crb7c_abn,crb7c_gst,websiteurl,address1_postofficebox,address1_city,address1_stateorprovince,address1_postalcode,crb7c_accountcontact,address1_telephone2,emailaddress1,crb7c_invoicecurrency,crb7c_primarytradingbusinessunit,crb7c_bankname,crb7c_aubsb,crb7c_auaccount,crb7c_nzbsb,crb7c_nzaccount,crb7c_purchasetype,crb7c_statuscode,crb7c_delivery_notice,crb7c_barcode,crb7c_min_order_value,crb7c_max_order_value,crb7c_paymentterms,crb7c_exclusivesupply,crb7c_salesorreturn,crb7c_salesorexchange,crb7c_grossmargin,crb7c_agreeddiscount,crb7c_invoicediscount,crb7c_settlementdiscount,crb7c_settlementdiscountdays,crb7c_flatrebate,crb7c_growthrebate,crb7c_marketingrebate,crb7c_promotionalfund,description,crb7c_approvalcomment,crb7c_parentvendor,crb7c_statuscode_record`;
    
    // In a real implementation, you would make an actual API call here
    // For this example, we'll return mock data
    const mockVendor = {
      contactid: "12345",
      crb7c_tradingname: "Example Trading Co",
      crb7c_abn: "12345678901",
      websiteurl: "https://example.com",
      address1_postofficebox: "123 Example Street",
      address1_city: "Sydney",
      address1_stateorprovince: "NSW",
      address1_postalcode: "2000",
      crb7c_accountcontact: "John Doe",
      address1_telephone2: "0412345678",
      emailaddress1: email,
      crb7c_invoicecurrency: "AUD",
      crb7c_primarytradingbusinessunit: "Travel Essentials",
      crb7c_bankname: "Example Bank",
      crb7c_aubsb: "123456",
      crb7c_auaccount: "1234567890",
      crb7c_purchasetype: "Repeat",
      crb7c_statuscode: "Pending Manager Approval",
      crb7c_delivery_notice: "5 days",
      crb7c_min_order_value: "100",
      crb7c_max_order_value: "5000",
      crb7c_paymentterms: "30 DAYS",
      crb7c_exclusivesupply: "yes",
      crb7c_grossmargin: "25%",
      description: "Australia"
    };
    
    // Return the vendor data
    return NextResponse.json([mockVendor]);
    
  } catch (error) {
    console.error('Error fetching vendor data:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor data' }, { status: 500 });
  }
}