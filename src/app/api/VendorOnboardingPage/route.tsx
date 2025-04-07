import axios from "axios";

export interface QueryResult {
  success: boolean;
  message?: string;
  data?: any; // Allow storing the full response data
}

// Configuration
const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;

// LocalStorage keys
const CUSTOMERS_STORAGE_KEY = "customer_data";
const STORES_STORAGE_KEY = "store_data";
const ACCOUNTS_STORAGE_KEY = "account_data";
const CATEGORIES_STORAGE_KEY = "category_data";
const VENDORS_STORAGE_KEY = "vendor_data";

// Cache expiration settings
const STORAGE_KEY = "lastClearTimestamp";
const EXPIRY_DAYS = 2;

/**
 * Main query function to fetch all business data in a single request
 */
export async function queryBusinessData(
  accessToken: string
): Promise<QueryResult> {
  // Check if data exists in localStorage and is still valid
  const cachedCustomers = getFromStorage(CUSTOMERS_STORAGE_KEY);
  const cachedStores = getFromStorage(STORES_STORAGE_KEY);
  const cachedAccounts = getFromStorage(ACCOUNTS_STORAGE_KEY);
  const cachedCategories = getFromStorage(CATEGORIES_STORAGE_KEY);
  const cachedVendors = getFromStorage(VENDORS_STORAGE_KEY);

  const lastClear = localStorage.getItem(STORAGE_KEY);
  const now = Date.now();
  const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  // If all cache data exists and is within expiry time, return it
  if (
    cachedCustomers &&
    cachedStores &&
    cachedAccounts &&
    cachedCategories &&
    cachedVendors &&
    lastClear &&
    now - Number(lastClear) < expiryTime
  ) {
    console.log("Using cached data - less than two days old");
    return {
      success: true,
      message: "Retrieved business data from local storage",
      data: {
        customers: cachedCustomers,
        stores: cachedStores,
        accounts: cachedAccounts,
        categories: cachedCategories,
        vendors: cachedVendors,
      },
    };
  }

  // If no cached data or it's expired, make the API call
  const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;
  console.log("Making API call - cache expired or not available");

  try {
    // Single GraphQL query to fetch all business data types
    const query = {
      query: `
      query {
      contacts(filter: { crb7c_createdvendor: { eq: "Yes" } }, first: 1000) {
        items {
          contactid
          crb7c_vendoremail
          lastname
          createdon
          adx_createdbyusername
          crb7c_statuscode
        }
      }
    }
  
      `,
    };

    // Make the GraphQL request
    const response = await axios.post(graphqlEndpoint, query, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 108000, // 108 seconds timeout
    });

    // Check response status
    if (response.status !== 200) {
      return {
        success: false,
        message: `Connection failed with status: ${response.status}`,
      };
    }

    // Basic validation of response
    if (!response.data) {
      return {
        success: false,
        message: "Received empty response from GraphQL endpoint",
      };
    }

    const data = response.data.data;
    if (data && data.contacts && data.contacts.items) {
      const processedVendors = data.contacts.items.map((item: any) => ({
        crb7c_accountcontact: item.contactid,
        crb7c_poemail: item.crb7c_vendoremail,
        crb7c_businessname: item.lastname,
        createdon: item.createdon,
        adx_createdbyusername: item.adx_createdbyusername,
        createdon_formatted: formatDate(item.createdon),
        statecodename: item.crb7c_statuscode,
        originalStatus: item.crb7c_statuscode,
      }));

      saveToStorage(VENDORS_STORAGE_KEY, { items: processedVendors });
    }
    // Store all the data separately in localStorage
    if (data) {
      if (data.ds_BCFIN_Customers) {
        saveToStorage(CUSTOMERS_STORAGE_KEY, data.ds_BCFIN_Customers);
      }

      if (data.ds_BCFIN_StoreDimensionLists) {
        saveToStorage(STORES_STORAGE_KEY, data.ds_BCFIN_StoreDimensionLists);
      }

      if (data.ds_BCFIN_GL_Accounts) {
        saveToStorage(ACCOUNTS_STORAGE_KEY, data.ds_BCFIN_GL_Accounts);
      }

      if (data.dadim_BC_Category_Booking_Forms) {
        saveToStorage(
          CATEGORIES_STORAGE_KEY,
          data.dadim_BC_Category_Booking_Forms
        );
      }
    }

    // Set the last clear time
    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    // Return success with the full data
    return {
      success: true,
      message: "Successfully connected to GraphQL endpoint",
      data: response.data,
    };
  } catch (error) {
    // Enhanced error handling
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        return {
          success: false,
          message: `Connection error: ${
            error.response.status
          } - ${JSON.stringify(error.response.data, null, 2)}`,
        };
      } else if (error.request) {
        // Request was made but no response received
        return {
          success: false,
          message: "No response received from GraphQL endpoint",
        };
      } else {
        // Error in setting up the request
        return {
          success: false,
          message: `Request setup error: ${error.message}`,
        };
      }
    } else {
      // Unexpected error
      return {
        success: false,
        message: `Unexpected error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }
}

// Helper to format date from ISO string to a readable format
function formatDate(isoString: string): string {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return isoString;
  }
}

// Generic function to save data to localStorage
function saveToStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data to localStorage (${key}):`, error);
  }
}

// Generic function to get data from localStorage
function getFromStorage(key: string): any | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to get data from localStorage (${key}):`, error);
    return null;
  }
}

// Function to clear all cached data
export function clearAllStorageData(): void {
  try {
    localStorage.removeItem(CUSTOMERS_STORAGE_KEY);
    localStorage.removeItem(STORES_STORAGE_KEY);
    localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem(CATEGORIES_STORAGE_KEY);
    localStorage.removeItem(VENDORS_STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    console.log("All storage data cleared successfully");
  } catch (error) {
    console.error("Failed to clear storage data:", error);
  }
}

// Specific function to validate GraphQL connection
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
    console.error("Failed to test GraphQL connection:", error);
    throw error;
  }
}

// Function to fetch vendors data specifically
export async function fetchVendorsData(accessToken: string) {
  try {
    const result = await queryBusinessData(accessToken);

    if (result.success) {
      // Extract vendors data
      const vendors = getFromStorage(VENDORS_STORAGE_KEY);

      if (vendors && vendors.items) {
        return {
          success: true,
          message: "Successfully retrieved vendors data",
          data: vendors.items,
        };
      } else {
        return {
          success: false,
          message: "No vendors data found in the response",
        };
      }
    } else {
      return result;
    }
  } catch (error) {
    console.error("Error fetching vendors data:", error);
    return {
      success: false,
      message: `Error fetching vendors data: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
