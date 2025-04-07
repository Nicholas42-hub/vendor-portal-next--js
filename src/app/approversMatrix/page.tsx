// src/app/approvers-matrix/page.tsx
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Navigation from "@/components/layout/Navigation";
import ApproversMatrix from "./approversMatrix";

// Server component
export default async function ApproversMatrixPage() {
  // Check if user is authenticated on the server
  const session = await getServerSession(authOptions);

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

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Approvers Matrix Configuration
          </h1>
          <p className="text-gray-600 mb-8">
            Configure approvers for each business unit in the vendor approval
            workflow. Each business unit requires a Manager, CFO, and Executive
            approver.
          </p>

          <Suspense
            fallback={
              <div className="flex justify-center items-center min-h-screen">
                Loading...
              </div>
            }
          >
            <ApproversMatrix />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
