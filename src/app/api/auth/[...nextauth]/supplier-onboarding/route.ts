// src/app/api/supplier-onboarding/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Get the current session to verify authentication
    const session = await getServerSession(authOptions);
    
    // If user is not authenticated, return unauthorized
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse form data
    const formData = await request.formData();
    
    // Log for debugging purposes
    console.log('Received form submission from:', session.user.email);
    
    // Extract file
    const bankStatementFile = formData.get('bankStatement') as File | null;
    
    // You would typically process the form data here:
    // 1. Validate form data
    // 2. Process the uploaded file (if necessary)
    // 3. Store data in your database or send to external API
    
    // For now, we'll just prepare a response with the received data
    const responseData = {
      success: true,
      message: 'Supplier form submitted successfully',
      submittedBy: session.user.email,
      // Include form fields except the file
      data: Object.fromEntries(
        Array.from(formData.entries())
          .filter(([key]) => key !== 'bankStatement')
      ),
      // Include file info if it exists
      fileInfo: bankStatementFile ? {
        name: bankStatementFile.name,
        size: bankStatementFile.size,
        type: bankStatementFile.type,
      } : null
    };
    
    // Return success response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error processing supplier form submission:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        error: 'Failed to process supplier form', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}