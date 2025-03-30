"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import VendorOnboardingPage from "@/components/VendorOnboardingPage";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

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

  // Handle sign out confirmation
  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleConfirmSignOut = () => {
    signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  const handleCancelSignOut = () => {
    setShowSignOutConfirm(false);
  };

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
        <header className="bg-[#f0f5fa] shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="flex-shrink-0 mr-4">
              <img
                src="/images/ltrawpllogo.png"
                alt="LTRAWPL Logo"
                width={150}
                height={60}
                className="object-contain"
              />
            </div>

            <div className="flex-grow flex justify-center">
              <h1 className="text-xl font-bold text-[#F01E73]">
                Vendor Portal
              </h1>
            </div>

            <div className="flex-shrink-0 flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={handleSignOutClick}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main>
          <VendorOnboardingPage />
        </main>
      </div>

      {/* Sign out confirmation dialog */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Sign out?
            </h3>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelSignOut}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                No
              </button>
              <button
                onClick={handleConfirmSignOut}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
