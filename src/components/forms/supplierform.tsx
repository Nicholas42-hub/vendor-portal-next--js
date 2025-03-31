"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { countries } from "@/lib/countries";

// Define the form schema with zod
const supplierFormSchema = z.object({
  // 1. Supplier Details
  business_name: z.string().min(1, "Business name is required"),
  trading_name: z.string().min(1, "Trading name is required"),
  country: z.string().min(1, "Country is required"),
  gst_registered: z.enum(["Yes", "No"]),
  
  // Conditional fields based on country
  abn: z.string().optional()
    .refine(val => val === undefined || val.length > 0, "ABN is required for Australian businesses"),
  gst: z.string().optional()
    .refine(val => val === undefined || val.length > 0, "GST number is required for New Zealand businesses"),
  
  address: z.string().min(1, "Address is required"),
  website: z.string().optional(),
  postal_address: z.string().min(1, "Postal address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postcode: z.string().min(1, "Postcode is required"),
  
  accounts_contact: z.string().email("Invalid email address"),
  telephone: z.string().min(1, "Telephone is required"),
  po_email: z.string().email("Invalid email address"),
  return_order_email: z.string().email("Invalid email address"),
  invoice_currency: z.string().min(1, "Currency is required"),
  
  // 2. Banking Details
  payment_method: z.enum(["Bank Transfer", "Bepay"]),
  
  // Conditional fields based on payment method and country
  au_bank_name: z.string().optional(),
  au_bank_email: z.string().email("Invalid email address").optional(),
  bsb: z.string().optional()
    .refine(val => val === undefined || val.length === 6, "BSB must be exactly 6 digits"),
  account: z.string().optional()
    .refine(val => val === undefined || val.length === 10, "Account number must be exactly 10 digits"),
  
  nz_bank_name: z.string().optional(),
  nz_bank_email: z.string().email("Invalid email address").optional(),
  nz_BSB: z.string().optional()
    .refine(val => val === undefined || val.length === 6, "BSB must be exactly 6 digits"),
  nz_account: z.string().optional()
    .refine(val => val === undefined || val.length === 10, "Account number must be exactly 10 digits"),
  
  IBAN_SWITCH_yn: z.enum(["IBAN", "SWITCH"]).optional(),
  overseas_bank_email: z.string().email("Invalid email address").optional(),
  IBAN: z.string().optional(),
  SWITCH: z.string().optional(),
  
  biller_code: z.string().optional(),
  ref_code: z.string().optional(),
  
  // 3. Consent
  Iagree: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export default function SupplierForm() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [fileUploaded, setFileUploaded] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  
  // Access current user's business name
  const [currentUserInfo, setCurrentUserInfo] = useState({
    email: "",
    description: ""
  });
  
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      business_name: "",
      trading_name: "",
      country: "",
      gst_registered: "No",
      address: "",
      website: "",
      postal_address: "",
      city: "",
      state: "",
      postcode: "",
      accounts_contact: "",
      telephone: "",
      po_email: "",
      return_order_email: "",
      invoice_currency: "",
      payment_method: "Bank Transfer",
      Iagree: false
    },
  });
  
  // Watch for value changes to implement conditional logic
  const watchCountry = form.watch("country");
  const watchGstRegistered = form.watch("gst_registered");
  const watchPaymentMethod = form.watch("payment_method");
  const watchIbanSwitch = form.watch("IBAN_SWITCH_yn");
  
  // Fetch user data on component mount
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData(session.user.email);
      
      // Set email fields
      form.setValue("accounts_contact", session.user.email);
      form.setValue("po_email", session.user.email);
      form.setValue("return_order_email", session.user.email);
    }
  }, [session, form]);
  
  // Fetch current user data from API
  const fetchUserData = async (email: string) => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll use a mock implementation
      setCurrentUserInfo({
        email: email,
        description: "Australia" // Or could be "New Zealand" or "Overseas"
      });
      
      // Pre-select the country based on description
      if (currentUserInfo.description) {
        form.setValue("country", currentUserInfo.description);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if the file is a PDF
      if (file.type === "application/pdf") {
        setFileUploaded(file);
        setFileError("");
      } else {
        setFileUploaded(null);
        setFileError("Please upload a PDF file only.");
      }
    } else {
      setFileUploaded(null);
    }
  };
  
  // Handle form submission
  const onSubmit = (data: SupplierFormValues) => {
    // Check if a file is uploaded when payment method is Bank Transfer
    if (data.payment_method === "Bank Transfer" && !fileUploaded) {
      setFileError("Please attach a bank statement.");
      return;
    }
    
    // Show confirmation popup
    setShowConfirmPopup(true);
  };
  
  // Handle final submit after confirmation
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmPopup(false);
    
    try {
      const formData = form.getValues();
      
      // Create the record object to submit
      const record = {
        lastname: formData.business_name,
        crb7c_abn: formData.abn || "",
        crb7c_accountcontact: formData.accounts_contact,
        address1_city: formData.city,
        crb7c_nzgst: formData.gst || "",
        crb7c_invoicecurrency: formData.invoice_currency,
        address1_postofficebox: formData.postal_address,
        address1_postalcode: formData.postcode,
        address1_stateorprovince: formData.state,
        websiteurl: formData.website || "",
        address1_telephone2: formData.telephone,
        crb7c_tradingname: formData.trading_name,
        crb7c_aubsb: formData.bsb || "",
        crb7c_auaccount: formData.account || "",
        crb7c_nzbsb: formData.nz_BSB || "",
        crb7c_nzaccount: formData.nz_account || "",
        crb7c_statuscode: "Pending Manager Approval",
        crb7c_vendorsetupstatus: "Pending",
        crb7c_bankname: formData.au_bank_name || formData.nz_bank_name || "",
      };
      
      // This would be replaced with an actual API call
      // e.g., await updateVendorRecord(record);
      console.log("Submitting record:", record);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success popup
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your form. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle closing of success popup
  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
    // Reset form
    form.reset();
    setFileUploaded(null);
    // Redirect to profile page
    window.location.href = "/profile";
  };

  // If session is loading or not authenticated
  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (status === "unauthenticated") {
    return <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
      <p className="mb-4">You must be logged in to view this form.</p>
      <Button onClick={() => window.location.href = "/auth/signin"}>
        Sign In
      </Button>
    </div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Vendor Onboarding Form</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* 1. Supplier Details Section */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-6">1. Supplier Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business Name */}
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            readOnly 
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Trading Name */}
                  <FormField
                    control={form.control}
                    name="trading_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trading Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Country */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map(country => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* GST Registered */}
                  <FormField
                    control={form.control}
                    name="gst_registered"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registered for GST? <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Yes or No" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Australian Business Number (conditionally rendered) */}
                  {watchCountry === "Australia" && watchGstRegistered === "Yes" && (
                    <FormField
                      control={form.control}
                      name="abn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Australian Business Number (ABN) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              inputMode="numeric"
                              onChange={(e) => {
                                // Keep only digits
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* New Zealand GST Number (conditionally rendered) */}
                  {watchCountry === "New Zealand" && watchGstRegistered === "Yes" && (
                    <FormField
                      control={form.control}
                      name="gst"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Zealand GST Number <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              inputMode="numeric"
                              onChange={(e) => {
                                // Keep only digits
                                const value = e.target.value.replace(/\D/g, '');
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-full">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Start typing an address..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Website */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Postal Address */}
                  <FormField
                    control={form.control}
                    name="postal_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Address <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* City */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* State */}
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Postcode */}
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            inputMode="numeric"
                            onChange={(e) => {
                              // Keep only digits
                              const value = e.target.value.replace(/\D/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Primary Contact Email */}
                  <FormField
                    control={form.control}
                    name="accounts_contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Contact Email <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="example@domain.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Telephone */}
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telephone <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            inputMode="numeric"
                            onChange={(e) => {
                              // Keep only digits and formatting characters
                              const value = e.target.value.replace(/[^\d+\-\s()]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* PO Email */}
                  <FormField
                    control={form.control}
                    name="po_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PO Email <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="example@domain.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Return Order Email */}
                  <FormField
                    control={form.control}
                    name="return_order_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Order Email <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="example@domain.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Invoice Currency */}
                  <FormField
                    control={form.control}
                    name="invoice_currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Currency <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AUD">AUD</SelectItem>
                            <SelectItem value="NZD">NZD</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="CNY">CNY</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* 2. Banking Details Section */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-6">2. Banking Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Payment Method */}
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem className="col-span-full">
                        <FormLabel>Payment Method <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Payment Method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Bepay">Bepay</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Bank Transfer Fields */}
                  {watchPaymentMethod === "Bank Transfer" && (
                    <>
                      {/* Australia Banking Fields */}
                      {watchCountry === "Australia" && (
                        <div className="col-span-full bg-white p-4 rounded-md">
                          <h3 className="font-medium mb-4">Australia</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="au_bank_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bank Name <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="au_bank_email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bank Email <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="email"
                                      placeholder="example@domain.com"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="bsb"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>BSB <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      maxLength={6}
                                      inputMode="numeric"
                                      onChange={(e) => {
                                        // Keep only digits
                                        const value = e.target.value.replace(/\D/g, '');
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Must be exactly 6 digits
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="nz_account"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Number <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      maxLength={10}
                                      minLength={10}
                                      inputMode="numeric"
                                      onChange={(e) => {
                                        // Keep only digits
                                        const value = e.target.value.replace(/\D/g, '');
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Must be exactly 10 digits
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Overseas Banking Fields */}
                      {watchCountry !== "Australia" && watchCountry !== "New Zealand" && (
                        <div className="col-span-full bg-white p-4 rounded-md">
                          <h3 className="font-medium mb-4">Overseas</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="IBAN_SWITCH_yn"
                              render={({ field }) => (
                                <FormItem className="col-span-full">
                                  <FormLabel>IBAN or SWITCH <span className="text-red-500">*</span></FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select an option" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="IBAN">IBAN</SelectItem>
                                      <SelectItem value="SWITCH">SWITCH</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {watchIbanSwitch === "IBAN" && (
                              <>
                                <FormField
                                  control={form.control}
                                  name="overseas_bank_email"
                                  render={({ field }) => (
                                    <FormItem className="col-span-full">
                                      <FormLabel>Bank Email <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          type="email"
                                          placeholder="example@domain.com"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="IBAN"
                                  render={({ field }) => (
                                    <FormItem className="col-span-full">
                                      <FormLabel>IBAN <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          maxLength={34}
                                          minLength={34}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Must be exactly 34 characters
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </>
                            )}
                            
                            {watchIbanSwitch === "SWITCH" && (
                              <FormField
                                control={form.control}
                                name="SWITCH"
                                render={({ field }) => (
                                  <FormItem className="col-span-full">
                                    <FormLabel>SWITCH <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        maxLength={34}
                                        minLength={34}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Must be exactly 34 characters
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Bank Statement Upload */}
                      <div className="col-span-full mt-4">
                        <Label>Please attach a recent (last 3 months) bank statement - PDF only <span className="text-red-500">*</span></Label>
                        <div className="mt-2">
                          <div className={cn(
                            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
                            fileError ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                          )}>
                            <input
                              type="file"
                              id="file-input"
                              accept=".pdf"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => document.getElementById('file-input')?.click()}
                            >
                              Choose a PDF file
                            </Button>
                            {fileUploaded && (
                              <p className="mt-2 text-sm text-gray-600">{fileUploaded.name}</p>
                            )}
                          </div>
                          {fileError && (
                            <p className="mt-1 text-sm text-red-500">{fileError}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Bepay Fields */}
                  {watchPaymentMethod === "Bepay" && (
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="biller_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biller Code <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                inputMode="numeric"
                                onChange={(e) => {
                                  // Keep only digits
                                  const value = e.target.value.replace(/\D/g, '');
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="ref_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ref Code <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                inputMode="numeric"
                                onChange={(e) => {
                                  // Keep only digits
                                  const value = e.target.value.replace(/\D/g, '');
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* 3. Consent Statement Section */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-6">3. Consent Statement</h2>
                
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      type="button"
                      className="text-blue-600 underline"
                      onClick={() => setShowTerms(!showTerms)}
                    >
                      Please click to view the terms and conditions
                    </button>
                    <span className="text-red-500">*</span>
                  </div>
                  
                  {showTerms && (
                    <div className="w-full bg-white border rounded-md p-4 mb-4">
                      <div className="mb-4">
                        <iframe 
                          src="/Supplierterm.pdf" 
                          className="w-full h-[500px] border"
                          title="Terms and Conditions"
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="Iagree"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Acknowledge the terms and conditions <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit onboarding form'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Would you want to proceed?</h2>
            <div className="flex justify-between gap-4">
              <Button
                onClick={handleConfirmSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                Yes
              </Button>
              <Button
                onClick={() => setShowConfirmPopup(false)}
                variant="destructive"
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Thank you!</h2>
            <p className="mb-6">Your form has been successfully submitted. Thanks!</p>
            <div className="flex justify-center">
              <Button
                onClick={handleSuccessClose}
                className="bg-green-600 hover:bg-green-700"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Must be exactly 6 digits
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="account"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Number <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      maxLength={10}
                                      inputMode="numeric"
                                      onChange={(e) => {
                                        // Keep only digits
                                        const value = e.target.value.replace(/\D/g, '');
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Must be exactly 10 digits
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* New Zealand Banking Fields */}
                      {watchCountry === "New Zealand" && (
                        <div className="col-span-full bg-white p-4 rounded-md">
                          <h3 className="font-medium mb-4">New Zealand</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="nz_bank_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bank Name <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="nz_bank_email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bank Email <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="email"
                                      placeholder="example@domain.com"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="nz_BSB"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>BSB <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      maxLength={6}
                                      minLength={6}
                                      inputMode="numeric"
                                      onChange={(e) => {
                                        // Keep only digits
                                        const value = e.target.value.replace(/\D/g, '');
                                        field.onChange