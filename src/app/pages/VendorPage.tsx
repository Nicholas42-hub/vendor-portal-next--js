// src/app/pages/VendorPage.tsx
"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import VendorOnboardingPage from "@/app/VendorOnboardingContent/VendorOnboardingPage";

// This component will be the main entry point for the vendor onboarding page
export default function VendorPage() {
  const { data: session, status } = useSession();

  // Redirect unauthenticated users to sign-in page
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/auth/signin";
    }
  }, [status]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return <VendorOnboardingPage />;
}
