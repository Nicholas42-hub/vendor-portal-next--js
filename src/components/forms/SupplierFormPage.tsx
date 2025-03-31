"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SupplierForm from "@/components/forms/SupplierForm";
import { Card } from "@/components/ui/card";

export default function SupplierFormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect unauthenticated users to sign-in page
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

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
      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Supplier Onboarding
          </h1>
          <p className="text-gray-600 mt-2">
            Please complete all fields in this form to setup your account as a
            supplier.
          </p>
        </div>

        <SupplierForm />
      </div>
    </div>
  );
}
