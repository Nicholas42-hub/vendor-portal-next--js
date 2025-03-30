"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Underline } from 'lucide-react';
import { format } from 'date-fns';
import AssetForm from '@/components/BookingPageAssetForm';

// Define proper types for the view booking data
interface Booking {
  id: number;
  title: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: string;
  description: string;
}

// Type for our booking API data
interface BookingApiData {
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

// Define Cutomer type
interface Customer {
  FinanceCompanyCode_JV: string;
  search_name: string;
  full_address: string;
}

interface CustomerData {
  items: Customer[];
}
// Define custom colors
const customColors = {
  primary: '#141E5D',          // Main color
  primaryLight: 'rgba(240, 245, 250, 1)',
  primaryText: 'rgba(0, 51, 102, 1)',
  requiredAsterisk: '#F01E73',  // Bright pink for required field asterisks
  viewTab: '#F01E73', // Add this new red color
};

// Mock data for demonstration purposes
const mockBookings: Booking[] = [
  { id: 1, title: 'Team Meeting', location: 'Conference Room A', date: '2025-03-10', startTime: '10:00', endTime: '11:00', attendees: 'Marketing Team', description: 'Weekly team sync' },
  { id: 2, title: 'Client Presentation', location: 'Meeting Room B', date: '2025-03-15', startTime: '14:00', endTime: '15:30', attendees: 'Client X, Sales Team', description: 'Product demo for Client X' },
];

// Custom label component with colored asterisk
const FieldLabel = ({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: React.ReactNode }) => (
  <Label htmlFor={htmlFor} style={{ color: customColors.primaryText }}>
    {children}
    {required && <span style={{ color: customColors.requiredAsterisk }}>*</span>}
  </Label>
);

const BookingApp: React.FC = () => {
  const { data: session } = useSession();
  const user = useMemo(() => session ? session.user : null, [session]);
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [documentDate, setDocumentDate] = useState<Date | undefined>(undefined);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  const [isTableFormVisible, setIsTableFormVisible] = useState(false);
  // Add a state to track if form fields should be read-only
  const [formFieldsReadOnly, setFormFieldsReadOnly] = useState(false);
  const toggleTableForm = () => {
    // Check if we're trying to open the form
    if (!isTableFormVisible) {
      // Only allow opening if the form is valid
      if (isFormValid()) {
        // Set fields to read-only before showing the table
        setFormFieldsReadOnly(true);
        setIsTableFormVisible(true);
        // Convert the object to a JSON string
        const bookingDataString = JSON.stringify(bookingData);

        // Save to sessionStorage
        sessionStorage.setItem('bookingData', bookingDataString);
      } else {
        // Show some indication that the form needs to be completed first
        console.log("Please complete all required fields before proceeding");
        // You might want to add a notification or highlight invalid fields here

        // Keep the form closed
        setIsTableFormVisible(false);
        setFormFieldsReadOnly(false);
      }
    } else {
      // Always allow closing the form
      setIsTableFormVisible(false);
      setFormFieldsReadOnly(false);
    }
  };


  const [parsedCustomerList, setParsedCustomerList] = useState<CustomerData | null>(null);
  const [isCustomerListLoaded, setIsCustomerListLoaded] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);

  // Searching Company
  const [isSearching, setIsSearching] = useState(false);
  const [searchValue, setSearchValue] = useState('');



  const [creationResult, setCreationResult] = useState<{
    success: boolean;
    message?: string;
    data?: any;
  } | null>(null);


  // For document ID generation
  const [userInitials, setUserInitials] = useState('');
  const [isDocumentIdGenerated, setIsDocumentIdGenerated] = useState(false);

  // Add state to control popover open/close
  const [documentDateOpen, setDocumentDateOpen] = useState(false);
  const [paymentDateOpen, setPaymentDateOpen] = useState(false);

  // Booking data state
  const [bookingData, setBookingData] = useState<BookingApiData>({
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

  // Update form date fields when calendar dates change
  useEffect(() => {
    if (documentDate) {
      const formattedDate = format(documentDate, 'yyyy-MM-dd');
      setBookingData(prev => ({
        ...prev,
        DocumentDate: formattedDate
      }));
      // Close the document date popover after selection
      setDocumentDateOpen(false);
    }
  }, [documentDate]);

  useEffect(() => {
    if (paymentDate) {
      const formattedDate = format(paymentDate, 'yyyy-MM-dd');
      setBookingData(prev => ({
        ...prev,
        PaymentDate: formattedDate
      }));
      // Close the payment date popover after selection
      setPaymentDateOpen(false);
    }
  }, [paymentDate]);

  // Generate document ID based on user name + current date/time
  useEffect(() => {
    if (session?.user?.name && !isDocumentIdGenerated) {
      // Extract user initials
      const nameParts = session.user.name.split(' ');
      let initials = '';

      if (nameParts.length >= 2) {
        // Get first letter of first name and first letter of last name
        initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0]) {
        // If only one name part, use first two letters
        initials = nameParts[0].substring(0, 2).toUpperCase();
      } else {
        // Fallback if no name is available
        initials = 'XX';
      }

      setUserInitials(initials);
      generateDocumentID(initials);
      setIsDocumentIdGenerated(true);

      // Set the RequesterName from session
      setBookingData(prev => ({
        ...prev,
        RequesterName: user?.name || ""
      }));
    }

    // Set the RequesterEmail from session
    if (session?.user?.email) {
      setBookingData(prev => ({
        ...prev,
        RequesterEmail: user?.email || ""
      }));
    }
  }, [session, isDocumentIdGenerated, user]);

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

    console.log(`Attempting to load customer data from localStorage... (Attempt ${loadAttempts + 1})`);
    console.log(`Data is ${isDataStale ? 'stale' : 'fresh'}, will ${shouldDoMultipleAttempts ? 'do' : 'not do'} multiple attempts`);

    try {
      // Get data synchronously from localStorage
      const customerList = localStorage.getItem('customer_data');

      if (customerList) {
        const parsed = JSON.parse(customerList);

        // Immediately set the state with the parsed data
        setParsedCustomerList(parsed);
        setIsCustomerListLoaded(true);


        // Log some stats for debugging
        const customerCount = parsed.items?.length || 0;
        console.log(`[Attempt ${loadAttempts + 1}] Loaded ${customerCount} customers from localStorage`);
      } else {
        console.log(`[Attempt ${loadAttempts + 1}] No customer data found in localStorage`);
        setIsCustomerListLoaded(true); // Mark as loaded even if no data
      }
    } catch (error) {
      console.error(`[Attempt ${loadAttempts + 1}] Error loading customer data from localStorage:`, error);
      setIsCustomerListLoaded(true); // Mark as loaded even if error
    }

    // Schedule additional attempts ONLY if data is stale AND we haven't reached the maximum attempts
    if (shouldDoMultipleAttempts && loadAttempts < 7) {  // Try max 6 times
      const timer = setTimeout(() => {
        setLoadAttempts(prev => prev + 1);
      }, 10000);  // Wait 10 seconds between attempts

      return () => clearTimeout(timer);  // Cleanup on unmount
    }
  }, [loadAttempts]);

  // Add this effect to reset Company when LTRAWPL_Entity changes
  useEffect(() => {
    // Reset Company field when LTRAWPL_Entity changes
    if (bookingData.Company) {
      // Check if the currently selected company exists for the new entity
      const companyExists = parsedCustomerList?.items?.some(
        customer =>
          customer.FinanceCompanyCode_JV === bookingData.LTRAWPL_Entity &&
          customer.search_name === bookingData.Company
      );

      // If company doesn't exist for this entity, reset it
      if (!companyExists) {
        setBookingData(prev => ({
          ...prev,
          Company: "" // Reset to empty string to show placeholder
        }));
      }
    }
  }, [bookingData.LTRAWPL_Entity, parsedCustomerList]);


  // Generate document ID - only once
  const generateDocumentID = (initials: string) => {
    const now = new Date();

    // Format: DD/MM/YY
    const datePart = [
      String(now.getDate()).padStart(2, '0'),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getFullYear()).slice(-2)
    ].join('');

    // Format: HH/MM/SS
    const timePart = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join('');

    const documentID = `${initials}${datePart}${timePart}`;

    setBookingData(prev => ({
      ...prev,
      DocumentID: documentID
    }));
  };


  // Reset form when switching to create tab
  useEffect(() => {
    if (activeTab === 'create') {
      // Only reset non-user specific fields, keeping DocumentID and user info
      setBookingData(prev => ({
        ...prev,
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
        VendorSignoffRequired: "",
        Status: "Pending"
      }));

      setCreationResult(null);
    }
  }, [activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update the Date objects when date inputs change
    if (name === 'DocumentDate' && value) {
      setDocumentDate(new Date(value));
    } else if (name === 'PaymentDate' && value) {
      setPaymentDate(new Date(value));
    }
  };

  const handleSelectChange = (name: string, value: string) => {


    // Special handling for LTRAWPL_Entity changes
    if (name === 'LTRAWPL_Entity') {
      // Always reset Company when changing entity
      setBookingData(prev => ({
        ...prev,
        [name]: value,
        // Clear company and company address when changing entity
        Company: "",
        CompanyAddress: ""
      }));

      //Set Session Storage for the LAWPL entity
      sessionStorage.setItem("LAWPL_entity", value);
      setIsTableFormVisible(false);


    } else {
      // Normal handling for other fields
      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));

      // If company was selected, auto-populate the address
      if (name === 'Company' && value) {
        // Use the value parameter directly, not a state update result
        const selectedCompany = parsedCustomerList?.items?.find(
          customer =>
            customer.search_name === value && // Compare with the value parameter
            customer.FinanceCompanyCode_JV === bookingData.LTRAWPL_Entity
        );

        // If found, update the address
        if (selectedCompany?.full_address) {
          setBookingData(prev => ({
            ...prev,
            CompanyAddress: selectedCompany.full_address
          }));
        }
        else {
          setBookingData(prev => ({
            ...prev,
            CompanyAddress: ""
          }));
        }
      }
    }
  };



  // Check if required fields are filled
  const isFormValid = () => {
    const requiredFieldsExceptRequester = Object.entries(bookingData).filter(
      ([key]) => key !== 'RequesterName' && key !== 'RequesterEmail' && key !== 'CompanyContactPhone' && key !== 'Status' && key !== 'RequestDateTime'
    );
    return requiredFieldsExceptRequester.every(([_, value]) => value.trim() !== "");
  };

  const handleReset = () => {
    // Reset the form but keep the user information and DocumentID
    setBookingData(prev => ({
      ...prev,
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
      VendorSignoffRequired: "",
    }));
    setDocumentDate(undefined);
    setPaymentDate(undefined);
    setCreationResult(null);
    setIsTableFormVisible(false);
    setFormFieldsReadOnly(false);
  };

  // For the View tab functionality (unchanged)
  const filteredBookings = bookings.filter(booking =>
    booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Available options for currency and other selects
  const currencies = ['AUD', 'NZD', 'EUR', 'GBP', 'USD'];
  const billingPeriods = ['Monthly', 'Quarterly', 'Half-Yearly', 'Annually', 'In Full'];
  const ltrawplEntity = ['ALAW', 'AUAW', 'AUDF', 'AUTE', 'NZDF', 'NZTE', 'NZAW'];
  const businessUnit = ['TE', 'SPEC', 'DF', 'FS'];


  // Custom styles for the component
  const styles = {
    card: {
      marginBottom: '1.5rem',
    },
    cardHeader: {
      backgroundColor: customColors.primary,
      color: 'white',
    },
    cardTitle: {
      display: 'flex',
      alignItems: 'center',
      color: 'white',
      fontWeight: 'normal',
    },
    createTabContent: {
      backgroundColor: customColors.primaryLight,
      padding: '1.5rem',
      borderRadius: '0.375rem',
    },
    button: {
      backgroundColor: customColors.primary,
      color: 'white',
      borderColor: 'transparent',
      '&:hover': {
        backgroundColor: `${customColors.primary}ee`,
      },
    },
    resetButton: {
      backgroundColor: customColors.requiredAsterisk,
      color: customColors.primaryLight,
      borderColor: customColors.primaryText,
    },
    text: {
      color: customColors.primaryText,
    },
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card className="mb-6" style={{ backgroundColor: customColors.primaryLight }}>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'create' | 'view')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white">
              <TabsTrigger
                value="create"
                style={activeTab === 'create' ? { backgroundColor: customColors.primary, color: 'white' } : {}}
              >
                Create Booking
              </TabsTrigger>
              <TabsTrigger
                value="view"
                style={activeTab === 'view' ? { backgroundColor: customColors.viewTab, color: 'white' } : {}}
              >
                View Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" style={styles.createTabContent}>
              {!session && (
                <div className="p-3 bg-red-50 rounded-md">
                  <p className="text-red-600">
                    Please log in to create a booking record
                  </p>
                </div>
              )}

              {/* First row with Document ID, LAWPL Entity, and Vendor Signoff Required */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2" style={{ width: "50%" }}>
                  <FieldLabel htmlFor="DocumentID">Document ID</FieldLabel>
                  <Input
                    id="DocumentID"
                    name="DocumentID"
                    value={bookingData.DocumentID}
                    className="bg-gray-100 text-gray-800"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="LTRAWPL_Entity" required>LAWPL Entity</FieldLabel>
                  {formFieldsReadOnly ? (
                    // Read-only display when forms are locked
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm">
                      {bookingData.LTRAWPL_Entity || "Not selected"}
                    </div>
                  ) : (
                    <Select
                      onValueChange={(value) => handleSelectChange('LTRAWPL_Entity', value)}
                      value={bookingData.LTRAWPL_Entity}
                      disabled={formFieldsReadOnly}
                    >
                      <SelectTrigger className="bg-white text-gray-800" style={{ width: "70%" }}>
                        <SelectValue placeholder="Select entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {ltrawplEntity.map(entity => (
                          <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="VendorSignoffRequired" required>Vendor Signoff Required</FieldLabel>
                  {formFieldsReadOnly ? (
                    // Read-only display when forms are locked
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm">
                      {bookingData.VendorSignoffRequired || "Not selected"}
                    </div>
                  ) : (
                    // Normal select when editable
                    <Select
                      onValueChange={(value) => handleSelectChange('VendorSignoffRequired', value)}
                      value={bookingData.VendorSignoffRequired}
                      disabled={formFieldsReadOnly}
                    >
                      <SelectTrigger className="bg-white text-gray-800">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Second row - Company field and Company Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                <div className="space-y-2 md:col-span-2">
                  <FieldLabel htmlFor="Company" required>Company</FieldLabel>
                  {formFieldsReadOnly ? (
                    /* Read-only display for company */
                    <div className="flex h-auto min-h-[42px] w-4/5 rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {bookingData.Company || "No company selected"}
                    </div>
                  ) : (
                    /* Interactive company selection when not read-only */
                    <>

                      {/* Regular Select without search functionality */}
                      {!isSearching && (
                        <div className="relative">
                          <div
                            className="flex h-auto min-h-[42px] w-4/5 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background cursor-pointer"
                            onClick={() => {
                              if (!(!isCustomerListLoaded || !bookingData.LTRAWPL_Entity)) {
                                setIsSearching(true);
                                setSearchValue('');
                              }
                            }}
                          >
                            {/* Display selected company or placeholder */}
                            <div className="flex-1 text-gray-800 truncate">
                              {!isCustomerListLoaded
                                ? "Loading companies..."
                                : !bookingData.LTRAWPL_Entity
                                  ? "Select LAWPL Entity first"
                                  : bookingData.Company
                                    ? bookingData.Company
                                    : "Select company"}
                            </div>
                            <div className="ml-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Search mode - completely different component */}
                      {isSearching && isCustomerListLoaded && bookingData.LTRAWPL_Entity && (
                        <div className="relative">
                          <div className="flex">
                            <Input
                              value={searchValue}
                              onChange={(e) => setSearchValue(e.target.value)}
                              placeholder="Search companies..."
                              className="w-4/5 bg-white text-gray-800 min-h-[42px]"
                              autoFocus
                            />
                            <Button
                              type="button"
                              onClick={() => setIsSearching(false)}
                              className="ml-2"
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>

                          {/* Results dropdown */}
                          <div className="absolute w-4/5 bg-white border rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
                            {parsedCustomerList?.items && (
                              (() => {
                                const filteredItems = parsedCustomerList.items
                                  .filter(customer =>
                                    customer.FinanceCompanyCode_JV === bookingData.LTRAWPL_Entity &&
                                    customer.search_name &&
                                    customer.search_name.trim() !== '' &&
                                    customer.search_name.toLowerCase().includes(searchValue.toLowerCase())
                                  )
                                  // Remove duplicates
                                  .filter((customer, index, self) =>
                                    index === self.findIndex(c => c.search_name === customer.search_name)
                                  )
                                  // Sort alphabetically
                                  .sort((a, b) => a.search_name.localeCompare(b.search_name))
                                  // Limit results
                                  .slice(0, 8);

                                if (filteredItems.length === 0) {
                                  return (
                                    <div className="p-3 text-center text-gray-500">
                                      No companies found
                                    </div>
                                  );
                                }

                                return filteredItems.map(customer => (
                                  <div
                                    key={`${customer.search_name}-${customer.FinanceCompanyCode_JV}`}
                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                                    onClick={() => {
                                      // Here we call the handler to update booking data
                                      handleSelectChange('Company', customer.search_name);

                                      // Auto-populate the company address if available
                                      if (customer.full_address) {
                                        setBookingData(prev => ({
                                          ...prev,
                                          CompanyAddress: customer.full_address
                                        }));
                                      }

                                      // Exit search mode
                                      setIsSearching(false);
                                    }}
                                  >
                                    {customer.search_name}
                                  </div>
                                ));
                              })()
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="CompanyAddress" required>Company Address</FieldLabel>
                  {formFieldsReadOnly ? (
                    // Read-only display
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {bookingData.CompanyAddress || "No address"}
                    </div>
                  ) : (
                    <Input
                      id="CompanyAddress"
                      name="CompanyAddress"
                      value={bookingData.Company ? bookingData.CompanyAddress : ""}
                      onChange={handleInputChange}
                      placeholder={bookingData.Company ? "Enter company address" : "Select company first"}
                      className="bg-white text-gray-800"
                      disabled={!bookingData.Company}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Remaining fields in 3-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <FieldLabel htmlFor="CompanyContactName" required>Company Contact Name</FieldLabel>
                  {formFieldsReadOnly ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {bookingData.CompanyContactName || "Not provided"}
                    </div>
                  ) : (
                    <Input
                      id="CompanyContactName"
                      name="CompanyContactName"
                      value={bookingData.CompanyContactName}
                      onChange={handleInputChange}
                      placeholder="Enter company contact"
                      className="bg-white text-gray-800"
                      required
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="CompanyEmail" required>Company Email</FieldLabel>
                  {formFieldsReadOnly ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {bookingData.CompanyEmail || "Not provided"}
                    </div>
                  ) : (
                    <Input
                      id="CompanyEmail"
                      name="CompanyEmail"
                      type="email"
                      value={bookingData.CompanyEmail}
                      onChange={handleInputChange}
                      placeholder="Enter company email"
                      className="bg-white text-gray-800"
                      required
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="CompanyContactPhone">Company Contact Phone</FieldLabel>
                  {formFieldsReadOnly ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {bookingData.CompanyContactPhone || "Not provided"}
                    </div>
                  ) : (
                    <Input
                      id="CompanyContactPhone"
                      name="CompanyContactPhone"
                      type="number"
                      value={bookingData.CompanyContactPhone}
                      onChange={handleInputChange}
                      placeholder="Enter contact phone"
                      className="bg-white text-gray-800"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="BusinessUnit" required>Business Unit</FieldLabel>
                  {formFieldsReadOnly ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {bookingData.BusinessUnit || "Not selected"}
                    </div>
                  ) : (
                    <Select
                      onValueChange={(value) => handleSelectChange('BusinessUnit', value)}
                      value={bookingData.BusinessUnit}
                    >
                      <SelectTrigger className="bg-white text-gray-800">
                        <SelectValue placeholder="Select business unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessUnit.map(businessunit => (
                          <SelectItem key={businessunit} value={businessunit}>{businessunit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="Currency" required>Currency</FieldLabel>
                  {formFieldsReadOnly ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {bookingData.Currency || "Not selected"}
                    </div>
                  ) : (
                    <Select
                      onValueChange={(value) => handleSelectChange('Currency', value)}
                      value={bookingData.Currency}
                    >
                      <SelectTrigger className="bg-white text-gray-800">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="DocumentDate" required>Document Date</FieldLabel>
                  {formFieldsReadOnly ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {documentDate ? format(documentDate, 'PPP') : "Not selected"}
                    </div>
                  ) : (
                    <Popover open={documentDateOpen} onOpenChange={setDocumentDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white text-gray-800"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {documentDate ? format(documentDate, 'PPP') : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={documentDate}
                          onSelect={(date) => {
                            setDocumentDate(date);
                            // Calendar will be closed in the useEffect
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="PaymentDate" required>Payment Due Date</FieldLabel>
                  {formFieldsReadOnly ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {paymentDate ? format(paymentDate, 'PPP') : "Not selected"}
                    </div>
                  ) : (

                    <Popover open={paymentDateOpen} onOpenChange={setPaymentDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white text-gray-800"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {paymentDate ? format(paymentDate, 'PPP') : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={paymentDate}
                          onSelect={(date) => {
                            setPaymentDate(date);
                            // Calendar will be closed in the useEffect
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="BillingPeriod" required>Billing Period</FieldLabel>
                  {formFieldsReadOnly ? (
                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800">
                      {bookingData.BillingPeriod || "Not selected"}
                    </div>
                  ) : (
                    <Select
                      onValueChange={(value) => handleSelectChange('BillingPeriod', value)}
                      value={bookingData.BillingPeriod}
                    >
                      <SelectTrigger className="bg-white text-gray-800">
                        <SelectValue placeholder="Select billing period" />
                      </SelectTrigger>
                      <SelectContent>
                        {billingPeriods.map(period => (
                          <SelectItem key={period} value={period}>{period}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

              </div>


              {/* Hidden fields for RequesterName and RequesterEmail */}
              <input type="hidden" name="RequesterName" value={bookingData.RequesterName} />
              <input type="hidden" name="RequesterEmail" value={bookingData.RequesterEmail} />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  style={styles.resetButton}
                  className="border border-gray-400"
                >
                  Reset
                </Button>
              </div>
            </TabsContent>

            {/* View tab - kept unchanged from original BookingApp */}
            <TabsContent value="view">
              <div className="mb-4">
                <Label htmlFor="search">Search Bookings</Label>
                <Input
                  id="search"
                  placeholder="Search by title, location or description"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
              </div>

              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No bookings found. Create a new booking to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map(booking => (
                    <Card key={booking.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 py-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{booking.title}</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="h-8 px-2 text-blue-600"
                              onClick={() => { }} // Edit function would go here
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 px-2 text-red-600"
                              onClick={() => { }} // Delete function would go here
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4">
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="font-medium">Location:</div>
                          <div>{booking.location}</div>

                          <div className="font-medium">Date:</div>
                          <div>{booking.date}</div>

                          <div className="font-medium">Time:</div>
                          <div>{booking.startTime} - {booking.endTime}</div>

                          <div className="font-medium">Attendees:</div>
                          <div>{booking.attendees}</div>

                          <div className="font-medium">Description:</div>
                          <div className="col-span-2 mt-1">{booking.description}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="flex justify-center mt-6 mb-6">
        <Button
          onClick={toggleTableForm}
          disabled={!isFormValid()}
          className="px-6 py-2 text-white"
          style={{ backgroundColor: customColors.primary }}
        >
          {isTableFormVisible ? 'Hide Activation Form' : 'Show Activation Form'}
        </Button>
      </div>

      <AssetForm
        isVisible={isTableFormVisible}
        onClose={() => setIsTableFormVisible(false)}
        customerData={parsedCustomerList}
        session={session}
      />
    </div>
  );
};

export default BookingApp;