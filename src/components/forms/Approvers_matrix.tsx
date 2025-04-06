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
  approver1: string;
  approver1_name: string;
  approver2: string;
  approver2_name: string;
  approver3: string;
  approver3_name: string;
  createdOn: string;
}

// GraphQL interfaces matching the Fabric Warehouse schema
interface FabricApproverMatrix {
  id: string;
  BusinessUnit: string;
  Approver1: string;
  Approver2: string;
  Approver3: string;
  CreatedOn: string;
}

/**
 * ApproversMatrixDropdowns is a child component that renders dropdowns
 * for Manager, CFO, and Exco approvers based on filtering logic.
 */
interface ApproversMatrixDropdownsProps {
  contacts: Approver[];
  selectedBusinessUnit: string;
  formData: {
    approver1: string;
    approver2: string;
    approver3: string;
  };
  onApproverChange: (
    field: "approver1" | "approver2" | "approver3",
    value: string
  ) => void;
}

const ApproversMatrixDropdowns: React.FC<ApproversMatrixDropdownsProps> = ({
  contacts,
  selectedBusinessUnit,
  formData,
  onApproverChange,
}) => {
  // Filter contacts based on roles
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
    field: "approver1" | "approver2" | "approver3"
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}:</Label>
      <Select
        value={selectedValue}
        onValueChange={(value) => onApproverChange(field, value)}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((contact) => (
            <SelectItem key={contact.email} value={contact.email}>
              {`${contact.lastname} - ${contact.jobtitle} (${contact.email})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      {renderSelect(
        "approver1",
        "Manager Approver",
        managerApprovers,
        formData.approver1,
        "approver1"
      )}
      {renderSelect(
        "approver2",
        "CFO Approver",
        cfoApprovers,
        formData.approver2,
        "approver2"
      )}
      {renderSelect(
        "approver3",
        "Exco Approver",
        excoApprovers,
        formData.approver3,
        "approver3"
      )}
    </div>
  );
};

const ApproversMatrix: React.FC = () => {
  const { data: session } = useSession();

  // State variables
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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
  const [formData, setFormData] = useState<{
    businessUnit: string;
    approver1: string;
    approver2: string;
    approver3: string;
  }>({
    businessUnit: "",
    approver1: "",
    approver2: "",
    approver3: "",
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
              contacts(first: 100) {
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
          contactsData = contactsResponse.data.data.contacts.items.map(
            (contact: any) => ({
              id: contact.contactid,
              email: contact.emailaddress1,
              name: `${contact.firstname || ""} ${
                contact.lastname || ""
              }`.trim(),
              lastname: contact.lastname,
              jobtitle: contact.jobtitle,
            })
          );
        }
      } catch (contactError) {
        console.error("Error fetching contacts from Fabric:", contactError);
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
                approver1: item.Approver1,
                approver1_name: approver1Contact?.name || "",
                approver2: item.Approver2,
                approver2_name: approver2Contact?.name || "",
                approver3: item.Approver3,
                approver3_name: approver3Contact?.name || "",
                createdOn: item.CreatedOn,
              };
            }
          );
        }
      } catch (matrixError) {
        console.error(
          "Error fetching approvers matrix from Fabric:",
          matrixError
        );
      }

      setMatrixData(matrixData);
    } catch (error) {
      console.error("Critical error in data fetching:", error);
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
        approver1: existingMatrix.approver1,
        approver2: existingMatrix.approver2,
        approver3: existingMatrix.approver3,
      });
    } else {
      setFormData({
        businessUnit: value,
        approver1: "",
        approver2: "",
        approver3: "",
      });
    }
  };

  // Handle approver selection changes
  const handleApproverChange = (
    field: "approver1" | "approver2" | "approver3",
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
    if (!formData.approver1) {
      alert("Manager Approver is required");
      return false;
    }
    if (!formData.approver2) {
      alert("CFO Approver is required");
      return false;
    }
    if (!formData.approver3) {
      alert("Exco Approver is required");
      return false;
    }
    return true;
  };

  // Confirm submission
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      const existingMatrix = matrixData.find(
        (matrix) => matrix.businessUnit === formData.businessUnit
      );
      const workspaceId = process.env.NEXT_PUBLIC_FABRIC_WORKSPACE_ID;
      const graphqlId = process.env.NEXT_PUBLIC_GRAPHQL_ID;
      const graphqlEndpoint = `https://${workspaceId}.zaa.graphql.fabric.microsoft.com/v1/workspaces/${workspaceId}/graphqlapis/${graphqlId}/graphql`;

      if (existingMatrix) {
        const updateMutation = {
          query: `
            mutation {
              updateapprovers_matrix(
                id: "${existingMatrix.id}",
                item: {
                  BusinessUnit: "${formData.businessUnit}",
                  Approver1: "${formData.approver1}",
                  Approver2: "${formData.approver2}",
                  Approver3: "${formData.approver3}"
                }
              ) {
                id
                BusinessUnit
                Approver1
                Approver2
                Approver3
              }
            }
          `,
        };

        await axios.post(graphqlEndpoint, updateMutation, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        const createMutation = {
          query: `
            mutation {
              createapprovers_matrix(
                item: {
                  BusinessUnit: "${formData.businessUnit}",
                  Approver1: "${formData.approver1}",
                  Approver2: "${formData.approver2}",
                  Approver3: "${formData.approver3}",
                  CreatedOn: "${new Date().toISOString()}"
                }
              ) {
                id
                BusinessUnit
                Approver1
                Approver2
                Approver3
                CreatedOn
              }
            }
          `,
        };

        await axios.post(graphqlEndpoint, createMutation, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
        });
      }

      setShowSuccess(true);
      await fetchAllData();
    } catch (error) {
      console.error("Error submitting approvers matrix to Fabric:", error);
      alert("Failed to save approvers matrix. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate user display name
  const getUserDisplayName = (contact: Approver) => {
    if (contact.name && contact.jobtitle && contact.email) {
      return `${contact.name} - ${contact.jobtitle} (${contact.email})`;
    }
    if (contact.name && contact.email) {
      return `${contact.name} (${contact.email})`;
    }
    return contact.email;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Approvers Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Unit Selection */}
            <div className="space-y-2">
              <Label htmlFor="businessUnit">Business Unit:</Label>
              <Select
                value={formData.businessUnit}
                onValueChange={(value) => handleBusinessUnitChange(value)}
              >
                <SelectTrigger id="businessUnit">
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

            {/* Dropdowns for Approvers */}
            <ApproversMatrixDropdowns
              contacts={contacts}
              selectedBusinessUnit={selectedBusinessUnit}
              formData={formData}
              onApproverChange={handleApproverChange}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
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
          </form>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">
                Confirm Approvers Matrix
              </h2>
              <p className="mb-4">
                Are you sure you want to save these approvers for{" "}
                {formData.businessUnit}?
              </p>
              <div className="flex justify-between gap-4">
                <Button
                  onClick={handleConfirmSubmit}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  Yes
                </Button>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  No
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Success!</h2>
              <p className="mb-4">
                The approvers matrix has been successfully saved.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowSuccess(false)}
                  className="bg-green-600 hover:bg-green-700"
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
