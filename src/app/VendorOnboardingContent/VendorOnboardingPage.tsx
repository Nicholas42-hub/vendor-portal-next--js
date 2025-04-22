"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import VendorOnboardingContent from "@/app/VendorOnboardingContent/VendorOnboardingContent";
import axios from "axios";
const VendorOnboardingPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Global CSS injection
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
      .filter-wrapper {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;  // Changed from center to flex-start
        gap: 10px;
        margin-bottom: 20px;
        max-width: 1800px;  // Match container width
        margin-left: auto;
        margin-right: auto;
        padding: 0 1rem;
      }
      .status-filter {
        padding: 10px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        background-color: #f0f0f0;
        color: #333;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .status-filter:hover {
        background-color: #e0e0e0;
      }
      .status-filter.active {
        background-color: #1976D2;
        color: white;
      }
      .status-filter .label {
        font-weight: bold;
      }
      .status-filter .count {
        margin-top: 5px;
        font-size: 12px;
      }
      #all { 
        border-bottom: 4px solid #1976D2;
      }
      #pending-manager-approval { border-bottom: 4px solid #2196F3; }
      #pending-exco-approval { border-bottom: 4px solid #9C27B0; }
      #pending-cfo-approval { border-bottom: 4px solid #FF5722; }
      #completed { border-bottom: 4px solid #4CAF50; }
      #declined { border-bottom: 4px solid #F44336; }
      #invitation-sent { border-bottom: 4px solid #FFC107; }
      .create-button {
        background-color: #1976D2 !important;
        color: white !important;
        border: none;
        padding: 15px;
        cursor: pointer;
        font-size: 14px;
      }
      .create-button:hover {
        background-color: #1565C0 !important;
      }
    `;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Load data when session is available
  useEffect(() => {
    if (session?.accessToken) {
      const loadData = async () => {
        try {
          setIsLoading(true);
          setConnectionError(null);

          // Validate the connection using non-null assertion for accessToken
          if (session?.accessToken) {
            try {
              setIsLoading(true);

              const vendorResult = await axios.get(
                "/api/vendoronboardingcontent"
              );
              if (vendorResult.data?.success) {
                console.log("Vendor data loaded successfully");
                setDataLoaded(true);
              } else {
                console.error(
                  "Failed to load vendor data:",
                  vendorResult.data?.message
                );
                setConnectionError(
                  vendorResult.data?.message || "Failed to load vendor data"
                );
              }
            } catch (error) {
              console.error("Error loading vendor data:", error);
              setConnectionError(
                error instanceof Error
                  ? error.message
                  : "An unknown error occurred"
              );
            } finally {
              setIsLoading(false);
            }
          }
        } catch (error) {
          console.error("Error loading vendor data:", error);
          setConnectionError(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    } else if (status !== "loading") {
      setIsLoading(false);
    }
  }, [session, status]);

  // Show loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  // Handle unauthenticated users
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 100 2 1 1 0 000-2zm.75-6a.75.75 0 00-1.5 0v2.75a.75.75 0 001.5 0V7z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You must be signed in to access the vendor portal.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => (window.location.href = "/api/auth/signin")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Render the vendor onboarding content when data is loaded
  return (
    <div className="relative min-h-screen">
      {/* Background image with transparency */}
      <div
        className="absolute inset-0 z-0 w-full h-full"
        style={{
          backgroundImage: "url(/images/LtrAWPL.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.2,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-[1400px] mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {connectionError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{connectionError}</p>
                <p className="text-sm text-red-700 mt-2">
                  Using sample data instead. Please try refreshing the page or
                  contact support if the issue persists.
                </p>
              </div>
            </div>
          </div>
        )}

        <VendorOnboardingContent />
      </div>
    </div>
  );
};

export default VendorOnboardingPage;
