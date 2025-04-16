import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface StatusFilterProps {
  id: string;
  dataStatus: string;
  label: string;
  count: number;
  isActive: boolean;
  onClick: (status: string) => void;
}

interface VendorData {
  crb7c_poemail: string;
  crb7c_businessname: string;
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

// Helper function to format date as yyyymmdd
const formatDateAsYYYYMMDD = (dateString: string): string => {
  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateString);
      return dateString; // Return original if invalid
    }

    const year = date.getFullYear();
    // Add leading zero if month or day is less than 10
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original on error
  }
};

const VendorOnboardingContent: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [tableData, setTableData] = useState<VendorData[]>([]);
  const [filteredData, setFilteredData] = useState<VendorData[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    all: 0,
    "Invitation Sent": 0,
    "Requester review": 0,
    "Pending Procurement Manager Approval": 0,
    "Pending Manager Approval": 0,
    "Pending Exco Approval": 0,
    "Pending CFO Approval": 0,
    "Creation approved": 0,
    Declined: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (session?.accessToken) {
        try {
          setIsLoading(true);
          setError(null);

          const result = await fetch("/api/vendoronboardingcontent");

          if (!result.ok) {
            throw new Error(
              `API returned ${result.status}: ${result.statusText}`
            );
          }

          const responseData = await result.json();

          if (!responseData.success) {
            throw new Error(responseData.message || "Failed to fetch data");
          }

          console.log("API Response:", responseData);

          // Check if data is available and is an array
          if (responseData.data && Array.isArray(responseData.data)) {
            // Format the date in each item to yyyymmdd
            const formattedData = responseData.data.map((item: VendorData) => ({
              ...item,
              createdon_formatted: formatDateAsYYYYMMDD(
                item.createdon_formatted
              ),
            }));

            setTableData(formattedData);
            setFilteredData(formattedData);
            updateCounts(formattedData);
          } else {
            console.warn("Response data is not an array:", responseData.data);
            setTableData([]);
            setFilteredData([]);
            updateCounts([]);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setError(error instanceof Error ? error.message : String(error));
          setTableData([]);
          setFilteredData([]);
          updateCounts([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [session, session?.accessToken]);

  // Navigate to the vendor onboarding form page
  const handleNavigateToForm = () => {
    router.push("/vendor-onboarding/onboardingform");
  };

  // Filter data based on current filter and search term
  const filterData = (data: VendorData[], filter: string, search: string) => {
    // Ensure data is an array before filtering
    if (!Array.isArray(data)) {
      console.warn("filterData received non-array data:", data);
      return;
    }

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
    // Ensure data is an array before processing
    if (!Array.isArray(data)) {
      console.warn("updateCounts received non-array data:", data);

      // Set default counts to 0
      setStatusCounts({
        all: 0,
        "Invitation Sent": 0,
        "Requester review": 0,
        "Pending Procurement Manager Approval": 0,
        "Pending Manager Approval": 0,
        "Pending Exco Approval": 0,
        "Pending CFO Approval": 0,
        "Creation approved": 0,
        Declined: 0,
      });
      return;
    }

    const counts = {
      all: data.length,
      "Invitation Sent": 0,
      "Requester review": 0,
      "Pending Procurement Manager Approval": 0,
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
    // Use Next.js router for navigation instead of direct URL
    router.push(`/vendor-approval?email=${encodeURIComponent(email)}`);
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
            id="invitation-Sent"
            dataStatus="Invitation Sent"
            label="Invitation Sent"
            count={statusCounts["Invitation Sent"]}
            isActive={currentFilter === "Invitation Sent"}
            onClick={handleFilterChange}
          />
          {/* Requester review Filter */}
          <StatusFilter
            id="Requester-review"
            dataStatus="Requester review"
            label="Requester review"
            count={statusCounts["Requester review"]}
            isActive={currentFilter === "Requester review"}
            onClick={handleFilterChange}
          />
          {/* Requester review Filter */}
          <StatusFilter
            id="pending-procurement-manager-approval"
            dataStatus="Pending Procurement Manager Approval"
            label="Pending Procurement Manager Approval"
            count={statusCounts["Pending Procurement Manager Approval"]}
            isActive={currentFilter === "Pending Procurement Manager Approval"}
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
            onClick={handleNavigateToForm}
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

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
                  filteredData.map((row, index) => (
                    <tr
                      key={`${row.crb7c_poemail}-${index}`}
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

export default VendorOnboardingContent;
