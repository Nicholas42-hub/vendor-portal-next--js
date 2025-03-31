// src/utils/supplier-api-service.ts

import axios from 'axios';

export interface SupplierFormData {
  business_name: string;
  trading_name: string;
  country: string;
  gst_registered: string;
  abn?: string;
  gst?: string;
  address?: string;
  website?: string;
  postal_address: string;
  city: string;
  state: string;
  postcode: string;
  accounts_contact: string;
  telephone: string;
  po_email: string;
  return_order_email: string;
  invoice_currency: string;
  payment_method: string;
  // Bank details fields
  au_bank_name?: string;
  au_bank_email?: string;
  bsb?: string;
  account?: string;
  nz_bank_name?: string;
  nz_bank_email?: string;
  nz_BSB?: string;
  nz_account?: string;
  IBAN_SWITCH_yn?: string;
  IBAN_input?: string;
  SWITCH_input?: string;
  overseas_bank_email?: string;
  biller_code?: string;
  ref_code?: string;
  iAgree: boolean;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Submits supplier form data to the backend API
 */
export async function submitSupplierForm(
  formData: SupplierFormData,
  bankStatement?: File
): Promise<ApiResponse> {
  try {
    // Create FormData instance for file upload
    const data = new FormData();
    
    // Add all form fields to the FormData
    Object.entries(formData).forEach(([key, value]) => {
      // Skip undefined values
      if (value !== undefined) {
        data.append(key, String(value));
      }
    });
    
    // Add bank statement file if provided
    if (bankStatement) {
      data.append('bankStatement', bankStatement);
    }
    
    // Make API request
    const response = await axios.post('/api/supplier-onboarding', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      success: true,
      message: 'Supplier form submitted successfully',
      data: response.data
    };
  } catch (error) {
    // Handle errors
    if (axios.isAxiosError(error)) {
      // Handle Axios errors
      const message = error.response?.data?.message || error.message || 'An error occurred while submitting the form';
      return {
        success: false,
        message
      };
    }
    
    // Handle other errors
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Fetches user data for pre-filling the form
 */
export async function fetchUserData(email: string): Promise<ApiResponse> {
  try {
    const response = await axios.get(`/api/user-details?email=${encodeURIComponent(email)}`);
    
    return {
      success: true,
      message: 'User data fetched successfully',
      data: response.data
    };
  } catch (error) {
    // Handle errors
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch user data',
    };
  }
}