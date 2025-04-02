import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET handler to fetch user details by email
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
    
    // In a real implementation, you would make a request to Dynamics 365 or your user directory
    // This is a simplified example with mock data
    
    // Mock user data
    const mockUsers = {
      "manager@example.com": {
        contactid: "u1",
        firstname: "John",
        lastname: "Manager",
        emailaddress1: "manager@example.com"
      },
      "cfo@example.com": {
        contactid: "u2",
        firstname: "Jane",
        lastname: "CFO",
        emailaddress1: "cfo@example.com"
      },
      "exco@example.com": {
        contactid: "u3",
        firstname: "Bob",
        lastname: "Exco",
        emailaddress1: "exco@example.com"
      }
    };
    
    // Get user by email
    const user = mockUsers[email as keyof typeof mockUsers];
    
    if (!user) {
      // If user not found in our mock data, create a basic response with the email
      return NextResponse.json({
        emailaddress1: email,
        lastname: email.split('@')[0]
      });
    }
    
    // Return the user data
    return NextResponse.json(user);
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}