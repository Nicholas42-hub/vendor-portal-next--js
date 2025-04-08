import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import VendorApprovalFlow from "@/components/VendorApprovalFlow";
import Navigation from "@/components/layout/Navigation";

// Server component
export default async function VendorApprovalPage() {
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

        <main>
          <Suspense
            fallback={
              <div className="flex justify-center items-center min-h-screen">
                Loading...
              </div>
            }
          >
            <VendorApprovalFlow />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
