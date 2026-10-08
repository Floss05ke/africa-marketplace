"use client";

import { use, useEffect, useState } from "react";
import { useCart } from "../../CartContext";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  store: string;
  storeSlug: string;
  category: string;
  description: string | null;
};

export default function ProductDetail({
  params,
}: {
  params: Promise<{ productName: string }>;
}) {
  const { productName } = use(params);
  const decodedProductName = decodeURIComponent(productName);
  const productSlug = decodedProductName.toLowerCase().replace(/\s+/g, "-");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProduct() {
      try {
        
        const response = await fetch(
          `/api/products/${encodeURIComponent(productSlug)}`
        );

        if (!response.ok) {
          setNotFound(true);
          return;
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Could not load product:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [decodedProductName]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">Loading product...</p>
        </div>
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Product Not Found
          </h1>

          <p className="mt-3 text-gray-500">
            We couldn't find the product you're looking for.
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
      <header className="bg-blue-700 px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AfricaMarket</h1>

            <p className="mt-1 text-sm text-blue-100">
              Product Details
            </p>
          </div>

          <a
            href="/products"
            className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-700"
          >
            Products
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
          <div className="flex min-h-[400px] items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            Product Image
          </div>

          <div className="flex flex-col justify-center">
            <a
              href={`/store/${encodeURIComponent(product.storeSlug)}`}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              {product.store}
            </a>

            <p className="mt-3 text-sm font-medium text-gray-500">
              {product.category}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            <p className="mt-5 text-3xl font-bold text-blue-700">
              {product.price}
            </p>

            <p className="mt-6 leading-7 text-gray-600">
              {product.description}
            </p>

            <button
              onClick={() => addToCart(product.name)}
              className="mt-8 w-full rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Add to Cart
            </button>

            <a
              href="/products"
              className="mt-4 text-center font-semibold text-blue-700 hover:underline"
            >
              ← Continue Shopping
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
