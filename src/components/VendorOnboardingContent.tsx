"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { queryBusinessData } from "@/utils/graphQL-api-Get";

interface VendorOnboardingContentProps {
  // Add any props the component needs
}

interface StatusFilterProps {
  id: string;
  dataStatus: string;
  label: string;
  count: number;
  isActive: boolean;
  onClick: (status: string) => void;
}

interface VendorData {
  crb7c_accountcontact: string;
  crb7c_poemail: string;
  crb7c_businessname: string;
  createdon: string;
  adx_createdbyusername: string;
  createdon_formatted: string;
  statecodename: string;
  originalStatus: string;
}

const StatusFilter: React.FC<StatusFilterProps> = ({
  id,
  dataStatus,
  label,
  count,
  isActive,
  onClick,
}) => {
  return (
    <button
      id={id}
      data-status={dataStatus}
      className={`status-filter ${isActive ? "active" : ""}`}
      onClick={() => onClick(dataStatus)}
    >
      <div className="label">{label}</div>
      <div className="count">{count}</div>
    </button>
  );
};

const VendorOnboardingContent: React.FC<VendorOnboardingContentProps> = () => {
  const { data: session } = useSession();
  const [tableData, setTableData] = useState<VendorData[]>([]);
  const [filteredData, setFilteredData] = useState<VendorData[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    all: 0,
    "Invitation sent": 0,
    "Pending Manager Approval": 0,
    "Pending Exco Approval": 0,
    "Pending CFO Approval": 0,
    "Creation approved": 0,
    Declined: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (session?.accessToken) {
        try {
          setIsLoading(true);
          // For demo purposes, use dummy data
          // In production, uncomment the API call and comment out the dummy data

          // const result = await queryBusinessData(session.accessToken);
          // if (result.success && result.data) {
          //   const vendors = result.data.vendors || [];
          //   setTableData(vendors);
          //   updateCounts(vendors);
          //   filterData(vendors, currentFilter, searchTerm);
          // }

          // Dummy data for development
          const dummyData: VendorData[] = [
            {
              crb7c_accountcontact: "1",
              crb7c_poemail: "vendor1@example.com",
              crb7c_businessname: "Acme Supplies",
              createdon: "2025-03-01",
              adx_createdbyusername: "John Doe",
              createdon_formatted: "Mar 1, 2025",
              statecodename: "Invitation sent",
              originalStatus: "Invitation sent",
            },
            {
              crb7c_accountcontact: "2",
              crb7c_poemail: "vendor2@example.com",
              crb7c_businessname: "Global Foods",
              createdon: "2025-03-05",
              adx_createdbyusername: "Jane Smith",
              createdon_formatted: "Mar 5, 2025",
              statecodename: "Pending Manager Approval",
              originalStatus: "Pending Manager Approval",
            },
            {
              crb7c_accountcontact: "3",
              crb7c_poemail: "vendor3@example.com",
              crb7c_businessname: "Tech Solutions",
              createdon: "2025-03-10",
              adx_createdbyusername: "Alice Johnson",
              createdon_formatted: "Mar 10, 2025",
              statecodename: "Creation approved",
              originalStatus: "Creation approved",
            },
          ];

          setTableData(dummyData);
          updateCounts(dummyData);
          filterData(dummyData, currentFilter, searchTerm);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [session, session?.accessToken]);

  // Filter data based on current filter and search term
  const filterData = (data: VendorData[], filter: string, search: string) => {
    const filtered = data.filter((row) => {
      const matchesFilter = filter === "all" || row.originalStatus === filter;
      const businessName = row.crb7c_businessname
        ? row.crb7c_businessname.toLowerCase()
        : "";
      const matchesSearch = businessName.includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    setFilteredData(filtered);
  };

  // Update the counts for each status
  const updateCounts = (data: VendorData[]) => {
    const counts = {
      all: data.length,
      "Invitation sent": 0,
      "Pending Manager Approval": 0,
      "Pending Exco Approval": 0,
      "Pending CFO Approval": 0,
      "Creation approved": 0,
      Declined: 0,
    };

    data.forEach((row) => {
      if (row.statecodename in counts) {
        counts[row.statecodename as keyof typeof counts]++;
      }
    });

    setStatusCounts(counts);
  };

  // Handle filter change
  const handleFilterChange = (status: string) => {
    setCurrentFilter(status);
    filterData(tableData, status, searchTerm);
  };

  // Handle search
  const handleSearch = () => {
    filterData(tableData, currentFilter, searchTerm);
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle row click to navigate to vendor details
  const handleRowClick = (email: string) => {
    window.location.href = `https://lagardereawpl-vendorportal.powerappsportals.com/Vendor-Onboarding/vendorapprovalflow/?email=${encodeURIComponent(
      email
    )}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="filter-wrapper">
          {/* All Status Filter */}
          <StatusFilter
            id="all"
            dataStatus="all"
            label="All"
            count={statusCounts.all}
            isActive={currentFilter === "all"}
            onClick={handleFilterChange}
          />

          {/* Invitation Sent Filter */}
          <StatusFilter
            id="invitation-sent"
            dataStatus="Invitation sent"
            label="Invitation sent"
            count={statusCounts["Invitation sent"]}
            isActive={currentFilter === "Invitation sent"}
            onClick={handleFilterChange}
          />

          {/* Pending Manager Approval Filter */}
          <StatusFilter
            id="pending-manager-approval"
            dataStatus="Pending Manager Approval"
            label="Pending Manager Approval"
            count={statusCounts["Pending Manager Approval"]}
            isActive={currentFilter === "Pending Manager Approval"}
            onClick={handleFilterChange}
          />

          {/* Pending Exco Approval Filter */}
          <StatusFilter
            id="pending-exco-approval"
            dataStatus="Pending Exco Approval"
            label="Pending Exco Approval"
            count={statusCounts["Pending Exco Approval"]}
            isActive={currentFilter === "Pending Exco Approval"}
            onClick={handleFilterChange}
          />

          {/* Pending CFO Approval Filter */}
          <StatusFilter
            id="pending-cfo-approval"
            dataStatus="Pending CFO Approval"
            label="Pending CFO Approval"
            count={statusCounts["Pending CFO Approval"]}
            isActive={currentFilter === "Pending CFO Approval"}
            onClick={handleFilterChange}
          />

          {/* Creation Approved Filter */}
          <StatusFilter
            id="completed"
            dataStatus="Creation approved"
            label="Creation approved"
            count={statusCounts["Creation approved"]}
            isActive={currentFilter === "Creation approved"}
            onClick={handleFilterChange}
          />

          {/* Declined Filter */}
          <StatusFilter
            id="declined"
            dataStatus="Declined"
            label="Declined"
            count={statusCounts["Declined"]}
            isActive={currentFilter === "Declined"}
            onClick={handleFilterChange}
          />

          {/* Vendor Onboarding Form Button */}
          <Button
            id="vendor-onboarding"
            onClick={() =>
              (window.location.href =
                "https://lagardereawpl-vendorportal.powerappsportals.com/Vendor-Onboarding/vendoronboardingform/")
            }
            className="status-filter create-button"
          >
            <div className="label">Create a Vendor Onboarding Form</div>
          </Button>
        </div>

        <div className="search-container flex justify-center mb-8">
          <Input
            type="text"
            id="searchInput"
            placeholder="Search for Business Name"
            value={searchTerm}
            onChange={handleSearchInputChange}
            onKeyPress={handleKeyPress}
            className="w-64 rounded-l-md rounded-r-none border-r-0"
          />
          <Button
            type="button"
            id="searchButton"
            onClick={handleSearch}
            className="rounded-l-none rounded-r-md bg-blue-600 hover:bg-blue-700"
          >
            Search
          </Button>
        </div>

        <div id="POContainer" className="POContainer mt-8">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <table
              id="crmDataTable"
              className="w-full border border-gray-200 rounded-lg overflow-hidden"
            >
              <thead>
                <tr className="cursor-pointer">
                  <th className="p-3 text-left bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b-2 border-gray-200">
                    Business Name
                  </th>
                  <th className="p-3 text-left bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b-2 border-gray-200">
                    Email
                  </th>
                  <th className="p-3 text-left bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b-2 border-gray-200">
                    Created By
                  </th>
                  <th className="p-3 text-left bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b-2 border-gray-200">
                    Created On
                  </th>
                  <th className="p-3 text-left bg-gray-50 text-gray-700 font-bold uppercase text-xs border-b-2 border-gray-200">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody id="crmDataTableBody">
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr
                      key={row.crb7c_accountcontact}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(row.crb7c_poemail)}
                    >
                      <td className="p-3 text-sm">{row.crb7c_businessname}</td>
                      <td className="p-3 text-sm">{row.crb7c_poemail}</td>
                      <td className="p-3 text-sm">
                        {row.adx_createdbyusername}
                      </td>
                      <td className="p-3 text-sm">{row.createdon_formatted}</td>
                      <td className="p-3 text-sm">{row.statecodename}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorOnboardingContent; // for default export
