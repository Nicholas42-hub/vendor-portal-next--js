import axios from "axios";

/**
 * Interface for contact information
 */
interface Approver {
  id?: string;
  email: string;
  lastname: string;
  name: string;
  jobtitle?: string;
}

/**
 * Interface for approver matrix data
 */
interface ApproverMatrix {
  id: string;
  businessUnit: string;
  approver1: string;
  approver1_name: string;
  approver2: string;
  approver2_name: string;
  approver3: string;
  approver3_name: string;
  createdOn: string;
}

/**
 * Interface for form data submission
 */
interface ApproverFormData {
  businessUnit: string;
  approver1: string;
  approver1backup?: string;
  approver2: string;
  approver2backup?: string;
  approver3: string;
  approver3backup?: string;
}

/**
 * Interface for API fetch results
 */
interface FetchResult {
  contacts: Approver[];
  matrixData: ApproverMatrix[];
  error: string | null;
}

/**
 * Interface for API submission results
 */
interface SubmitResult {
  success: boolean;
  error: string | null;
}

/**
 * Service class for handling Approver Matrix data operations
 */
export class ApproverMatrixService {
  /**
   * Fetches all data needed for the approvers matrix
   * @returns Promise with contacts, matrix data and any errors
   */
  async fetchAllData(): Promise<FetchResult> {
    try {
      // Call the API endpoint to fetch data
      const response = await axios.get('/api/approvers-matrix');
      
      if (response.status !== 200) {
        throw new Error(`API returned status: ${response.status}`);
      }
      
      const data = response.data;
      
      return {
        contacts: data.contacts || [],
        matrixData: data.matrices || [],
        error: null
      };
    } catch (error) {
      console.error('Error fetching approvers matrix data:', error);
      
      return {
        contacts: [],
        matrixData: [],
        error: error instanceof Error 
          ? error.message 
          : 'An unknown error occurred while fetching data'
      };
    }
  }

  /**
   * Submits the approvers matrix data to be saved
   * @param accessToken The access token for authentication (not used with API)
   * @param formData The form data to submit
   * @param matrixData Existing matrix data to check for updates vs creates
   * @returns Promise with success status and any errors
   */
  async submitApproverMatrix(
    accessToken: string,
    formData: ApproverFormData,
    matrixData: ApproverMatrix[]
  ): Promise<SubmitResult> {
    try {
      // Find if there's an existing entry for this business unit
      const existingMatrix = matrixData.find(
        (matrix) => matrix.businessUnit === formData.businessUnit
      );
      
      // Prepare the request data
      const requestData = {
        ...formData,
        id: existingMatrix?.id // Include the ID if updating
      };
      
      // Call the API endpoint
      const response = await axios.post('/api/approvers-matrix', requestData);
      
      if (response.status !== 200) {
        throw new Error(`API returned status: ${response.status}`);
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save approvers matrix');
      }
      
      return { 
        success: true, 
        error: null 
      };
    } catch (error) {
      console.error("Error submitting approvers matrix:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to save approvers matrix: ${errorMessage}`,
      };
    }
  }
  
  /**
   * Fetch approvers for a specific business unit
   * @param businessUnit The business unit to fetch approvers for
   * @returns Promise with matrix data for the specified business unit
   */
  async getApproversForBusinessUnit(businessUnit: string): Promise<ApproverMatrix | null> {
    try {
      const response = await axios.get(`/api/approvers-matrix?businessUnit=${encodeURIComponent(businessUnit)}`);
      
      if (response.status !== 200) {
        throw new Error(`API returned status: ${response.status}`);
      }
      
      const matrices = response.data.matrices || [];
      
      if (matrices.length > 0) {
        return matrices[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching approvers for business unit ${businessUnit}:`, error);
      return null;
    }
  }
  
  /**
   * Delete an approver matrix entry
   * @param id The ID of the matrix entry to delete
   * @returns Promise with success status
   */
  async deleteApproverMatrix(id: string): Promise<SubmitResult> {
    try {
      const response = await axios.delete(`/api/approvers-matrix/${id}`);
      
      if (response.status !== 200) {
        throw new Error(`API returned status: ${response.status}`);
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete approvers matrix');
      }
      
      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error(`Error deleting approver matrix with ID ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to delete approvers matrix: ${errorMessage}`,
      };
    }
  }
}