import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard immediately
    router.replace('/dashboard');
  }, [router]);

  return (
    <>
      <Head>
        <title>MerakiERP - Redirecting...</title>
        <meta name="description" content="Redirecting to dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang chuyển hướng đến dashboard...</p>
        </div>
      </main>
    </>
  );
}
