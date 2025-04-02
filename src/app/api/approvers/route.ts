import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET handler to fetch approvers for a business unit
export async function GET(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get business unit from query parameter
    const url = new URL(req.url);
    const businessUnit = url.searchParams.get('businessUnit');
    
    if (!businessUnit) {
      return NextResponse.json({ error: 'Business unit parameter is required' }, { status: 400 });
    }
    
    // In a real implementation, you would make a request to Dynamics 365 to get approvers
    // This is a simplified example with mock data
    
    // Mock approvers data based on business unit
    const mockApprovers = {
      "Travel Essentials": {
        crb7c_approversid: "1",
        crb7c_approver1: "manager@example.com",
        crb7c_approver1_name: "John Manager",
        crb7c_approver2: "cfo@example.com",
        crb7c_approver2_name: "Jane CFO",
        crb7c_approver3: "exco@example.com",
        crb7c_approver3_name: "Bob Exco",
        crb7c_businessunit: "Travel Essentials"
      }
    };
    
    // Get approvers for the requested business unit
    const approvers = mockApprovers[businessUnit as keyof typeof mockApprovers];
    
    if (!approvers) {
      return NextResponse.json({ error: 'No approvers found for this business unit' }, { status: 404 });
    }
    
    // Return the approvers data
    return NextResponse.json([approvers]);
    
  } catch (error) {
    console.error('Error fetching approvers:', error);
    return NextResponse.json({ error: 'Failed to fetch approvers' }, { status: 500 });
  }
},
      "Food Services": {
        crb7c_approversid: "2",
        crb7c_approver1: "manager2@example.com",
        crb7c_approver1_name: "Sarah Manager",
        crb7c_approver2: "cfo@example.com",
        crb7c_approver2_name: "Jane CFO",
        crb7c_approver3: "exco@example.com",
        crb7c_approver3_name: "Bob Exco",
        crb7c_businessunit: "Food Services"
      },
      "Specialty": {
        crb7c_approversid: "3",
        crb7c_approver1: "manager3@example.com",
        crb7c_approver1_name: "Mike Manager",
        crb7c_approver2: "cfo@example.com",
        crb7c_approver2_name: "Jane CFO",
        crb7c_approver3: "exco@example.com",
        crb7c_approver3_name: "Bob Exco",
        crb7c_businessunit: "Specialty"
      },
      "Duty Free": {
        crb7c_approversid: "4",
        crb7c_approver1: "manager4@example.com",
        crb7c_approver1_name: "David Manager",
        crb7c_approver2: "cfo@example.com",
        crb7c_approver2_name: "Jane CFO",
        crb7c_approver3: "exco@example.com",
        crb7c_approver3_name: "Bob Exco",
        crb7c_businessunit: "Duty Free"
      }