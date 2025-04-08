"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import VendorOnboardingPage from "@/app/pages/VendorOnboardingPage";
import Navigation from "@/components/layout/Navigation";

export default function HomePage() {
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

  // If not authenticated, redirect to home
  if (!session) {
    // This is a simple approach that will trigger an immediate redirect
    window.location.href = "/api/auth/signin";

    // Return a minimal loading indicator while the redirect happens
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
          opacity: 0.2, // 80% transparent (20% opacity)
        }}
      />

      {/* Main content container with z-index to appear above background */}
      <div className="relative z-10 min-h-screen">
        <Navigation />

        <main>
          <VendorOnboardingPage />
        </main>
      </div>
    </div>
  );
}
