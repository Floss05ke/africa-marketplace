"use client";

import { useParams } from "next/navigation";

export default function StorePage() {
  const params = useParams();
  const storeName = params.storeName as string;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            {storeName}
          </h1>

          <p className="mt-2 text-gray-600">
            Welcome to this store on AfricaMarket.
          </p>

          <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Store Products
            </h2>

            <p className="mt-2 text-gray-500">
              Products from this vendor will appear here.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
