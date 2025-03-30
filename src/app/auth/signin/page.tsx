'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const error = searchParams?.get('error');

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn('azure-ad', { callbackUrl: '/' });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Background image with 80% transparency */}
      <div 
        className="absolute inset-0 z-0 w-full h-full" 
        style={{
          backgroundImage: 'url(/images/LtrAWPL.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8, // 80% transparent (20% opacity)
        }}
      />
      
      {/* Logo at top left corner */}
      <div className="absolute top-4 left-4 z-10">
        <Image 
          src="/images/ltrawpllogo.png"
          alt="LTRAWPL Logo"
          width={150}
          height={80}
          className="object-contain"
        />
      </div>
      
      {/* Sign-in form */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white opacity-80 backdrop-blur-sm rounded-lg shadow-md z-10 border border-white border-opacity-20">
        <div className="text-center">
          <h2 className="mt-6 text-xl font-bold text-gray-900">Welcome to the NRI Booking Portal</h2>
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error === 'CredentialsSignin'
              ? 'Invalid credentials'
              : 'An error occurred during sign in. Please try again.'}
          </div>
        )}
        
        <div className="pt-4">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="flex items-center justify-center w-full px-4 py-2 text-white bg-[#141E5D] rounded-md hover:bg-[#0e1540] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:-[#141E5D] cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 mr-3 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0H21V10H10V0Z" fill="#F25022" />
                <path d="M0 0H10V10H0V0Z" fill="#7FBA00" />
                <path d="M10 11H21V21H10V11Z" fill="#00A4EF" />
                <path d="M0 11H10V21H0V11Z" fill="#FFB900" />
              </svg>
            )}
            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </button>
        </div>
      </div>
    </div>
  );
}