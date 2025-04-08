"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

// Custom alert component
const Alert = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive";
}) => {
  const bgColor =
    variant === "destructive"
      ? "bg-red-50 border-red-500"
      : "bg-blue-50 border-blue-500";
  return (
    <div className={`p-4 border-l-4 ${bgColor} rounded-md`}>{children}</div>
  );
};

const AlertTitle = ({ children }: { children: React.ReactNode }) => (
  <h5 className="text-lg font-medium mb-1">{children}</h5>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm">{children}</p>
);
import axios from "axios";

// Define types
interface Approver {
  id?: string;
  email: string;
  lastname: string;
  name: string;
  jobtitle?: string;
}

interface ApproverMatrix {
  id: string;
  businessUnit: string;
  approver0: string;
  approver0_name: string;
  approver1: string;
  approver1_name: string;
  approver2: string;
  approver2_name: string;
  approver3: string;
  approver3_name: string;
  createdOn: string;
}

// Business unit mapping
const businessUnitIdMap: Record<string, string> = {
  "Duty Free": "0e77799b-dbea-43a5-9583-ef630753cf8b",
  "Food Services": "bd5ba99c-3697-4f5d-97e5-72c232394106",
  Specialty: "dcbf60bc-6bfc-44ee-a3d3-877f52144e9e",
  "Travel Essentials": "930dc67f-f921-48ad-a0c1-741c1200f751",
  Finance: "6033d111-9878-ef11-ac20-00224891e3e1",
  IT: "76dc8932-0887-ef11-ac20-00224894b1b5",
};

/**
 * ApproversMatrixDropdowns is a child component that renders dropdowns
 * for Procurement, Manager, CFO, and Exco approvers based on filtering logic.
 */
interface ApproversMatrixDropdownsProps {
  contacts: Approver[];
  selectedBusinessUnit: string;
  formData: {
    approver0: string;
    approver0backup: string;
    approver1: string;
    approver1backup: string;
    approver2: string;
    approver2backup: string;
    approver3: string;
    approver3backup: string;
  };
  onApproverChange: (
    field: keyof ApproversMatrixDropdownsProps["formData"],
    value: string
  ) => void;
  isLoading: boolean;
}

const ApproversMatrixDropdowns: React.FC<ApproversMatrixDropdownsProps> = ({
  contacts,
  selectedBusinessUnit,
  formData,
  onApproverChange,
  isLoading,
}) => {
  // Filter contacts based on roles
  const procurementApprovers = contacts.filter((contact) =>
    ["Camillus PREVOO", "Tom RYAN"].includes(contact.lastname)
  );

  const cfoApprovers = contacts.filter((contact) =>
    ["Nik WEST", "Alfonso LOPEZ"].includes(contact.lastname)
  );

  const excoApprovers = contacts.filter((contact) =>
    [
      "Stav VAFEAS",
      "Costa KOUROS",
      "Chris LAVERTY",
      "Francine BALESTRIERI",
      "Nik WEST",
      "Shane MINORS",
    ].includes(contact.lastname)
  );

  // Manager Approvers based on selected business unit
  const managerApprovers = (() => {
    switch (selectedBusinessUnit) {
      case "IT":
        return contacts.filter(
          (contact) => contact.lastname === "Shaun STANYER"
        );
      case "Food Services":
        return contacts.filter((contact) =>
          ["Anne STEER", "Navdeep KAUR"].includes(contact.lastname)
        );
      case "Specialty":
        return contacts.filter(
          (contact) => contact.lastname === "Voula DIMOPOULOS"
        );
      case "Travel Essentials":
        return contacts.filter((contact) => contact.lastname === "Sean THOMAS");
      case "Duty Free":
        return contacts.filter((contact) =>
          ["FwuWren LOH", "Vanita NAND"].includes(contact.lastname)
        );
      case "Finance":
        return contacts.filter((contact) =>
          ["Alfonso LOPEZ", "Tom RYAN"].includes(contact.lastname)
        );
      default:
        return [];
    }
  })();

  const renderSelect = (
    id: string,
    label: string,
    options: Approver[],
    selectedValue: string,
    field: keyof ApproversMatrixDropdownsProps["formData"]
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}:</Label>
      <Select
        value={selectedValue}
        onValueChange={(value) => onApproverChange(field, value)}
        disabled={isLoading}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.length > 0 ? (
            options.map((contact) => (
              <SelectItem key={contact.email} value={contact.email}>
                {`${contact.lastname}${
                  contact.jobtitle ? ` - ${contact.jobtitle}` : ""
                } (${contact.email})`}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-approvers-found" disabled>
              No approvers found
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border p-4 rounded-md bg-slate-50">
        <h3 className="font-medium text-lg mb-4">Procurement Approvers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSelect(
            "approver0",
            "Procurement Approver",
            procurementApprovers,
            formData.approver0,
            "approver0"
          )}
          {renderSelect(
            "approver0backup",
            "Procurement Approver 2",
            procurementApprovers,
            formData.approver0backup,
            "approver0backup"
          )}
        </div>
      </div>

      <div className="border p-4 rounded-md bg-slate-50">
        <h3 className="font-medium text-lg mb-4">Manager Approvers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSelect(
            "approver1",
            "Manager Approver",
            managerApprovers,
            formData.approver1,
            "approver1"
          )}
          {renderSelect(
            "approver1backup",
            "Manager Approver 2",
            managerApprovers,
            formData.approver1backup,
            "approver1backup"
          )}
        </div>
      </div>

      <div className="border p-4 rounded-md bg-slate-50">
        <h3 className="font-medium text-lg mb-4">
          CFO Approvers (for payment terms set to 20 EOM)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSelect(
            "approver2",
            "CFO Approver",
            cfoApprovers,
            formData.approver2,
            "approver2"
          )}
          {renderSelect(
            "approver2backup",
            "CFO Approver Replacement",
            cfoApprovers,
            formData.approver2backup,
            "approver2backup"
          )}
        </div>
      </div>

      <div className="border p-4 rounded-md bg-slate-50">
        <h3 className="font-medium text-lg mb-4">Exco Member Approvers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSelect(
            "approver3",
            "Exco Member Approver",
            excoApprovers,
            formData.approver3,
            "approver3"
          )}
          {renderSelect(
            "approver3backup",
            "Exco Member Approver 2",
            excoApprovers,
            formData.approver3backup,
            "approver3backup"
          )}
        </div>
      </div>
    </div>
  );
};

const ApproversMatrix: React.FC = () => {
  const { data: session, status } = useSession();

  // State variables
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [businessUnits, setBusinessUnits] = useState<string[]>([
    "Travel Essentials",
    "Food Services",
    "Specialty",
    "Duty Free",
    "Finance",
    "IT",
  ]);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("");
  const [contacts, setContacts] = useState<Approver[]>([]);
  const [matrixData, setMatrixData] = useState<ApproverMatrix[]>([]);
  const [formData, setFormData] = useState({
    businessUnit: "",
    approver0: "",
    approver0backup: "",
    approver1: "",
    approver1backup: "",
    approver2: "",
    approver2backup: "",
    approver3: "",
    approver3backup: "",
  });

  // Fetch contacts and matrix data on component mount
  useEffect(() => {
    if (session?.accessToken) {
      fetchAllData();
    }
  }, [session?.accessToken]);

  // Fetch data directly from Fabric Warehouse
  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
      const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
      const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

      // Fetch contacts data
      let contactsData: Approver[] = [];
      try {
        const contactsQuery = {
          query: `
            query {
              contacts(first: 500) {
                items {
                  contactid
                  emailaddress1
                  firstname
                  lastname
                  jobtitle
                }
              }
            }
          `,
        };

        const contactsResponse = await axios.post(
          graphqlEndpoint,
          contactsQuery,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (contactsResponse?.data?.data?.contacts?.items) {
          contactsData = contactsResponse.data.data.contacts.items
            .filter(
              (contact: any) =>
                contact.emailaddress1 &&
                contact.lastname &&
                !contact.emailaddress1.includes("test") &&
                !contact.emailaddress1.includes("sample")
            )
            .map((contact: any) => ({
              id: contact.contactid,
              email: contact.emailaddress1,
              name: `${contact.firstname || ""} ${
                contact.lastname || ""
              }`.trim(),
              lastname: contact.lastname,
              jobtitle: contact.jobtitle,
            }));
        }
        console.log("Fetched contacts:", contactsData.length);
      } catch (contactError) {
        console.error("Error fetching contacts from Fabric:", contactError);
        setError("Failed to fetch contacts. Please try again later.");
      }

      setContacts(contactsData);

      // Fetch approvers matrix data
      let matrixData: ApproverMatrix[] = [];
      try {
        const matrixQuery = {
          query: `
            query {
              approvers_matrix(first: 100) {
                items {
                  id
                  BusinessUnit
                  Approver0
                  Approver1
                  Approver2
                  Approver3
                  CreatedOn
                }
              }
            }
          `,
        };

        const matrixResponse = await axios.post(graphqlEndpoint, matrixQuery, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (matrixResponse?.data?.data?.approvers_matrix?.items) {
          matrixData = matrixResponse.data.data.approvers_matrix.items.map(
            (item: any) => {
              const approver0Contact = contactsData.find(
                (contact) => contact.email === item.Approver0
              );
              const approver1Contact = contactsData.find(
                (contact) => contact.email === item.Approver1
              );
              const approver2Contact = contactsData.find(
                (contact) => contact.email === item.Approver2
              );
              const approver3Contact = contactsData.find(
                (contact) => contact.email === item.Approver3
              );

              return {
                id: item.id,
                businessUnit: item.BusinessUnit,
                approver0: item.Approver0 || "",
                approver0_name: approver0Contact?.name || "",
                approver1: item.Approver1 || "",
                approver1_name: approver1Contact?.name || "",
                approver2: item.Approver2 || "",
                approver2_name: approver2Contact?.name || "",
                approver3: item.Approver3 || "",
                approver3_name: approver3Contact?.name || "",
                createdOn: item.CreatedOn,
              };
            }
          );
        }
        console.log("Fetched matrix data:", matrixData.length);
      } catch (matrixError) {
        console.error(
          "Error fetching approvers matrix from Fabric:",
          matrixError
        );
        setError("Failed to fetch approvers matrix. Please try again later.");
      }

      setMatrixData(matrixData);
    } catch (error) {
      console.error("Critical error in data fetching:", error);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle business unit selection
  const handleBusinessUnitChange = (value: string) => {
    setSelectedBusinessUnit(value);
    const existingMatrix = matrixData.find(
      (matrix) => matrix.businessUnit === value
    );

    if (existingMatrix) {
      setFormData({
        businessUnit: value,
        approver0: existingMatrix.approver0 || "",
        approver0backup: "", // These backup fields aren't in the matrix data yet
        approver1: existingMatrix.approver1 || "",
        approver1backup: "",
        approver2: existingMatrix.approver2 || "",
        approver2backup: "",
        approver3: existingMatrix.approver3 || "",
        approver3backup: "",
      });
    } else {
      setFormData({
        businessUnit: value,
        approver0: "",
        approver0backup: "",
        approver1: "",
        approver1backup: "",
        approver2: "",
        approver2backup: "",
        approver3: "",
        approver3backup: "",
      });
    }
  };

  // Handle approver selection changes
  const handleApproverChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.businessUnit) {
      alert("Please select a business unit");
      return false;
    }

    // At least one approver must be selected
    const hasApprovers =
      formData.approver0 ||
      formData.approver1 ||
      formData.approver2 ||
      formData.approver3;

    if (!hasApprovers) {
      alert("Please select at least one approver");
      return false;
    }

    return true;
  };

  // Confirm submission
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);
    setError(null);

    try {
      const existingMatrix = matrixData.find(
        (matrix) => matrix.businessUnit === formData.businessUnit
      );
      const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
      const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
      const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

      if (existingMatrix) {
        // Update existing matrix
        const updateMutation = {
          query: `
            mutation {
              updateapprovers_matrix(
                id: "${existingMatrix.id}",
                item: {
                  BusinessUnit: "${formData.businessUnit}"
                  ${
                    formData.approver0
                      ? `Approver0: "${formData.approver0}"`
                      : ""
                  }
                  ${
                    formData.approver0backup
                      ? `Approver0backup: "${formData.approver0backup}"`
                      : ""
                  }
                  ${
                    formData.approver1
                      ? `Approver1: "${formData.approver1}"`
                      : ""
                  }
                  ${
                    formData.approver1backup
                      ? `Approver1backup: "${formData.approver1backup}"`
                      : ""
                  }
                  ${
                    formData.approver2
                      ? `Approver2: "${formData.approver2}"`
                      : ""
                  }
                  ${
                    formData.approver2backup
                      ? `Approver2backup: "${formData.approver2backup}"`
                      : ""
                  }
                  ${
                    formData.approver3
                      ? `Approver3: "${formData.approver3}"`
                      : ""
                  }
                  ${
                    formData.approver3backup
                      ? `Approver3backup: "${formData.approver3backup}"`
                      : ""
                  }
                }
              ) {
                result
              }
            }
          `,
        };

        const updateResponse = await axios.post(
          graphqlEndpoint,
          updateMutation,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Update response:", updateResponse.data);

        // Check for GraphQL errors
        if (updateResponse.data.errors) {
          throw new Error(
            `GraphQL error: ${JSON.stringify(updateResponse.data.errors)}`
          );
        }
      } else {
        // Create new matrix
        const createMutation = {
          query: `
            mutation {
              createapprovers_matrix(
                item: {
                  BusinessUnit: "${formData.businessUnit}"
                  ${
                    formData.approver0
                      ? `Approver0: "${formData.approver0}"`
                      : ""
                  }
                  ${
                    formData.approver0backup
                      ? `Approver0backup: "${formData.approver0backup}"`
                      : ""
                  }
                  ${
                    formData.approver1
                      ? `Approver1: "${formData.approver1}"`
                      : ""
                  }
                  ${
                    formData.approver1backup
                      ? `Approver1backup: "${formData.approver1backup}"`
                      : ""
                  }
                  ${
                    formData.approver2
                      ? `Approver2: "${formData.approver2}"`
                      : ""
                  }
                  ${
                    formData.approver2backup
                      ? `Approver2backup: "${formData.approver2backup}"`
                      : ""
                  }
                  ${
                    formData.approver3
                      ? `Approver3: "${formData.approver3}"`
                      : ""
                  }
                  ${
                    formData.approver3backup
                      ? `Approver3backup: "${formData.approver3backup}"`
                      : ""
                  }
                  CreatedOn: "${new Date().toISOString()}"
                }
              ) {
                result
              }
            }
          `,
        };

        const createResponse = await axios.post(
          graphqlEndpoint,
          createMutation,
          {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Create response:", createResponse.data);

        // Check for GraphQL errors
        if (createResponse.data.errors) {
          throw new Error(
            `GraphQL error: ${JSON.stringify(createResponse.data.errors)}`
          );
        }
      }

      setShowSuccess(true);
      await fetchAllData();
    } catch (error) {
      console.error("Error submitting approvers matrix to Fabric:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to save approvers matrix: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-2xl">Approvers Matrix</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Unit Selection */}
            <div className="mb-6">
              <Label
                htmlFor="businessUnit"
                className="text-lg font-medium block mb-2"
              >
                Business Unit:
              </Label>
              <Select
                value={formData.businessUnit}
                onValueChange={handleBusinessUnitChange}
                disabled={isSubmitting}
              >
                <SelectTrigger id="businessUnit" className="w-full max-w-md">
                  <SelectValue placeholder="Select Business Unit" />
                </SelectTrigger>
                <SelectContent>
                  {businessUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Always show approvers dropdowns */}
            <ApproversMatrixDropdowns
              contacts={contacts}
              selectedBusinessUnit={selectedBusinessUnit}
              formData={formData}
              onApproverChange={handleApproverChange}
              isLoading={isSubmitting}
            />

            {/* Submit Button - Centered */}
            <div className="flex justify-center mt-6">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-lg font-semibold py-3 px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                    Saving...
                  </>
                ) : (
                  "Save Approvers"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h2 className="text-xl font-semibold mb-4">
                Confirm Approvers Matrix
              </h2>
              <p className="mb-4">
                Are you sure you want to save these approvers for{" "}
                <span className="font-medium">{formData.businessUnit}</span>?
              </p>
              <div className="flex justify-end gap-4">
                <Button
                  onClick={handleConfirmSubmit}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  Yes, Save
                </Button>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Success!</h2>
              <p className="mb-6">
                The approvers matrix has been successfully saved.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowSuccess(false)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-8 rounded-md shadow-sm transition-all hover:shadow-md"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApproversMatrix;
