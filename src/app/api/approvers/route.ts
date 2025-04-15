import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Mock approvers data based on business unit
const mockApprovers = {
  "Travel Essentials": {
    id: "1",
    approver1: "manager@example.com",
    approverName: "John Manager",
    businessUnit: "Travel Essentials"
  },
  "Food Services": {
    id: "2",
    approver1: "manager2@example.com",
    approverName: "Sarah Manager",
    businessUnit: "Food Services"
  },
  "Specialty": {
    id: "3",
    approver1: "manager3@example.com",
    approverName: "Mike Manager",
    businessUnit: "Specialty"
  },
  "Duty Free": {
    id: "4",
    approver1: "manager4@example.com",
    approverName: "David Manager",
    businessUnit: "Duty Free"
  }
};

// Default approver to return when requested business unit is not found
function createDefaultApprover(businessUnit: string) {
  return {
    id: "default",
    approver1: `approver.${businessUnit.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    approverName: `${businessUnit} Approver`,
    businessUnit: businessUnit
  };
}

// GET handler to fetch approvers
export async function GET(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get parameters from query
    const url = new URL(req.url);
    const businessUnit = url.searchParams.get('businessUnit');
    const email = url.searchParams.get('email');
    
    // If requesting a specific approver by email
    if (email) {
      // Search for the approver in our mock data
      for (const buKey in mockApprovers) {
        const approver = mockApprovers[buKey as keyof typeof mockApprovers];
        if (approver.approver1.toLowerCase() === email.toLowerCase()) {
          return NextResponse.json({
            success: true,
            approver
          });
        }
      }
      
      // If approver not found, create a default one based on the email
      return NextResponse.json({
        success: true,
        approver: {
          id: "email-default",
          approver1: email,
          approverName: email.split('@')[0],
          businessUnit: "UNKNOWN"
        }
      });
    }
    
    // If requesting approvers for a specific business unit
    if (businessUnit) {
      // Try to find an exact match
      const approver = mockApprovers[businessUnit as keyof typeof mockApprovers];
      
      if (approver) {
        return NextResponse.json({
          success: true,
          approvers: [approver]
        });
      }
      
      // If no exact match, search for partial matches
      const matchingApprovers = Object.values(mockApprovers).filter(a => 
        a.businessUnit.toLowerCase().includes(businessUnit.toLowerCase())
      );
      
      if (matchingApprovers.length > 0) {
        return NextResponse.json({
          success: true,
          approvers: matchingApprovers
        });
      }
      
      // If still no match, return a default approver for this business unit
      return NextResponse.json({
        success: true,
        approvers: [createDefaultApprover(businessUnit)]
      });
    }
    
    // If no specific filters, return all approvers
    return NextResponse.json({
      success: true,
      approvers: Object.values(mockApprovers)
    });
    
  } catch (error) {
    console.error('Error fetching approvers:', error);
    
    // Even in case of error, return something usable to avoid breaking the UI
    if (req.url) {
      const url = new URL(req.url);
      const businessUnit = url.searchParams.get('businessUnit');
      
      if (businessUnit) {
        return NextResponse.json({
          success: true,
          approvers: [createDefaultApprover(businessUnit)]
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      approvers: Object.values(mockApprovers)
    });
  }
}