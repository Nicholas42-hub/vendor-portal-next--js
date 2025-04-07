"use client";

import React, { useState, useEffect, useMemo } from "react";

// Define interface for a contact (as returned by the API)
interface Approver {
  contactid: string;
  crb7c_vendoremail: string;
  lastname: string;
  createdon: string;
  adx_createdbyusername: string;
  crb7c_statuscode: string;
}

const ApproversMatrix: React.FC = () => {
  // List of business units
  const businessUnits = [
    "Duty Free",
    "Food Services",
    "Specialty",
    "Travel Essentials",
    "Finance",
    "IT",
  ];

  // State for selected business unit, contacts, and loading indicator
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("");
  const [contacts, setContacts] = useState<Approver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch contacts from the API endpoint on mount
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        // Call the GET endpoint from your API (e.g., /api/user)
        const response = await fetch("/api/approvers-matrix");
        const result = await response.json();
        // Check if result contains contacts data; if not, warn and set contacts to an empty array
        if (
          result &&
          result.data &&
          result.data.contacts &&
          Array.isArray(result.data.contacts.items)
        ) {
          setContacts(result.data.contacts.items);
        } else {
          if (result && Object.keys(result).length === 0) {
            console.warn("No contacts data returned: empty result");
          } else {
            console.error("No contacts data returned", result);
          }
          setContacts([]);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Filter manager approvers based on the selected business unit
  const managerApprovers = useMemo(() => {
    if (!selectedBusinessUnit) return [];
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
  }, [selectedBusinessUnit, contacts]);

  return (
    <div>
      <div>
        <h1>Approvers Matrix</h1>
        <label htmlFor="businessUnit">Select Business Unit:</label>
        <select
          id="businessUnit"
          value={selectedBusinessUnit}
          onChange={(e) => setSelectedBusinessUnit(e.target.value)}
        >
          <option value="">Select Business Unit</option>
          {businessUnits.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h2>Manager Approvers</h2>
        {loading ? (
          <p>Loading contacts...</p>
        ) : (
          <select>
            <option value="">Select Manager Approver</option>
            {managerApprovers.length > 0 ? (
              managerApprovers.map((contact) => (
                <option
                  key={contact.contactid}
                  value={contact.crb7c_vendoremail}
                >
                  {contact.lastname} - {contact.crb7c_vendoremail}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No contacts available
              </option>
            )}
          </select>
        )}
      </div>
      {/* Additional sections for CFO and Exco Approvers can be added similarly */}
    </div>
  );
};

export default ApproversMatrix;
