"use client";

import React from "react";
import { useSession } from "next-auth/react";
import VendorOnboardingForm from "@/components/forms/VendorOnboardingForm";
import { useRouter } from "next/navigation";

export default function CreateVendorOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Handle unauthenticated users
  if (status === "unauthenticated") {
    // Redirect to sign in page
    if (typeof window !== "undefined") {
      router.push("/auth/signin");
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
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
                You must be signed in to create a vendor onboarding form.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
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

        {/* Header and back button */}
        <div className="relative z-10 mb-6 flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-md hover:bg-gray-100"
          >
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
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Create Vendor Onboarding Form
          </h1>
        </div>

        {/* Form Container */}
        <div className="relative z-10 bg-white rounded-lg shadow-md p-6">
          <VendorOnboardingForm />
        </div>
      </div>
    </div>
  );
}
