"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCart } from "../../CartContext";

type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  price: string;
  category: string;
};

type Store = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  products: StoreProduct[];
};

export default function StorePage() {
  const params = useParams();
  const storeName = decodeURIComponent(params.storeName as string);

  const { addToCart } = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [addedProduct, setAddedProduct] = useState("");

  useEffect(() => {
    async function loadStore() {
      try {
        const response = await fetch(
          `/api/stores/${encodeURIComponent(storeName)}`
        );

        if (!response.ok) {
          setNotFound(true);
          return;
        }

        const data = await response.json();
        setStore(data);
      } catch (error) {
        console.error("Could not load store:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadStore();
  }, [storeName]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">Loading store...</p>
        </div>
      </main>
    );
  }

  if (notFound || !store) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Store Not Found
          </h1>

          <p className="mt-3 text-gray-500">
            We couldn't find the store you're looking for.
          </p>

          <a
            href="/products"
            className="mt-6 inline-block rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Back to Products
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-blue-700 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">{store.name}</h1>

          <p className="mt-2 text-blue-100">
            {store.description ||
              `Welcome to ${store.name} on AfricaMarket.`}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Store Products
        </h2>

        {store.products.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">
              No products found for this store.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {store.products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200"
              >
                <div className="flex h-48 items-center justify-center bg-gray-100 text-gray-400">
                  Product Image
                </div>

                <div className="p-5">
                  <p className="text-sm text-gray-500">
                    {product.category}
                  </p>

                  <a
                    href={`/products/${encodeURIComponent(product.slug)}`}
                    className="mt-1 block text-xl font-semibold text-gray-900 hover:text-blue-700 hover:underline"
                  >
                    {product.name}
                  </a>

                  <p className="mt-3 text-lg font-bold text-blue-700">
                    {product.price}
                  </p>

                  <button
                    onClick={() => {
                      addToCart(product.name);
                      setAddedProduct(product.name);
                    }}
                    className="mt-4 w-full rounded-lg bg-blue-700 py-2.5 font-semibold text-white hover:bg-blue-800"
                  >
                    Add to Cart
                  </button>

                  {addedProduct === product.name && (
                    <p className="mt-2 text-center text-sm font-semibold text-green-600">
                      ✓ Added to cart
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
