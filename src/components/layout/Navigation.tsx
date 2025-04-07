"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);

  // Don't render navigation if user is not authenticated
  if (status !== "authenticated") return null;

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

  return (
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
          <h1 className="text-xl font-bold text-[#F01E73]">Vendor Portal</h1>
        </div>

        {/* Navigation Links */}
        <div className="flex-grow-0 mx-4">
          <nav className="flex space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === "/"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/approvers-matrix"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname.startsWith("/vendor-approval")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Vendor Approval Matrix
            </Link>
            {/* <Link
              href="/approversMatrix"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname.startsWith("/vendor-approval")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Vendor Approval Matrix
            </Link> */}
          </nav>
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

      {/* Sign out confirmation dialog */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Sign out?
            </h3>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancelSignOut}>
                No
              </Button>
              <Button
                onClick={handleConfirmSignOut}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
