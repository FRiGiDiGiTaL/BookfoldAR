// pages/app.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Head from "next/head";
import { TrialGuard } from "@/components/TrialGuard";

// Import the main App component from MainApp.tsx in the root directory
const MainApp = dynamic(() => import("../MainApp"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
        <p className="text-xl">Loading BookfoldAR...</p>
      </div>
    </div>
  ),
});

export default function AppPage() {
  return (
    <>
      <Head>
        <title>BookfoldAR App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <TrialGuard>
        <MainApp />
      </TrialGuard>
    </>
  );
}