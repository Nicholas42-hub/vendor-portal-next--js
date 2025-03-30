import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import HomePage from './pages/HomePage';
import { Suspense } from 'react';

export default async function Page() {
  // You can do server-side authentication check here if needed
  const session = await getServerSession(authOptions);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  )};