import axios from 'axios';

export interface QueryResult {
  success: boolean;
  message?: string;
  data?: any; // Allow storing the full response data
}

const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;

// The localStorage keys to use
const CUSTOMERS_STORAGE_KEY = 'customer_data';
const STORES_STORAGE_KEY = 'store_data';
const ACCOUNTS_STORAGE_KEY = 'account_data';
const CATEGORIES_STORAGE_KEY = 'category_data'

//Check the last updated table
const STORAGE_KEY = "lastClearTimestamp";
const EXPIRY_DAYS = 2;

/**
 * Main query function to fetch both customers and stores data in a single request
 */
export async function queryBusinessData(
  accessToken: string,
): Promise<QueryResult> {
  // First try to get data from localStorage
  const cachedCustomers = getCustomersFromStorage();
  const cachedStores = getStoresFromStorage();
  const cachedAccounts = getAccountsFromStorage();
  const cachedCategories = getCategoriesFromStorage();
  const lastClear = localStorage.getItem(STORAGE_KEY);
  const now = Date.now();
  const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  
  if (cachedCustomers && cachedStores && cachedAccounts && cachedCategories && lastClear &&(now - Number(lastClear) < expiryTime)) {
    console.log("less than two days");
    return {
      success: true,
      message: 'Retrieved business data from local storage',
      data: {
        customers: cachedCustomers,
        stores: cachedStores
      }
    };
  }

  // If no cached data, make the API call
  const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
  console.log("over two days");
  try {
    // Single GraphQL query to fetch both customers and stores
    const query = {
      query: `
        query {
          ds_BCFIN_Customers(first: 100000) {
            items {
              FinanceCompanyCode_JV
              search_name
              full_address
            }
          }
          ds_BCFIN_StoreDimensionLists(first: 100000) {
            items {
              companycode
              code
            }
          }
          ds_BCFIN_GL_Accounts(first: 100000) {
            items {
             GLAccountNo
             GLAccountName
           }
          }
          dadim_BC_Category_Booking_Forms(first: 100000) {
            items {
             Category
           }
          }
        }
      `
    };

    // Make the GraphQL request
    const response = await axios.post(
      graphqlEndpoint,
      query,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 108000 // 108 seconds timeout
      }
    );


    // Check response status
    if (response.status !== 200) {
      return {
        success: false,
        message: `Connection failed with status: ${response.status}`
      };
    }

    // Basic validation of response
    if (!response.data) {
      return {
        success: false,
        message: 'Received empty response from GraphQL endpoint'
      };
    }

    // Store the data separately in localStorage
    if (response.data.data && response.data.data.ds_BCFIN_Customers) {
      saveCustomersToStorage(response.data.data.ds_BCFIN_Customers);
    }
    
    if (response.data.data && response.data.data.ds_BCFIN_StoreDimensionLists) {
      saveStoresToStorage(response.data.data.ds_BCFIN_StoreDimensionLists);
    }

    if (response.data.data && response.data.data.ds_BCFIN_GL_Accounts) {
      saveAccountsToStorage(response.data.data.ds_BCFIN_GL_Accounts);
    }
    if (response.data.data && response.data.data.dadim_BC_Category_Booking_Forms) {
      saveCategoriesToStorage(response.data.data.dadim_BC_Category_Booking_Forms);
    }

    //Set the last clear time
    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    // Return success with the full data
    return {
      success: true,
      message: 'Successfully connected to GraphQL endpoint',
      data: response.data
    };
  } catch (error) {
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        return {
          success: false,
          message: `Connection error: ${error.response.status} - ${JSON.stringify(error.response.data, null, 2)}`
        };
      } else if (error.request) {
        // Request was made but no response received
        return {
          success: false,
          message: 'No response received from GraphQL endpoint'
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

// Function to save customers data to localStorage
export function saveCustomersToStorage(data: any): void {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save customers to localStorage:', error);
  }
}

// Function to save stores data to localStorage
export function saveStoresToStorage(data: any): void {
  try {
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save stores to localStorage:', error);
  }
}

// Function to save accounts data to localStorage
export function saveAccountsToStorage(data: any): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save stores to localStorage:', error);
  }
}
// Function to save accounts data to localStorage
export function saveCategoriesToStorage(data: any): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save stores to localStorage:', error);
  }
}
// Function to get customers data from localStorage
export function getCustomersFromStorage(): any | null {
  try {
    const data = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get customers from localStorage:', error);
    return null;
  }
}

// Function to get stores data from localStorage
export function getStoresFromStorage(): any | null {
  try {
    const data = localStorage.getItem(STORES_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get stores from localStorage:', error);
    return null;
  }
}
// Function to get stores data from localStorage
export function getAccountsFromStorage(): any | null {
  try {
    const data = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get stores from localStorage:', error);
    return null;
  }
}
// Function to get stores data from localStorage
export function getCategoriesFromStorage(): any | null {
  try {
    const data = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get stores from localStorage:', error);
    return null;
  }
}

// Function to clear customers data from localStorage
export function clearCustomersFromStorage(): void {
  try {
    localStorage.removeItem(CUSTOMERS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear customers from localStorage:', error);
  }
}

// Function to clear stores data from localStorage
export function clearStoresFromStorage(): void {
  try {
    localStorage.removeItem(STORES_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear stores from localStorage:', error);
  }
}

// Function to clear all data from localStorage
export function clearAllStorageData(): void {
  try {
    clearCustomersFromStorage();
    clearStoresFromStorage();
  } catch (error) {
    console.error('Failed to clear storage data:', error);
  }
}

// Backward compatibility wrapper for existing code
export async function queryCustomer(accessToken: string): Promise<QueryResult> {
  const result = await queryBusinessData(accessToken);
  return result;
}

// Backward compatibility wrapper for existing code
export async function queryStores(accessToken: string): Promise<QueryResult> {
  const result = await queryBusinessData(accessToken);
  return result;
}

// Example usage function with JSON formatting and localStorage for both data types
export async function validateGraphQLConnection(accessToken: string) {
  try {
    const result = await queryBusinessData(accessToken);
    
    if (result.success) {
      console.log("Connection successful!");
      return result;
    } else {
      console.error(`Connection failed: ${result.message}`);
      return result;
    }
  } catch (error) {
    console.error('Failed to test GraphQL connection:', error);
    throw error;
  }
}

// Function to fetch and process both types of data
export async function fetchBusinessData(accessToken: string) {
  try {
    const result = await queryBusinessData(accessToken);
    
    if (result.success) {
      console.log('Successfully retrieved business data!');
      
      // Log some stats about the data
      if (result.data?.data) {
        const customerCount = result.data.data.ds_BCFIN_Customers?.items?.length || 0;
        const storeCount = result.data.data.ds_BCFIN_StoreDimensionLists?.items?.length || 0;
        
        console.log(`Retrieved ${customerCount} customers and ${storeCount} stores`);
      }
      
      return result;
    } else {
      console.error(`Failed to retrieve business data: ${result.message}`);
      return result;
    }
  } catch (error) {
    console.error('Failed to fetch business data:', error);
    throw error;
  }
}