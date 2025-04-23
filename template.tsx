"use client";

import { Session } from "next-auth";
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Trash2, Loader2 } from "lucide-react";
//import { useConnectionCheck } from '@/components/NRIBooking/ConnectionStatus';
import { useBookingData } from "@/app/api/NRIBooking/graphQL-api-Get_Header";
import { createAndLogBooking } from "@/app/api/NRIBooking/graphQL-api-Create";
import { deleteBooking } from "@/app/api/NRIBooking/graphQL-api-Delete";
import { useToken } from "@/app/TokenContext"; // Import the TokenProvider context
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";

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
  DocumentDate: string | null;
  PaymentDate: string | null;
  BillingPeriod: string;
  RequesterEmail: string;
  RequesterName: string;
  Status: string;
  VendorSignoffRequired: string;
  RequestDateTime: string;
  LastUpdatedDateTime: string | null; // Optional field for last updated date/time
}

// Interface for booking item data
interface BookingItemData {
  lineID: string;
  documentID: string;
  impressType: string;
  category: string;
  description: string;
  quantity: number;
  dateFrom: string | null;
  dateTo: string | null;
  costCentre: string;
  unitTotalExclGST: number;
  totalExclGST: number;
  discount: number;
  gstPercentage: number;
  gstAmount: number;
  totalInclGST: number;
  requesterEmail: string;
  lastUpdatedDateTime: string | null;
}

interface BookingFormProps {
  activeTab: string;
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  editingHistorical: boolean;
  setHistoricalFromView: React.Dispatch<React.SetStateAction<boolean>>;
  formFieldsReadOnly: boolean;
  setFormFieldsReadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  session: Session | null;
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
  primary: "#141E5D",
  primaryLight: "rgba(240, 245, 250, 1)",
  primaryText: "rgba(0, 51, 102, 1)",
  requiredAsterisk: "#F01E73",
};

// FieldLabel component
const FieldLabel = ({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <Label htmlFor={htmlFor} style={{ color: customColors.primaryText }}>
    {children}
    {required && (
      <span style={{ color: customColors.requiredAsterisk }}>*</span>
    )}
  </Label>
);

const AssetForm: React.FC<BookingFormProps> = ({
  activeTab,
  isVisible,
  setIsVisible,
  editingHistorical,
  setFormFieldsReadOnly,
  session,
}) => {
  // State for table data
  const [tableData, setTableData] = useState<BookingItemData[]>([]);

  //Service Principal Token
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { token, fetchToken } = useToken();

  // State for new row input
  const [newRow, setNewRow] = useState<Omit<BookingItemData, "lineID">>({
    documentID: "",
    impressType: "",
    category: "",
    description: "",
    quantity: 0,
    dateFrom: null,
    dateTo: null,
    costCentre: "",
    unitTotalExclGST: 0,
    totalExclGST: 0,
    discount: 0,
    gstPercentage: 10, // Default GST in Australia is 10%
    gstAmount: 0,
    totalInclGST: 0,
    requesterEmail: "",
    lastUpdatedDateTime: null,
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
    Status: "",
    VendorSignoffRequired: "",
    RequestDateTime: "",
    LastUpdatedDateTime: null,
  });

  // Load the booking header when click return to home
  const { fetchBookingData } = useBookingData();
  //Redirect ot home page after creating booking
  const [isRedirecting, setIsRedirecting] = useState(false);

  //Check the connection before submitting booking form
  //const { connectionStatus } = useConnectionCheck(session?.accessToken);
  //Create the booking
  const [isCreating, setIsCreating] = useState<boolean>(false);
  //Creation result
  const [creationResult, setCreationResult] = useState<{
    success: boolean;
    message?: string;
    data?: Record<string, unknown> | undefined;
  } | null>(null);

  //Confirmation for submitting booking
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Cancel button to make the form read-only to editable
  const toggleReadOnly = () => {
    setFormFieldsReadOnly((prev) => !prev);
    setIsVisible((prev) => !prev);
  };

  const handleCreateButtonClick = () => {
    // Get the booking data - either from state or session storage
    let currentBookingData = { ...bookingData }; // Start with current state
    // Try to get from session storage if available
    try {
      const storedData = localStorage.getItem("bookingData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Merge with current data to ensure we have all fields
        currentBookingData = { ...currentBookingData, ...parsedData };
      }
    } catch (error) {
      console.error("Error retrieving from session storage:", error);
    }

    //Set the create Version as 24Hrs Grace Period -Editable
    sessionStorage.setItem("createVersion", "24Hrs Grace Period -Editable");

    // Update state with the current timestamp
    setBookingData(currentBookingData);
    // Show confirmation dialog instead of immediately creating
    setShowConfirmation(true);
  };

  const handleCreateDraftButtonClick = () => {
    // Get the booking data - either from state or session storage
    let currentBookingData = { ...bookingData }; // Start with current state
    // Try to get from session storage if available
    try {
      const storedData = localStorage.getItem("bookingData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Merge with current data to ensure we have all fields
        currentBookingData = { ...currentBookingData, ...parsedData };
      }
    } catch (error) {
      console.error("Error retrieving from session storage:", error);
    }

    //Set the create Version as Draft
    sessionStorage.setItem("createVersion", "Draft");

    // Update state with the current timestamp
    setBookingData(currentBookingData);
    // Show confirmation dialog instead of immediately creating
    setShowConfirmation(true);
  };

  //Store infinite scroll
  const [visibleStores, setVisibleStores] = useState(8);

  // State for calendar popups
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  //Store state
  const [parsedStoreList, setParsedStoreList] = useState<StoreData | null>(
    null
  );
  const [isStoreListLoaded, setIsStoreListLoaded] = useState(false);
  const [storeloadAttempts, setStoreLoadAttempts] = useState(0);
  const [isSearchingStore, setIsSearchingStore] = useState(false);
  const [storeSearchValue, setStoreSearchValue] = useState("");

  //Account State
  const [parsedAccountList, setParsedAccountList] =
    useState<AccountData | null>(null);
  const [isAccountListLoaded, setIsAccountListLoaded] = useState(false);
  const [isSearchingAccount, setIsSearchingAccount] = useState(false);
  const [accountSearchValue, setAccountSearchValue] = useState("");

  //CategoryState
  const [parsedCategoryList, setParsedCategoryList] =
    useState<CategoryData | null>(null);
  const [isCategoryListLoaded, setIsCategoryListLoaded] = useState(false);
  const [isSearchingCategory, setIsSearchingCategory] = useState(false);
  const [categorySearchValue, setCategorySearchValue] = useState("");

  // Format currency with thousand separators
  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format quantity with thousand separators
  const formatQuantity = (value: number) => {
    return value.toLocaleString("en-AU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getCurrentLAWPLEntity = () => {
    try {
      // Try both possible key formats
      return sessionStorage.getItem("LAWPL_entity") || "";
    } catch (error) {
      console.error("Error accessing sessionStorage:", error);
      return "";
    }
  };

  useEffect(() => {
    // Check the last updated timestamp
    const STORAGE_KEY = "lastClearTimestamp";
    const EXPIRY_DAYS = 1;
    const lastClear = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    // Determine if data is stale (either no lastClear or it was more than EXPIRY_DAYS ago)
    const isDataStale = !lastClear || now - Number(lastClear) > expiryTime;

    // If data is stale, we'll do multiple attempts, otherwise just one
    const shouldDoMultipleAttempts = isDataStale;

    console.log(
      `Attempting to load store data from localStorage... (Attempt ${
        storeloadAttempts + 1
      })`
    );

    console.log(
      `Data is ${isDataStale ? "stale" : "fresh"}, will ${
        shouldDoMultipleAttempts ? "do" : "not do"
      } multiple attempts`
    );

    try {
      // Get data synchronously from localStorage
      const storeList = localStorage.getItem("store_data");
      const accountList = localStorage.getItem("account_data");
      const categoryList = localStorage.getItem("category_data");

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

        console.log(
          `[Attempt ${
            storeloadAttempts + 1
          }] Loaded ${StoreCount} stores from localStorage & Loaded ${AccountCount} accounts from localStorage & Loaded ${CategoryCount} categories from localStorage`
        );
      } else {
        console.log(
          `[Attempt ${storeloadAttempts + 1}] No data found in localStorage`
        );

        setIsStoreListLoaded(true); // Mark as loaded even if no data
        setIsAccountListLoaded(true);
        setIsCategoryListLoaded(true);
      }
    } catch (error) {
      console.error(
        `[Attempt ${
          storeloadAttempts + 1
        }] Error loading data from localStorage:`,
        error
      );

      setIsStoreListLoaded(true); // Mark as loaded even if error
      setIsAccountListLoaded(true);
      setIsCategoryListLoaded(true);
    }

    // Schedule additional attempts ONLY if data is stale AND we haven't reached the maximum attempts
    if (shouldDoMultipleAttempts && storeloadAttempts < 7) {
      // Try max 6 times
      const timer = setTimeout(() => {
        setStoreLoadAttempts((prev) => prev + 1);
      }, 10000); // Wait 10 seconds between attempts

      return () => clearTimeout(timer); // Cleanup on unmount
    }
  }, [storeloadAttempts, activeTab]);

  const gstPercentages = [0, 5, 10, 15]; // Common GST rates

  const handleSelectChange = (name: string, value: string | number) => {
    setNewRow((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate values when relevant fields change
  useEffect(() => {
    // Calculate totalExclGST based on quantity and unit price, minus discount
    const subtotal = newRow.quantity * newRow.unitTotalExclGST;
    const totalAfterDiscount = subtotal - newRow.discount;

    // Calculate GST amount
    const gstAmount = totalAfterDiscount * (newRow.gstPercentage / 100);

    // Calculate total inclusive of GST
    const totalInclGST = totalAfterDiscount + gstAmount;

    setNewRow((prev) => ({
      ...prev,
      totalExclGST: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      totalInclGST: parseFloat(totalInclGST.toFixed(2)),
    }));
  }, [
    newRow.quantity,
    newRow.unitTotalExclGST,
    newRow.discount,
    newRow.gstPercentage,
  ]);

  const handleCreateBooking = async () => {
    // Get the booking data - either from state or session storage
    let currentBookingData = { ...bookingData }; // Start with current state

    // Try to get from session storage if available
    try {
      const storedData = localStorage.getItem("bookingData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Merge with current data to ensure we have all fields
        currentBookingData = { ...currentBookingData, ...parsedData };
      }
    } catch (error) {
      console.error("Error retrieving from session storage:", error);
    }

    if (!session?.accessToken) {
      setCreationResult({
        success: false,
        message: "No access token available. Please log in.",
      });
      return;
    }
    const accessToken = await fetchToken();

    setIsCreating(true);
    setCreationResult(null);

    //Delete the record first if it is editing historical document
    const historicalDocumentId =
      sessionStorage.getItem("editHistoricalDocumentID") || "";
    const userEmail = session?.user?.email;
    if (historicalDocumentId && userEmail && editingHistorical) {
      console.log("Deleting historical document:", historicalDocumentId);
      const result = await deleteBooking(
        accessToken || "",
        historicalDocumentId,
        userEmail
      );
      console.log("Delete result:", result);
      // Handle the result if needed
    }

    try {
      // Set RequestDateTime to current date and time in format 'yyyy-mm-dd hh:mm:ss'
      const now = new Date();

      // Format: YYYY-MM-DD
      const datePart = [
        String(now.getFullYear()),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      // Format: HH:MM:SS
      const timePart = [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
      ].join(":");

      const formattedDateTime = `${datePart} ${timePart}`;

      const version = sessionStorage.getItem("createVersion") || "Draft";

      let updatedBookingData;

      if (!editingHistorical) {
        // Create a new object with updated RequestDateTime
        updatedBookingData = {
          ...currentBookingData,
          RequestDateTime: formattedDateTime,
          LastUpdatedDateTime: formattedDateTime,
          Status: version,
        };
      } else {
        updatedBookingData = {
          ...currentBookingData,
          LastUpdatedDateTime: formattedDateTime,
          Status: version,
        };
      }

      // Convert tableData to the format expected by the API
      const bookingItems: BookingItemData[] = tableData.map((item) => ({
        lineID: item.lineID,
        documentID: item.documentID,
        impressType: item.impressType,
        category: item.category,
        description: item.description,
        dateFrom: item.dateFrom,
        dateTo: item.dateTo,
        costCentre: item.costCentre,
        quantity: item.quantity,
        unitTotalExclGST: item.unitTotalExclGST,
        totalExclGST: item.totalExclGST,
        discount: item.discount,
        gstPercentage: item.gstPercentage,
        gstAmount: item.gstAmount,
        totalInclGST: item.totalInclGST,
        requesterEmail: item.requesterEmail,
        lastUpdatedDateTime: formattedDateTime, // Include last updated date/time
      }));
      // Update state with the current timestamp
      setBookingData(updatedBookingData);

      console.log("Updated booking data:", updatedBookingData);

      // Ensure accessToken exists before proceeding
      if (!accessToken) {
        throw new Error("Access token not available");
      }

      const result = await createAndLogBooking(
        accessToken,
        updatedBookingData.DocumentID,
        updatedBookingData.RequesterEmail,
        updatedBookingData,
        bookingItems
      );

      setCreationResult(result);

      if (result.success) {
        console.log("Booking created successfully:");
      }
    } catch (error) {
      console.log("error:", error);
      setCreationResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Create table columns
  const columns = useMemo<ColumnDef<BookingItemData>[]>(
    () => [
      {
        accessorKey: "impressType",
        header: "Impress Type",
      },
      {
        accessorKey: "category",
        header: "Category",
      },
      {
        accessorKey: "description",
        header: "Invoice Description",
      },
      {
        accessorKey: "dateFrom",
        header: "Date From",
        cell: ({ row }) => {
          const date = row.getValue("dateFrom") as string | null;
          return <div>{date ? date : "-"}</div>;
        },
      },
      {
        accessorKey: "dateTo",
        header: "Date To",
        cell: ({ row }) => {
          const date = row.getValue("dateTo") as string | null;
          return <div>{date ? date : "-"}</div>;
        },
      },
      {
        accessorKey: "costCentre",
        header: "Cost Centre / Store ID",
      },
      {
        accessorKey: "quantity",
        header: "Qty",
        cell: ({ row }) => {
          const amount = row.getValue("quantity") as number;
          return <div>{formatQuantity(amount)}</div>;
        },
      },
      {
        accessorKey: "unitTotalExclGST",
        header: "Unit Price $ (excl GST)",
        cell: ({ row }) => {
          const amount = row.getValue("unitTotalExclGST") as number;
          return <div>${formatCurrency(amount)}</div>;
        },
      },
      {
        accessorKey: "totalExclGST",
        header: "Total $ (excl GST)",
        cell: ({ row }) => {
          const amount = row.getValue("totalExclGST") as number;
          return <div>${formatCurrency(amount)}</div>;
        },
      },
      {
        accessorKey: "discount",
        header: "Discount $",
        cell: ({ row }) => {
          const amount = row.getValue("discount") as number;
          return <div>${formatCurrency(amount)}</div>;
        },
      },
      {
        accessorKey: "gstPercentage",
        header: "GST (%)",
        cell: ({ row }) => {
          const percentage = row.getValue("gstPercentage") as number;
          return <div>{percentage}%</div>;
        },
      },
      {
        accessorKey: "gstAmount",
        header: "GST (Amount $)",
        cell: ({ row }) => {
          const amount = row.getValue("gstAmount") as number;
          return <div>${formatCurrency(amount)}</div>;
        },
      },
      {
        accessorKey: "totalInclGST",
        header: "Total $ (incl GST)",
        cell: ({ row }) => {
          const amount = row.getValue("totalInclGST") as number;
          return <div>${formatCurrency(amount)}</div>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                title="Delete this line record"
                onClick={() => handleDelete(row.original.lineID)}
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
      documentID: "",
      impressType: "",
      category: "",
      description: "",
      quantity: 0,
      dateFrom: null,
      dateTo: null,
      costCentre: "",
      unitTotalExclGST: 0,
      totalExclGST: 0,
      discount: 0,
      gstPercentage: 10,
      gstAmount: 0,
      totalInclGST: 0,
      requesterEmail: "",
      lastUpdatedDateTime: null,
    });
  };

  // Handle adding a new row
  const handleAddRow = () => {
    if (!newRow.description || !newRow.costCentre) return; // Basic validation

    const formattedDateFrom = newRow.dateFrom
      ? new Date(newRow.dateFrom).toLocaleDateString("en-AU", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;
    const formattedDateTo = newRow.dateTo
      ? new Date(newRow.dateTo).toLocaleDateString("en-AU", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

    // Variable to store the document ID
    let documentID = "";
    const requesterEmail = session?.user?.email;

    try {
      const storedData = localStorage.getItem("bookingData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Use the documentID from parsedData if it exists
        if (parsedData.DocumentID) {
          documentID = parsedData.DocumentID;
        }
      }
    } catch (error) {
      console.error("Error retrieving from session storage:", error);
    }

    const newItem: BookingItemData = {
      lineID: Date.now().toString(),
      documentID: documentID,
      impressType: newRow.impressType,
      category: newRow.category,
      description: newRow.description,
      quantity: newRow.quantity,
      dateFrom: formattedDateFrom,
      dateTo: formattedDateTo,
      costCentre: newRow.costCentre,
      unitTotalExclGST: newRow.unitTotalExclGST,
      totalExclGST: newRow.totalExclGST,
      discount: newRow.discount,
      gstPercentage: newRow.gstPercentage,
      gstAmount: newRow.gstAmount,
      totalInclGST: newRow.totalInclGST,
      requesterEmail: requesterEmail,
      lastUpdatedDateTime: null,
    };

    setTableData([...tableData, newItem]);
    resetNewRowForm();
  };

  // Handle deleting a row
  const handleDelete = (id: string) => {
    // Filter out only the item with the matching id
    setTableData((prev) => prev.filter((item) => item.lineID !== id));
  };

  // Handle input change for new row
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    // Handle numeric inputs
    if (type === "number") {
      const numValue = parseFloat(value) || 0;
      setNewRow((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      // Handle text inputs
      setNewRow((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Calculate totals for all rows
  const totals = useMemo(() => {
    return tableData.reduce(
      (acc, row) => {
        return {
          totalQty: acc.totalQty + row.quantity,
          totalExclGST: acc.totalExclGST + row.totalExclGST,
          discount: acc.discount + row.discount,
          gstAmount: acc.gstAmount + row.gstAmount,
          totalInclGST: acc.totalInclGST + row.totalInclGST,
        };
      },
      {
        totalQty: 0,
        totalExclGST: 0,
        discount: 0,
        gstAmount: 0,
        totalInclGST: 0,
      }
    );
  }, [tableData]);

  useEffect(() => {
    if (editingHistorical && isVisible) {
      // Get the document ID from session storage
      const targetDocId = sessionStorage.getItem("editHistoricalDocumentID");

      // Get the booking line items
      const storedLineItems = sessionStorage.getItem("historicalLinedata");

      if (storedLineItems && targetDocId) {
        try {
          // Define an interface for the stored line items with PascalCase properties
          interface StoredLineItem {
            LineID: string;
            DocumentID: string;
            ImpressType: string;
            Category: string;
            Description: string;
            DateFrom: string | null;
            DateTo: string | null;
            CostCentre: string;
            Quantity: number;
            UnitTotalExclGST: number;
            TotalExclGST: number;
            DiscountAmount: number;
            GSTPercent: number;
            GSTAmount: number;
            TotalInclGST: number;
            RequesterEmail: string;
          }

          const lineItems = JSON.parse(storedLineItems) as StoredLineItem[];

          // Filter line items for this specific document
          const documentLineItems = lineItems.filter(
            (item: StoredLineItem) => item.DocumentID === targetDocId
          );

          // Format the data to match your interface
          const formattedData = documentLineItems.map(
            (item: StoredLineItem) => ({
              lineID: item.LineID,
              documentID: item.DocumentID,
              impressType: item.ImpressType,
              category: item.Category,
              description: item.Description,
              dateFrom: item.DateFrom
                ? new Date(item.DateFrom).toLocaleDateString("en-AU", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : null,
              dateTo: item.DateTo
                ? new Date(item.DateTo).toLocaleDateString("en-AU", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : null,
              costCentre: item.CostCentre,
              quantity: item.Quantity,
              unitTotalExclGST: item.UnitTotalExclGST,
              totalExclGST: item.TotalExclGST,
              discount: item.DiscountAmount,
              gstPercentage: item.GSTPercent,
              gstAmount: item.GSTAmount,
              totalInclGST: item.TotalInclGST,
              requesterEmail: item.RequesterEmail,
              lastUpdatedDateTime: null,
            })
          );

          setTableData(formattedData);
        } catch (error) {
          console.error("Error parsing line items:", error);
        }
      }
    } else {
      setTableData([]);
    }
  }, [editingHistorical, isVisible]);

  // If not visible, don't render anything
  if (!isVisible) return null;

  return (
    <div className="mt-8 animate-fadeIn">
      <Card style={{ backgroundColor: customColors.primaryLight }}>
        <CardContent
          className="p-6"
          style={{ backgroundColor: customColors.primaryLight }}
        >
          {/* Form for adding a new invoice row */}
          <div className="bg-white p-4 rounded-md shadow-sm mb-6">
            <h3
              className="text-lg font-medium mb-4"
              style={{ color: customColors.primaryText }}
            >
              Add New Booking Item
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="glAccountNumber" required>
                  Impress Type
                </FieldLabel>

                {/* Regular display when not searching */}
                {!isSearchingAccount && (
                  <div className="relative">
                    <div
                      className="flex h-auto min-h-[42px] w-4/5 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background cursor-pointer"
                      onClick={() => {
                        if (isAccountListLoaded) {
                          setIsSearchingAccount(true);
                          setAccountSearchValue("");
                        }
                      }}
                    >
                      {/* Display selected account or placeholder */}
                      <div className="flex-1 text-gray-800 truncate">
                        {!isAccountListLoaded
                          ? "Loading accounts..."
                          : newRow.impressType
                          ? newRow.impressType // You might want to show the account name too if available
                          : "Select Impress Type"}
                      </div>
                      <div className="ml-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
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
                      {parsedAccountList?.items &&
                        (() => {
                          const filteredItems = parsedAccountList.items
                            .filter((account) => {
                              const searchLower =
                                accountSearchValue.toLowerCase();
                              // Search in both the account number and name
                              return (
                                account.GLAccountNo.toLowerCase().includes(
                                  searchLower
                                ) ||
                                account.GLAccountName.toLowerCase().includes(
                                  searchLower
                                )
                              );
                            })
                            // Remove duplicates if necessary
                            .filter(
                              (account, index, self) =>
                                index ===
                                self.findIndex(
                                  (a) => a.GLAccountNo === account.GLAccountNo
                                )
                            )
                            // Sort by account number
                            .sort((a, b) =>
                              a.GLAccountNo.localeCompare(b.GLAccountNo)
                            )
                            // Limit results
                            .slice(0, 100);

                          if (filteredItems.length === 0) {
                            return (
                              <div className="p-3 text-center text-gray-500">
                                No accounts found
                              </div>
                            );
                          }

                          return filteredItems.map((account) => (
                            <div
                              key={account.GLAccountNo}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                              onClick={() => {
                                // You could also store the combined value if needed
                                handleSelectChange(
                                  "impressType",
                                  `${account.GLAccountNo} ${account.GLAccountName}`
                                );

                                // Exit search mode
                                setIsSearchingAccount(false);
                              }}
                            >
                              {/* Display both account number and name for better clarity */}
                              <div className="font-medium">
                                {account.GLAccountNo}
                              </div>
                              <div className="text-xs text-gray-600">
                                {account.GLAccountName}
                              </div>
                            </div>
                          ));
                        })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="category" required>
                  Category
                </FieldLabel>

                {/* Regular display when not searching */}
                {!isSearchingCategory && (
                  <div className="relative">
                    <div
                      className="flex h-auto min-h-[42px] w-4/5 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background cursor-pointer"
                      onClick={() => {
                        if (isCategoryListLoaded) {
                          setIsSearchingCategory(true);
                          setCategorySearchValue("");
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
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
                      {parsedCategoryList?.items &&
                        (() => {
                          const filteredItems = parsedCategoryList.items
                            .filter((category) =>
                              // Filter by search term if any
                              category.Category.toLowerCase().includes(
                                categorySearchValue.toLowerCase()
                              )
                            )
                            // Remove duplicates if necessary
                            .filter(
                              (category, index, self) =>
                                index ===
                                self.findIndex(
                                  (c) => c.Category === category.Category
                                )
                            )
                            // Sort alphabetically
                            .sort((a, b) =>
                              a.Category.localeCompare(b.Category)
                            )
                            // Limit results
                            .slice(0, 100);

                          if (filteredItems.length === 0) {
                            return (
                              <div className="p-3 text-center text-gray-500">
                                No categories found
                              </div>
                            );
                          }

                          return filteredItems.map((category) => (
                            <div
                              key={`${category.Category}`}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                              onClick={() => {
                                // Update the category value
                                handleSelectChange(
                                  "category",
                                  category.Category
                                );

                                // Exit search mode
                                setIsSearchingCategory(false);
                              }}
                            >
                              {category.Category}
                            </div>
                          ));
                        })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="description" required>
                  Invoice Description
                </FieldLabel>
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
                <FieldLabel htmlFor="costCentre" required>
                  Cost Centre / Store ID
                </FieldLabel>

                {/* Regular display when not searching */}
                {!isSearchingStore && (
                  <div className="relative">
                    <div
                      className="flex h-auto min-h-[42px] w-4/5 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background cursor-pointer"
                      onClick={() => {
                        if (isStoreListLoaded) {
                          setIsSearchingStore(true);
                          setStoreSearchValue("");
                          setVisibleStores(8); // Reset visible stores when opening dropdown
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
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
                        onChange={(e) => {
                          setStoreSearchValue(e.target.value);
                          setVisibleStores(8); // Reset visible count when search changes
                        }}
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

                    {/* Results dropdown with infinite scroll */}
                    <div
                      className="absolute w-4/5 bg-white border rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto z-50"
                      onScroll={(e) => {
                        // Check if we're near the bottom of the scroll container
                        const { scrollTop, scrollHeight, clientHeight } =
                          e.currentTarget;
                        if (scrollTop + clientHeight >= scrollHeight - 20) {
                          // Load more stores
                          setVisibleStores((prev) => prev + 8);
                        }
                      }}
                    >
                      {parsedStoreList?.items &&
                        (() => {
                          // Get current LAWPL_Entity from sessionStorage
                          const currentEntity = getCurrentLAWPLEntity();

                          const filteredItems = parsedStoreList.items
                            .filter(
                              (store) =>
                                // Restore LAWPL entity filtering
                                store.companycode === currentEntity &&
                                // And filter by search term
                                store.code
                                  .toLowerCase()
                                  .includes(storeSearchValue.toLowerCase())
                            )
                            // Remove duplicates if necessary
                            .filter(
                              (store, index, self) =>
                                index ===
                                self.findIndex((s) => s.code === store.code)
                            )
                            // Sort alphabetically
                            .sort((a, b) => a.code.localeCompare(b.code));

                          // Get the total count for display purposes
                          const totalFilteredCount = filteredItems.length;

                          // Only show the visible number of stores
                          const displayedItems = filteredItems.slice(
                            0,
                            visibleStores
                          );

                          if (filteredItems.length === 0) {
                            return (
                              <div className="p-3 text-center text-gray-500">
                                No stores found
                              </div>
                            );
                          }

                          return (
                            <>
                              {displayedItems.map((store) => (
                                <div
                                  key={`${store.code}-${store.companycode}`}
                                  className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                                  onClick={() => {
                                    // Update the store value
                                    handleSelectChange(
                                      "costCentre",
                                      store.code
                                    );

                                    // Exit search mode
                                    setIsSearchingStore(false);
                                  }}
                                >
                                  {store.code}
                                </div>
                              ))}

                              {/* Show indicator if there are more items to load */}
                              {visibleStores < totalFilteredCount && (
                                <div className="p-2 text-center text-sm text-gray-500">
                                  Scroll for more ({displayedItems.length} of{" "}
                                  {totalFilteredCount})
                                </div>
                              )}
                            </>
                          );
                        })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="dateFrom" required>
                  Date From
                </FieldLabel>
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white text-gray-800"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newRow.dateFrom ? (
                        format(new Date(newRow.dateFrom), "PPP")
                      ) : (
                        <span>Select date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        newRow.dateFrom ? new Date(newRow.dateFrom) : undefined
                      }
                      onSelect={(date) => {
                        setNewRow((prev) => ({
                          ...prev,
                          dateFrom: date ? date.toISOString() : null,
                        }));
                        setDateFromOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="dateTo" required>
                  Date To
                </FieldLabel>
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white text-gray-800"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newRow.dateTo ? (
                        format(new Date(newRow.dateTo), "PPP")
                      ) : (
                        <span>Select date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        newRow.dateTo ? new Date(newRow.dateTo) : undefined
                      }
                      onSelect={(date) => {
                        setNewRow((prev) => ({
                          ...prev,
                          dateTo: date ? date.toISOString() : null,
                        }));
                        setDateToOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="quantity" required>
                  Quantity
                </FieldLabel>
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
                <FieldLabel htmlFor="unitTotalExclGST" required>
                  Unit Price $ (excl GST)
                </FieldLabel>
                <Input
                  id="unitTotalExclGST"
                  name="unitTotalExclGST"
                  type="number"
                  step="0.01"
                  value={newRow.unitTotalExclGST.toString()}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="bg-white text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="discount" required>
                  Discount $
                </FieldLabel>
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
                <FieldLabel htmlFor="totalExclGST">
                  Total $ (excl GST)
                </FieldLabel>
                <Input
                  id="totalExclGST"
                  name="totalExclGST"
                  type="number"
                  step="0.01"
                  value={newRow.totalExclGST.toString()}
                  readOnly
                  className="bg-gray-100 text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="gstPercentage" required>
                  GST (%)
                </FieldLabel>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("gstPercentage", parseFloat(value))
                  }
                  value={newRow.gstPercentage.toString()}
                >
                  <SelectTrigger className="bg-white text-gray-800">
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {gstPercentages.map((percentage) => (
                      <SelectItem
                        key={percentage}
                        value={percentage.toString()}
                      >
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
                <FieldLabel htmlFor="totalInclGST">
                  Total $ (incl GST)
                </FieldLabel>
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
                disabled={
                  !newRow.description ||
                  !newRow.costCentre ||
                  !newRow.impressType ||
                  !newRow.category ||
                  !newRow.dateFrom ||
                  !newRow.dateTo ||
                  !newRow.quantity ||
                  !newRow.unitTotalExclGST ||
                  !newRow.gstPercentage ||
                  !newRow.gstAmount ||
                  !newRow.totalInclGST
                } // Disable if required fields are empty
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
                          className="px-2 py-2 text-center text-xs font-medium text-gray-600"
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
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-3 py-2 text-center text-xs break-words whitespace-normal max-w-[150px]"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No booking items yet. Use the form above to add items.
                      </td>
                    </tr>
                  )}
                </tbody>
                {tableData.length > 0 && (
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td
                        colSpan={1}
                        className="px-3 py-2 text-s text-center font-medium"
                      >
                        Total
                      </td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 font-medium text-center text-s">
                        {formatQuantity(totals.totalQty)}
                      </td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 font-medium text-center text-s">
                        ${formatCurrency(totals.totalExclGST)}
                      </td>
                      <td className="px-3 py-2 font-medium text-center text-s">
                        ${formatCurrency(totals.discount)}
                      </td>
                      <td className="px-3 py-2 text-center">-</td>
                      <td className="px-3 py-2 font-medium text-center text-s">
                        ${formatCurrency(totals.gstAmount)}
                      </td>
                      <td className="px-3 py-2 font-medium text-center text-s">
                        ${formatCurrency(totals.totalInclGST)}
                      </td>
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
                  Showing{" "}
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    tableData.length
                  )}{" "}
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

        <CardFooter
          className="flex justify-end gap-2 p-4"
          style={{ backgroundColor: customColors.primaryLight }}
        >
          {/* Buttons row */}
          <Button
            variant="outline"
            onClick={toggleReadOnly}
            title="Return to the booking information"
            className="border border-gray-400"
          >
            Cancel
          </Button>
          {/* Only show this button if editing a historical draft */}
          {editingHistorical &&
            sessionStorage.getItem("editHistoricalVersion") === "Draft" && (
              <Button
                onClick={handleCreateDraftButtonClick}
                variant="outline"
                disabled={tableData.length === 0 || !session || isCreating}
                style={{
                  backgroundColor: customColors.requiredAsterisk,
                  opacity:
                    tableData.length === 0 || !session || isCreating ? 0.5 : 1,
                }}
                className="text-white hover:bg-opacity-90"
              >
                {isCreating ? "Creating..." : "Update Draft"}
              </Button>
            )}
          {/* Show this button only if NOT editing a historical draft */}
          {editingHistorical &&
            sessionStorage.getItem("editHistoricalVersion") !== "Draft" &&
            ""}

          {/* Show this button only if NOT editing*/}
          {!editingHistorical && (
            <Button
              onClick={handleCreateDraftButtonClick}
              variant="outline"
              disabled={tableData.length === 0 || !session || isCreating}
              style={{
                backgroundColor: customColors.requiredAsterisk,
                opacity:
                  tableData.length === 0 || !session || isCreating ? 0.5 : 1,
              }}
              className="text-white hover:bg-opacity-90"
            >
              {isCreating ? "Creating..." : "Save As Draft"}
            </Button>
          )}
          {editingHistorical &&
            sessionStorage.getItem("editHistoricalVersion") !== "Draft" && (
              <Button
                onClick={handleCreateButtonClick}
                variant="outline"
                disabled={tableData.length === 0 || !session || isCreating}
                style={{
                  backgroundColor: customColors.primary,
                  opacity:
                    tableData.length === 0 || !session || isCreating ? 0.5 : 1,
                }}
                className="text-white hover:bg-opacity-90"
              >
                {isCreating ? "Creating..." : "Update Booking"}
              </Button>
            )}

          {/* Show "Create Booking" button unless editing a historical draft */}
          {(!editingHistorical ||
            (editingHistorical &&
              sessionStorage.getItem("editHistoricalVersion") === "Draft")) && (
            <Button
              onClick={handleCreateButtonClick}
              variant="outline"
              disabled={tableData.length === 0 || !session || isCreating}
              style={{
                backgroundColor: customColors.primary,
                opacity:
                  tableData.length === 0 || !session || isCreating ? 0.5 : 1,
              }}
              className="text-white hover:bg-opacity-90"
            >
              {isCreating ? "Creating..." : "Create Booking"}
            </Button>
          )}
        </CardFooter>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 p-4"
            style={{
              backgroundImage: "url(/images/LtrAWPL.jpeg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 1, // 80% transparent (20% opacity)
            }}
          >
            <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
              <div className="p-4 sm:p-6">
                <h3
                  className="text-base sm:text-lg font-medium mb-2 sm:mb-4 text-center"
                  style={{ color: customColors.requiredAsterisk }}
                >
                  {editingHistorical
                    ? sessionStorage.getItem("createVersion") === "Draft"
                      ? `Confirm Booking Update`
                      : `Confirm Booking Creation`
                    : sessionStorage.getItem("createVersion") === "Draft"
                    ? `Confirm Saving Booking As Draft`
                    : `Confirm Booking Creation`}
                </h3>
                <p
                  className="mb-4 sm:mb-6 text-xs sm:text-sm text-center"
                  style={{ color: customColors.primary }}
                >
                  {editingHistorical
                    ? sessionStorage.getItem("createVersion") === "Draft"
                      ? `Are you sure you want to update this booking with ${tableData.length} items?`
                      : `Are you sure you want to create this booking with ${tableData.length} items?`
                    : sessionStorage.getItem("createVersion") === "Draft"
                    ? `Are you sure you want to save this booking with ${tableData.length} items as draft?`
                    : `Are you sure you want to create this booking with ${tableData.length} items?`}
                </p>

                {/* Summary of booking details */}
                <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-gray-50 rounded border text-xs sm:text-sm">
                  <h4 className="font-medium mb-1 sm:mb-2">Booking Summary:</h4>
                  <ul>
                    <li className="flex justify-between py-0.5 sm:py-1">
                      <span>Document ID:</span>
                      <span className="font-medium truncate ml-2 max-w-[160px] sm:max-w-none">
                        {bookingData.DocumentID}
                      </span>
                    </li>
                    <li className="flex justify-between py-0.5 sm:py-1">
                      <span>Company:</span>
                      <span className="font-medium truncate ml-2 max-w-[160px] sm:max-w-none">
                        {bookingData.Company}
                      </span>
                    </li>
                    <li className="flex justify-between py-0.5 sm:py-1">
                      <span>Company Email:</span>
                      <span className="font-medium truncate ml-2 max-w-[160px] sm:max-w-none">
                        {bookingData.CompanyEmail}
                      </span>
                    </li>
                    <li className="flex justify-between py-0.5 sm:py-1">
                      <span>Total Items:</span>
                      <span className="font-medium">{tableData.length}</span>
                    </li>
                    <li className="flex justify-between py-0.5 sm:py-1">
                      <span>Total (Excl GST):</span>
                      <span className="font-medium">
                        ${formatCurrency(totals?.totalExclGST) || "0.00"}
                      </span>
                    </li>
                    <li className="flex justify-between py-0.5 sm:py-1">
                      <span>GST Amount:</span>
                      <span className="font-medium">
                        ${formatCurrency(totals?.gstAmount) || "0.00"}
                      </span>
                    </li>
                    <li className="flex justify-between py-0.5 sm:py-1">
                      <span>Total (Incl GST):</span>
                      <span className="font-medium">
                        ${formatCurrency(totals?.totalInclGST) || "0.00"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center gap-2 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    style={{ backgroundColor: customColors.requiredAsterisk }}
                    className="px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm text-white"
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
                    className="px-3 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm text-white"
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
          <div
            className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 p-4"
            style={{
              backgroundImage: "url(/images/LtrAWPL.jpeg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 1, // 80% transparent (20% opacity)
            }}
          >
            <div
              className={`transform transition-all duration-300 w-full max-w-sm sm:max-w-md ${
                isCreating || creationResult
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0"
              }`}
            >
              <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full mx-auto">
                {/* Loading state */}
                {isCreating && (
                  <div className="p-4 sm:p-6 text-center">
                    <div className="animate-spin mb-3 sm:mb-4 mx-auto h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <p
                      className="text-base sm:text-lg font-medium"
                      style={{ color: customColors.primaryText }}
                    >
                      {editingHistorical
                        ? "Updating booking record..."
                        : "Creating new booking record..."}
                    </p>
                  </div>
                )}

                {/* Success/Error feedback */}
                {creationResult && (
                  <div
                    className={
                      creationResult.success ? "bg-green-50" : "bg-red-50"
                    }
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-center mb-3 sm:mb-4">
                        {creationResult.success ? (
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 sm:h-6 sm:w-6 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 sm:h-6 sm:w-6 text-red-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-center mb-1 sm:mb-2">
                        {creationResult.success
                          ? editingHistorical
                            ? "Booking Updated Successfully"
                            : "Booking Created Successfully"
                          : editingHistorical
                          ? "Failed to Update Booking"
                          : "Failed to Create Booking"}
                      </h3>
                    </div>

                    {/* Close button */}
                    <div className="px-4 sm:px-6 py-2 sm:py-3 flex justify-center">
                      <Button
                        onClick={async () => {
                          setCreationResult(null);
                          setIsRedirecting(true);

                          try {
                            // Wait for the fetch operation to complete
                            await fetchBookingData();
                          } catch (error) {
                            // Log the error but continue with redirect
                            console.error(
                              "Error fetching booking data:",
                              error
                            );
                          } finally {
                            // Always redirect to home page regardless of success or failure
                            window.location.href = "/";
                          }
                        }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base"
                        style={{ backgroundColor: customColors.primary }}
                        disabled={isRedirecting}
                      >
                        {isRedirecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Redirecting...
                          </>
                        ) : creationResult?.success ? (
                          "Return to Home"
                        ) : (
                          "Close"
                        )}
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
