import axios from 'axios';

export interface CreateBookingResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface BookingEntry {
  DocumentID: string;
  LTRAWPL_Entity: string;
  Company: string;
  CompanyContactName: string;
  CompanyEmail: string;
  CompanyAddress: string;
  CompanyContactPhone: string;
  BusinessUnit: string;
  Currency: string;
  DocumentDate: string;
  PaymentDate: string;
  BillingPeriod: string;
  RequesterEmail: string;
  RequesterName: string;
  Status: string;
  VendorSignoffRequired: string;
  RequestDateTime: string;
}

// Helper function to create a delay
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export async function createBookingEntry(
  accessToken: string,
  bookingData: BookingEntry
): Promise<CreateBookingResult> {
  const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
  const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;

  // Construct the GraphQL endpoint URL
  const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

  try {
    // Create mutation with all fields
    const createMutation = {
      query: `
        mutation {
          createfact_NRI_Booking_Records_Header(
            item: {
              DocumentID: "${bookingData.DocumentID}"
              LTRAWPL_Entity: "${bookingData.LTRAWPL_Entity}"
              Company: "${bookingData.Company}"
              CompanyContactName: "${bookingData.CompanyContactName}"
              CompanyEmail: "${bookingData.CompanyEmail}"
              CompanyAddress: "${bookingData.CompanyAddress}"
              CompanyContactPhone: "${bookingData.CompanyContactPhone}"
              BusinessUnit: "${bookingData.BusinessUnit}"
              Currency: "${bookingData.Currency}"
              DocumentDate: "${bookingData.DocumentDate}"
              PaymentDate: "${bookingData.PaymentDate}"
              BillingPeriod: "${bookingData.BillingPeriod}"
              RequesterEmail: "${bookingData.RequesterEmail}"
              RequesterName: "${bookingData.RequesterName}"
              Status: "${bookingData.Status}"
              VendorSignoffRequired: "${bookingData.VendorSignoffRequired}"
              RequestDateTime: "${bookingData.RequestDateTime}"
            }
          ) {
            result
          }
        }
      `
    };

    // Make the GraphQL request
    const response = await axios.post(
      graphqlEndpoint,
      createMutation,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        timeout: 108000 //30 seconds timeout
      }
    );


    // Check response status
    if (response.status !== 200) {
      return {
        success: false,
        message: `Creation failed with status: ${response.status}`
      };
    }

    // Check for errors in the GraphQL response
    if (response.data.errors) {
      return {
        success: false,
        message: `GraphQL error: ${JSON.stringify(response.data.errors)}`,
        data: response.data
      };
    }

    // Return success with created data
    return {
      success: true,
      message: 'Successfully created new booking record',
      data: response.data.data.createfact_NRI_Booking_Records
    };

  } catch (error) {
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        return {
          success: false,
          message: `Creation error: ${error.response.status} - ${JSON.stringify(error.response.data, null, 2)}`
        };
      } else if (error.request) {
        // Request was made but no response received
        return {
          success: true,
          message: 'Successfully created new booking record'
        };
      } else {
        // Error in setting up the request
        return {
          success: false,
          message: `Request setup error: ${error.message}`
        };
      }
    } else {
      // Unexpected error
      return {
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Updated usage function
export async function createAndLogBooking(
  accessToken: string,
  documentID: string,
  requesterEmail: string,
  fullBookingData?: BookingEntry
) {
  try {
    // If full booking data is provided, use it
    // Otherwise create a minimal booking with just the required fields
    const newBooking: BookingEntry = fullBookingData || {
      DocumentID: documentID,
      LTRAWPL_Entity: "",
      Company: "",
      CompanyContactName: "",
      CompanyEmail: "",
      CompanyAddress: "",
      CompanyContactPhone: "",
      BusinessUnit: "",
      Currency: "",
      DocumentDate: new Date().toISOString().split('T')[0],
      PaymentDate: new Date().toISOString().split('T')[0],
      BillingPeriod: "",
      RequesterEmail: requesterEmail,
      RequesterName: "", // Added empty RequesterName
      Status: "Draft",
      VendorSignoffRequired: "No",
      RequestDateTime: ""
    };
    
    const result = await createBookingEntry(accessToken, newBooking);
    
    if (result.success) {
      console.log('Booking record created successfully!');

    } else {
      console.error(`Failed to create booking record: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating booking record:', error);
    throw error;
  }
}