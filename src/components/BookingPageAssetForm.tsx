"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Save, Trash2 } from 'lucide-react';
import { useConnectionCheck } from '@/components/ConnectionStatus';
import { createAndLogBooking } from '@/utils/graphQL-api-Create';
import { format } from 'date-fns';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table';

// Type for our booking API data
interface BookingData {
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

// Interface for booking item data
interface BookingItemData {
  DocumentID: string;
  impressType: string;
  category: string;
  description: string;
  quantity: number;
  dateFrom: string | null;
  dateTo: string | null;
  costCentre: string;
  totalExclGST: number;
  discount: number;
  gstPercentage: number;
  gstAmount: number;
  totalInclGST: number;
}

interface BookingFormProps {
  isVisible: boolean;
  onClose: () => void;
  customerData: any;
  session: any;
}

// Define Store type
interface Store {
  companycode: string;
  code: string;

}

interface StoreData {
  items: Store[];
}

// Define Account type
interface Account {
  GLAccountNo: string;
  GLAccountName: string;

}

interface AccountData {
  items: Account[];
}

// Define Category type
interface Category {
  Category: string;

}

interface CategoryData {
  items: Category[];
}

// Define custom colors
const customColors = {
  primary: '#141E5D',
  primaryLight: 'rgba(240, 245, 250, 1)',
  primaryText: 'rgba(0, 51, 102, 1)',
  requiredAsterisk: '#F01E73',
};

// FieldLabel component 
const FieldLabel = ({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: React.ReactNode }) => (
  <Label htmlFor={htmlFor} style={{ color: customColors.primaryText }}>
    {children}
    {required && <span style={{ color: customColors.requiredAsterisk }}>*</span>}
  </Label>
);

const AssetForm: React.FC<BookingFormProps> = ({ isVisible, onClose, customerData, session }) => {
  // State for table data
  const [tableData, setTableData] = useState<BookingItemData[]>([]);

  // State for new row input
  const [newRow, setNewRow] = useState<Omit<BookingItemData, 'DocumentID'>>({
    impressType: '',
    category: '',
    description: '',
    quantity: 0,
    dateFrom: null,
    dateTo: null,
    costCentre: '',
    totalExclGST: 0,
    discount: 0,
    gstPercentage: 10, // Default GST in Australia is 10%
    gstAmount: 0,
    totalInclGST: 0,
  });

  // Booking data state
  const [bookingData, setBookingData] = useState<BookingData>({
    DocumentID: "",
    LTRAWPL_Entity: "",
    Company: "",
    CompanyContactName: "",
    CompanyEmail: "",
    CompanyAddress: "",
    CompanyContactPhone: "",
    BusinessUnit: "",
    Currency: "",
    DocumentDate: "",
    PaymentDate: "",
    BillingPeriod: "",
    RequesterEmail: "",
    RequesterName: "",
    Status: "Pending",
    VendorSignoffRequired: "",
    RequestDateTime: ""
  });



  //Check the connection before submitting booking form
  const { connectionStatus, checkConnection } = useConnectionCheck(session?.accessToken);
  //Create the booking
  const [isCreating, setIsCreating] = useState<boolean>(false);
  //Creation result
  const [creationResult, setCreationResult] = useState<{
    success: boolean;
    message?: string;
    data?: any;
  } | null>(null);

  //Confirmation for submitting booking
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCreateButtonClick = () => {
     // Get the booking data - either from state or session storage
     let currentBookingData = { ...bookingData }; // Start with current state
     // Try to get from session storage if available
     try {
       const storedData = sessionStorage.getItem('bookingData');
       if (storedData) {
         const parsedData = JSON.parse(storedData);
         // Merge with current data to ensure we have all fields
         currentBookingData = { ...currentBookingData, ...parsedData };

 
       }
      } catch (error) {
        console.error("Error retrieving from session storage:", error);
      };
       // Update state with the current timestamp
      setBookingData(currentBookingData);
    // Show confirmation dialog instead of immediately creating
    setShowConfirmation(true);
  };




  // State for calendar popups
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  //Store state
  const [parsedStoreList, setParsedStoreList] = useState<StoreData | null>(null);
  const [isStoreListLoaded, setIsStoreListLoaded] = useState(false);
  const [storeloadAttempts, setStoreLoadAttempts] = useState(0);
  const [isSearchingStore, setIsSearchingStore] = useState(false);
  const [storeSearchValue, setStoreSearchValue] = useState('');

  //Account State
  const [parsedAccountList, setParsedAccountList] = useState<AccountData | null>(null);
  const [isAccountListLoaded, setIsAccountListLoaded] = useState(false);
  const [isSearchingAccount, setIsSearchingAccount] = useState(false);
  const [accountSearchValue, setAccountSearchValue] = useState('');

  //CategoryState
  const [parsedCategoryList, setParsedCategoryList] = useState<CategoryData | null>(null);
  const [isCategoryListLoaded, setIsCategoryListLoaded] = useState(false);
  const [isSearchingCategory, setIsSearchingCategory] = useState(false);
  const [categorySearchValue, setCategorySearchValue] = useState('');

  const getCurrentLAWPLEntity = () => {
    try {
      // Try both possible key formats
      return sessionStorage.getItem('LAWPL_entity') ||
        '';
    } catch (error) {
      console.error('Error accessing sessionStorage:', error);
      return '';
    }
  };



  useEffect(() => {
    // Check the last updated timestamp
    const STORAGE_KEY = "lastClearTimestamp";
    const EXPIRY_DAYS = 2;
    const lastClear = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    // Determine if data is stale (either no lastClear or it was more than EXPIRY_DAYS ago)
    const isDataStale = !lastClear || (now - Number(lastClear) > expiryTime);

    // If data is stale, we'll do multiple attempts, otherwise just one
    const shouldDoMultipleAttempts = isDataStale;

    console.log(`Attempting to load store data from localStorage... (Attempt ${storeloadAttempts + 1})`);

    console.log(`Data is ${isDataStale ? 'stale' : 'fresh'}, will ${shouldDoMultipleAttempts ? 'do' : 'not do'} multiple attempts`);

    try {
      // Get data synchronously from localStorage
      const storeList = localStorage.getItem('store_data');
      const accountList = localStorage.getItem('account_data');
      const categoryList = localStorage.getItem('category_data');

      if (storeList && accountList && categoryList) {
        const parsed = JSON.parse(storeList);
        const parsedaccount = JSON.parse(accountList);
        const parsedcategory = JSON.parse(categoryList);

        // Immediately set the state with the parsed data
        setParsedStoreList(parsed);
        setIsStoreListLoaded(true);

        setParsedAccountList(parsedaccount);
        setIsAccountListLoaded(true);

        setParsedCategoryList(parsedcategory);
        setIsCategoryListLoaded(true);


        // Log some stats for debugging
        const StoreCount = parsed.items?.length || 0;

        const AccountCount = parsedaccount.items?.length || 0;

        const CategoryCount = parsedcategory.items?.length || 0;

        console.log(`[Attempt ${storeloadAttempts + 1}] Loaded ${StoreCount} stores from localStorage & Loaded ${AccountCount} accounts from localStorage & Loaded ${CategoryCount} categories from localStorage`);

      } else {
        console.log(`[Attempt ${storeloadAttempts + 1}] No data found in localStorage`);

        setIsStoreListLoaded(true); // Mark as loaded even if no data
        setIsAccountListLoaded(true);
        setIsCategoryListLoaded(true);
      }
    } catch (error) {
      console.error(`[Attempt ${storeloadAttempts + 1}] Error loading data from localStorage:`, error);

      setIsStoreListLoaded(true); // Mark as loaded even if error
      setIsAccountListLoaded(true);
      setIsCategoryListLoaded(true);
    }

    // Schedule additional attempts ONLY if data is stale AND we haven't reached the maximum attempts
    if (shouldDoMultipleAttempts && storeloadAttempts < 7) {  // Try max 6 times
      const timer = setTimeout(() => {
        setStoreLoadAttempts(prev => prev + 1);
      }, 10000);  // Wait 10 seconds between attempts

      return () => clearTimeout(timer);  // Cleanup on unmount
    }
  }, [storeloadAttempts]);

  const gstPercentages = [0, 5, 10, 15]; // Common GST rates

  const handleSelectChange = (name: string, value: string | number) => {
    setNewRow(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate GST amount and total inclusive of GST when relevant fields change
  useEffect(() => {
    // First calculate the subtotal based on quantity and price per unit
    const subtotal = newRow.quantity * newRow.totalExclGST;

    // Then calculate after discount
    const totalAfterDiscount = subtotal - newRow.discount;

    // Calculate GST amount using the formula
    const gstAmount = totalAfterDiscount * (newRow.gstPercentage / 100);

    // Calculate total inclusive of GST using the formula
    const totalInclGST = totalAfterDiscount * (1 + newRow.gstPercentage / 100);

    setNewRow(prev => ({
      ...prev,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      totalInclGST: parseFloat(totalInclGST.toFixed(2))
    }));
  }, [newRow.quantity, newRow.totalExclGST, newRow.discount, newRow.gstPercentage]);


  const handleCreateBooking = async () => {

    // First check connection
    await checkConnection();

    // Get the booking data - either from state or session storage
    let currentBookingData = { ...bookingData }; // Start with current state
    // Try to get from session storage if available
    try {
      const storedData = sessionStorage.getItem('bookingData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Merge with current data to ensure we have all fields
        currentBookingData = { ...currentBookingData, ...parsedData };

      }
    } catch (error) {
      console.error("Error retrieving from session storage:", error);
    }

    if (!session?.accessToken || connectionStatus !== 'connected') {
      setCreationResult({
        success: false,
        message: 'No access token available. Please log in.'
      });
      return;
    }

    setIsCreating(true);
    setCreationResult(null);

    try {
      // Set RequestDateTime to current date and time in format 'yyyy-mm-dd hh:mm:ss'
      const now = new Date();

      // Format: YYYY-MM-DD
      const datePart = [
        String(now.getFullYear()),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      ].join('-');

      // Format: HH:MM:SS
      const timePart = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
      ].join(':');

      const formattedDateTime = `${datePart} ${timePart}`;

      // Create a new object with updated RequestDateTime
      const updatedBookingData = {
        ...currentBookingData,
        RequestDateTime: formattedDateTime
      };

      // Update state with the current timestamp
      setBookingData(updatedBookingData);


      // Ensure accessToken exists before proceeding
      if (!session.accessToken) {
        throw new Error("Access token not available");
      }

      const result = await createAndLogBooking(
        session.accessToken,
        updatedBookingData.DocumentID,
        updatedBookingData.RequesterEmail,
        updatedBookingData
      );

      setCreationResult(result);

      if (result.success) {
        // Optionally, reset form fields or switch to view tab

        // setActiveTab('view');
      }
    } catch (error) {
      setCreationResult({
        success: false,
        message: error instanceof Error
          ? error.message
          : 'An unexpected error occurred'
      });
    } finally {
      setIsCreating(false);
    }
  };
  // Create table columns
  const columns = useMemo<ColumnDef<BookingItemData>[]>(
    () => [
      {
        accessorKey: 'impressType',
        header: 'Impress Type',
      },
      {
        accessorKey: 'category',
        header: 'Category',
      },
      {
        accessorKey: 'description',
        header: 'Invoice Description',
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ row }) => {
          const amount = row.getValue('quantity') as number;
          return <div>{amount.toFixed(0)}</div>;
        },
      },
      {
        accessorKey: 'dateFrom',
        header: 'Date From',
        cell: ({ row }) => {
          const date = row.getValue('dateFrom') as string | null;
          return <div>{date ? date : '-'}</div>;
        },
      },
      {
        accessorKey: 'dateTo',
        header: 'Date To',
        cell: ({ row }) => {
          const date = row.getValue('dateTo') as string | null;
          return <div>{date ? date : '-'}</div>;
        },
      },
      {
        accessorKey: 'costCentre',
        header: 'Cost Centre / Store ID',
      },
      {
        accessorKey: 'totalExclGST',
        header: 'Total $ (excl GST)',
        cell: ({ row }) => {
          const amount = row.getValue('totalExclGST') as number;
          return <div>${amount.toFixed(2)}</div>;
        },
      },
      {
        accessorKey: 'discount',
        header: 'Discount $',
        cell: ({ row }) => {
          const amount = row.getValue('discount') as number;
          return <div>${amount.toFixed(2)}</div>;
        },
      },
      {
        accessorKey: 'gstPercentage',
        header: 'GST (%)',
        cell: ({ row }) => {
          const percentage = row.getValue('gstPercentage') as number;
          return <div>{percentage}%</div>;
        },
      },
      {
        accessorKey: 'gstAmount',
        header: 'GST (Amount $)',
        cell: ({ row }) => {
          const amount = row.getValue('gstAmount') as number;
          return <div>${amount.toFixed(2)}</div>;
        },
      },
      {
        accessorKey: 'totalInclGST',
        header: 'Total $ (incl GST)',
        cell: ({ row }) => {
          const amount = row.getValue('totalInclGST') as number;
          return <div>${amount.toFixed(2)}</div>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(row.original.DocumentID)}
                className="h-8 w-8 p-0 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  // Initialize React Table
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  // Reset form for adding a new row
  const resetNewRowForm = () => {
    setNewRow({
      impressType: '',
      category: '',
      description: '',
      quantity: 0,
      dateFrom: null,
      dateTo: null,
      costCentre: '',
      totalExclGST: 0,
      discount: 0,
      gstPercentage: 10,
      gstAmount: 0,
      totalInclGST: 0,
    });
  };

  // Handle adding a new row
  const handleAddRow = () => {
    if (!newRow.description || !newRow.costCentre) return; // Basic validation

    const formattedDateFrom = newRow.dateFrom ? format(new Date(newRow.dateFrom), 'yyyy-MM-dd') : null;
    const formattedDateTo = newRow.dateTo ? format(new Date(newRow.dateTo), 'yyyy-MM-dd') : null;

    const newItem: BookingItemData = {
      DocumentID: Date.now().toString(),
      impressType: newRow.impressType,
      category: newRow.category,
      description: newRow.description,
      quantity: newRow.quantity,
      dateFrom: formattedDateFrom,
      dateTo: formattedDateTo,
      costCentre: newRow.costCentre,
      totalExclGST: newRow.totalExclGST,
      discount: newRow.discount,
      gstPercentage: newRow.gstPercentage,
      gstAmount: newRow.gstAmount,
      totalInclGST: newRow.totalInclGST,
    };

    setTableData([...tableData, newItem]);
    resetNewRowForm();
  };


  // Handle deleting a row
  const handleDelete = (DocumentID: string) => {
    // Filter out only the item with the matching id
    setTableData(prev => prev.filter(item => item.DocumentID !== DocumentID));
  };

  // Handle input change for new row
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    // Handle numeric inputs
    if (type === 'number') {
      const numValue = parseFloat(value) || 0;
      setNewRow(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      // Handle text inputs
      setNewRow(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  // Calculate totals for all rows
  const totals = useMemo(() => {
    return tableData.reduce((acc, row) => {
      return {
        totalQty: acc.totalQty + row.quantity,
        totalExclGST: acc.totalExclGST + (row.quantity * row.totalExclGST),
        discount: acc.discount + row.discount,
        gstAmount: acc.gstAmount + row.gstAmount,
        totalInclGST: acc.totalInclGST + row.totalInclGST,
      };
    }, {
      totalQty: 0,
      totalExclGST: 0,
      discount: 0,
      gstAmount: 0,
      totalInclGST: 0,
    });
  }, [tableData]);

  // If not visible, don't render anything
  if (!isVisible) return null;

  return (
    <div className="mt-8 animate-fadeIn">
      <Card style={{ backgroundColor: customColors.primaryLight }}>

        <CardContent className="p-6" style={{ backgroundColor: customColors.primaryLight }}>
          {/* Form for adding a new invoice row */}
          <div className="bg-white p-4 rounded-md shadow-sm mb-6">
            <h3 className="text-lg font-medium mb-4" style={{ color: customColors.primaryText }}>Add New Booking Item</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <div className="space-y-2">
                <FieldLabel htmlFor="glAccountNumber" required>Impress Type</FieldLabel>

                {/* Regular display when not searching */}
                {!isSearchingAccount && (
                  <div className="relative">
                    <div
                      className="flex h-auto min-h-[42px] w-4/5 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background cursor-pointer"
                      onClick={() => {
                        if (isAccountListLoaded) {
                          setIsSearchingAccount(true);
                          setAccountSearchValue('');
                        }
                      }}
                    >
                      {/* Display selected account or placeholder */}
                      <div className="flex-1 text-gray-800 truncate">
                        {!isAccountListLoaded
                          ? "Loading accounts..."
                          : newRow.impressType
                            ? newRow.impressType  // You might want to show the account name too if available
                            : "Select Impress Type"}
                      </div>
                      <div className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search mode component */}
                {isSearchingAccount && isAccountListLoaded && (
                  <div className="relative">
                    <div className="flex">
                      <Input
                        value={accountSearchValue}
                        onChange={(e) => setAccountSearchValue(e.target.value)}
                        placeholder="Search GL accounts..."
                        className="w-4/5 bg-white text-gray-800 min-h-[42px]"
                        autoFocus
                      />
                      <Button
                        type="button"
                        onClick={() => setIsSearchingAccount(false)}
                        className="ml-2"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>

                    {/* Results dropdown */}
                    <div className="absolute w-4/5 bg-white border rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
                      {parsedAccountList?.items && (
                        (() => {
                          const filteredItems = parsedAccountList.items
                            .filter(account => {
                              const searchLower = accountSearchValue.toLowerCase();
                              // Search in both the account number and name
                              return account.GLAccountNo.toLowerCase().includes(searchLower) ||
                                account.GLAccountName.toLowerCase().includes(searchLower);
                            })
                            // Remove duplicates if necessary
                            .filter((account, index, self) =>
                              index === self.findIndex(a => a.GLAccountNo === account.GLAccountNo)
                            )
                            // Sort by account number
                            .sort((a, b) => a.GLAccountNo.localeCompare(b.GLAccountNo))
                            // Limit results
                            .slice(0, 8);

                          if (filteredItems.length === 0) {
                            return (
                              <div className="p-3 text-center text-gray-500">
                                No accounts found
                              </div>
                            );
                          }

                          return filteredItems.map(account => (
                            <div
                              key={account.GLAccountNo}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                              onClick={() => {

                                // You could also store the combined value if needed
                                handleSelectChange('impressType', `${account.GLAccountNo} ${account.GLAccountName}`);

                                // Exit search mode
                                setIsSearchingAccount(false);
                              }}
                            >
                              {/* Display both account number and name for better clarity */}
                              <div className="font-medium">{account.GLAccountNo}</div>
                              <div className="text-xs text-gray-600">{account.GLAccountName}</div>
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="category" required>Category</FieldLabel>

                {/* Regular display when not searching */}
                {!isSearchingCategory && (
                  <div className="relative">
                    <div
                      className="flex h-auto min-h-[42px] w-4/5 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background cursor-pointer"
                      onClick={() => {
                        if (isCategoryListLoaded) {
                          setIsSearchingCategory(true);
                          setCategorySearchValue('');
                        }
                      }}
                    >
                      {/* Display selected category or placeholder */}
                      <div className="flex-1 text-gray-800 truncate">
                        {!isCategoryListLoaded
                          ? "Loading categories..."
                          : newRow.category
                            ? newRow.category
                            : "Select category"}
                      </div>
                      <div className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search mode component (the code provided above) */}
                {isSearchingCategory && isCategoryListLoaded && (
                  <div className="relative">
                    <div className="flex">
                      <Input
                        value={categorySearchValue}
                        onChange={(e) => setCategorySearchValue(e.target.value)}
                        placeholder="Search categories..."
                        className="w-4/5 bg-white text-gray-800 min-h-[42px]"
                        autoFocus
                      />
                      <Button
                        type="button"
                        onClick={() => setIsSearchingCategory(false)}
                        className="ml-2"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>

                    {/* Results dropdown */}
                    <div className="absolute w-4/5 bg-white border rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
                      {parsedCategoryList?.items && (
                        (() => {
                          const filteredItems = parsedCategoryList.items
                            .filter(category =>
                              // Filter by search term if any
                              category.Category.toLowerCase().includes(categorySearchValue.toLowerCase())
                            )
                            // Remove duplicates if necessary
                            .filter((category, index, self) =>
                              index === self.findIndex(c => c.Category === category.Category)
                            )
                            // Sort alphabetically
                            .sort((a, b) => a.Category.localeCompare(b.Category))
                            // Limit results
                            .slice(0, 8);

                          if (filteredItems.length === 0) {
                            return (
                              <div className="p-3 text-center text-gray-500">
                                No categories found
                              </div>
                            );
                          }

                          return filteredItems.map(category => (
                            <div
                              key={`${category.Category}`}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                              onClick={() => {
                                // Update the category value
                                handleSelectChange('category', category.Category);

                                // Exit search mode
                                setIsSearchingCategory(false);
                              }}
                            >
                              {category.Category}
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>


              <div className="space-y-2">
                <FieldLabel htmlFor="description" required>Invoice Description</FieldLabel>
                <Input
                  id="description"
                  name="description"
                  value={newRow.description}
                  onChange={handleInputChange}
                  placeholder="Enter description"
                  className="bg-white text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="costCentre" required>Cost Centre / Store ID</FieldLabel>

                {/* Regular display when not searching */}
                {!isSearchingStore && (
                  <div className="relative">
                    <div
                      className="flex h-auto min-h-[42px] w-4/5 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background cursor-pointer"
                      onClick={() => {
                        if (isStoreListLoaded) {
                          setIsSearchingStore(true);
                          setStoreSearchValue('');
                        }
                      }}
                    >
                      {/* Display selected store or placeholder */}
                      <div className="flex-1 text-gray-800 truncate">
                        {!isStoreListLoaded
                          ? "Loading stores..."
                          : newRow.costCentre
                            ? newRow.costCentre
                            : "Select store"}
                      </div>
                      <div className="ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search mode - completely different component */}
                {isSearchingStore && isStoreListLoaded && (
                  <div className="relative">
                    <div className="flex">
                      <Input
                        value={storeSearchValue}
                        onChange={(e) => setStoreSearchValue(e.target.value)}
                        placeholder="Search stores..."
                        className="w-4/5 bg-white text-gray-800 min-h-[42px]"
                        autoFocus
                      />
                      <Button
                        type="button"
                        onClick={() => setIsSearchingStore(false)}
                        className="ml-2"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>

                    {/* Results dropdown */}
                    <div className="absolute w-4/5 bg-white border rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
                      {parsedStoreList?.items && (
                        (() => {
                          // Get current LAWPL_Entity from sessionStorage
                          const currentEntity = getCurrentLAWPLEntity();

                          const filteredItems = parsedStoreList.items
                            .filter(store =>
                              // Match the company code with the current LAWPL_Entity
                              store.companycode === currentEntity &&
                              // Filter by search term if any
                              store.code.toLowerCase().includes(storeSearchValue.toLowerCase())
                            )
                            // Remove duplicates if necessary
                            .filter((store, index, self) =>
                              index === self.findIndex(s => s.code === store.code)
                            )
                            // Sort alphabetically
                            .sort((a, b) => a.code.localeCompare(b.code))
                            // Limit results
                            .slice(0, 8);

                          if (filteredItems.length === 0) {
                            return (
                              <div className="p-3 text-center text-gray-500">
                                No stores found
                              </div>
                            );
                          }

                          return filteredItems.map(store => (
                            <div
                              key={`${store.code}-${store.companycode}`}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                              onClick={() => {
                                // Update the store value
                                handleSelectChange('costCentre', store.code);

                                // Exit search mode
                                setIsSearchingStore(false);
                              }}
                            >
                              {store.code}
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="dateFrom" required>Date From</FieldLabel>
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white text-gray-800"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newRow.dateFrom ? format(new Date(newRow.dateFrom), 'PPP') : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newRow.dateFrom ? new Date(newRow.dateFrom) : undefined}
                      onSelect={(date) => {
                        setNewRow(prev => ({ ...prev, dateFrom: date ? date.toISOString() : null }));
                        setDateFromOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="dateTo" required>Date To</FieldLabel>
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white text-gray-800"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newRow.dateTo ? format(new Date(newRow.dateTo), 'PPP') : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newRow.dateTo ? new Date(newRow.dateTo) : undefined}
                      onSelect={(date) => {
                        setNewRow(prev => ({ ...prev, dateTo: date ? date.toISOString() : null }));
                        setDateToOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="quantity" required>Quantity</FieldLabel>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={newRow.quantity.toString()}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="bg-white text-gray-800"
                />
              </div>


              <div className="space-y-2">
                <FieldLabel htmlFor="totalExclGST" required>Total $ (excl GST)</FieldLabel>
                <Input
                  id="totalExclGST"
                  name="totalExclGST"
                  type="number"
                  step="0.01"
                  value={newRow.totalExclGST.toString()}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="bg-white text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="discount" required>Discount $</FieldLabel>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  step="0.01"
                  value={newRow.discount.toString()}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="bg-white text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="gstPercentage" required>GST (%)</FieldLabel>
                <Select
                  onValueChange={(value) => handleSelectChange('gstPercentage', parseFloat(value))}
                  value={newRow.gstPercentage.toString()}
                >
                  <SelectTrigger className="bg-white text-gray-800">
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {gstPercentages.map(percentage => (
                      <SelectItem key={percentage} value={percentage.toString()}>
                        {percentage}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="gstAmount">GST (Amount $)</FieldLabel>
                <Input
                  id="gstAmount"
                  name="gstAmount"
                  type="number"
                  step="0.01"
                  value={newRow.gstAmount.toString()}
                  readOnly
                  className="bg-gray-100 text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="totalInclGST">Total $ (incl GST)</FieldLabel>
                <Input
                  id="totalInclGST"
                  name="totalInclGST"
                  type="number"
                  step="0.01"
                  value={newRow.totalInclGST.toString()}
                  readOnly
                  className="bg-gray-100 text-gray-800"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleAddRow}
                disabled={!newRow.description || !newRow.costCentre}
                className="flex items-center gap-1"
                style={{ backgroundColor: customColors.primary }}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Booking Item</span>
              </Button>
            </div>
          </div>

          {/* Display the invoice items table */}
          <div className="bg-white rounded-md shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-medium text-gray-600"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b hover:bg-gray-50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3 text-sm"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                        No booking items yet. Use the form above to add items.
                      </td>
                    </tr>
                  )}
                </tbody>
                {tableData.length > 0 && (
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td colSpan={1} className="px-4 py-3 text-left font-medium">
                        Total
                      </td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3 font-medium">{totals.totalQty.toFixed(0)}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3 font-medium">${totals.totalExclGST.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium">${totals.discount.toFixed(2)}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3 font-medium">${totals.gstAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium">${totals.totalInclGST.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination controls */}
            {tableData.length > 5 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    tableData.length
                  )}{' '}
                  of {tableData.length} items
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 p-4" style={{ backgroundColor: customColors.primaryLight }}>
          {/* Buttons row */}
          <Button
            variant="outline"
            onClick={onClose}
            className="border border-gray-400"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateButtonClick}
            disabled={tableData.length === 0 || !session || isCreating}
            style={{
              backgroundColor: customColors.primary,
              opacity: (tableData.length === 0 || !session || isCreating) ? 0.5 : 1
            }}
            className="text-white hover:bg-opacity-90"
          >
            {isCreating ? 'Creating...' : 'Create Booking'}
          </Button>
        </CardFooter>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full mx-auto">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4 text-center"style={{ color: customColors.requiredAsterisk }}>Confirm Booking Creation</h3>
                <p className="mb-6 text-gray-700 text-sm text-center" style={{ color: customColors.primary }}>
                  Are you sure you want to create this booking with {tableData.length} items?
                </p>

                {/* Summary of booking details */}
                <div className="mb-6 p-3 bg-gray-50 rounded border">
                  <h4 className="text-sm font-medium mb-2">Booking Summary:</h4>
                  <ul className="text-sm">
                    <li className="flex justify-between py-1">
                      <span>Document ID:</span>
                      <span className="font-medium">{bookingData.DocumentID}</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>Company:</span>
                      <span className="font-medium">{bookingData.Company}</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>Total Items:</span>
                      <span className="font-medium">{tableData.length}</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>Total Amount $ (Excl GST):</span>
                      <span className="font-medium">${totals?.totalExclGST?.toFixed(2) || '0.00'}</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>GST Amount $:</span>
                      <span className="font-medium">${totals?.gstAmount?.toFixed(2) || '0.00'}</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span>Total Amount $ (Incl GST):</span>
                      <span className="font-medium">${totals?.totalInclGST?.toFixed(2) || '0.00'}</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    style={{ backgroundColor: customColors.requiredAsterisk}}
                    className="px-6 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                  variant="outline"
                    onClick={() => {
                      setShowConfirmation(false);
                      handleCreateBooking(); // Call the actual creation function
                    }}
                    style={{ backgroundColor: customColors.primary }}
                    className="px-6 text-white"
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Animated feedback overlay */}
        {(isCreating || creationResult) && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 transition-opacity duration-300">
            <div className={`transform transition-all duration-300 ${isCreating || creationResult ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
              <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full mx-auto">
                {/* Loading state */}
                {isCreating && (
                  <div className="p-6 text-center">
                    <div className="animate-spin mb-4 mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <p className="text-lg font-medium" style={{ color: customColors.primaryText }}>
                      Creating new booking record...
                    </p>
                  </div>
                )}

                {/* Success/Error feedback */}
                {creationResult && (
                  <div className={creationResult.success ? 'bg-green-50' : 'bg-red-50'}>
                    <div className="p-6">
                      <div className="flex items-center justify-center mb-4">
                        {creationResult.success ? (
                          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-center mb-2">
                        {creationResult.success ? 'Booking Created Successfully' : 'Failed to Create Booking'}
                      </h3>
                      {creationResult.message && (
                        <p className="text-center text-sm mt-1">{creationResult.message}</p>
                      )}
                    </div>

                    {/* Data display if available */}
                    {creationResult?.data && (
                      <div className="px-6 pb-6">
                        <div className="bg-gray-50 p-3 rounded-md border mt-4">
                          <h4 className="font-medium mb-2" style={{ color: customColors.primaryText }}>
                            Booking Details:
                          </h4>
                          <pre className="bg-white p-2 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto text-gray-800 border">
                            {JSON.stringify(creationResult.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Close button */}
                    <div className="px-6 py-3 flex justify-center">
                      <Button
                        onClick={() => {
                          setCreationResult(null);
                          if (creationResult?.success) {
                            // Only redirect if it was a success
                            window.location.href = '/'; // Or use router.push('/') for Next.js
                          }
                        }}
                        className="px-4" style={{ backgroundColor: customColors.primary }}
                      >
                        {creationResult?.success ? "Return to Home" : "Close"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AssetForm;