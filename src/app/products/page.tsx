"use client";

import { useState } from "react";
import { useCart } from "../CartContext";

const products = [
  {
    name: "Modern Sofa Set",
    price: "KES 45,000",
    store: "HomeStyle Store",
    category: "Home & Living",
  },
  {
    name: "Smart Watch",
    price: "KES 3,500",
    store: "TechHub Store",
    category: "Electronics",
  },
  {
    name: "Leather Handbag",
    price: "KES 4,200",
    store: "Urban Fashion",
    category: "Fashion",
  },
  {
    name: "Skincare Collection",
    price: "KES 2,800",
    store: "Glow Beauty",
    category: "Beauty",
  },
];

export default function Products() {
  const [search, setSearch] = useState("");
  const { cartItems, addToCart } = useCart();

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.store} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-700 px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              AfricaMarket Products
            </h1>

            <p className="mt-1 text-blue-100">
              Discover products from independent stores.
            </p>
          </div>

          <button
            onClick={() => (window.location.href = "/")}
            className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-700"
          >
            Home
          </button>
        </div>
      </header>

      {/* Search */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <input
          type="text"
          placeholder="Search products, stores or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-white px-4 py-3 text-gray-800 outline-none focus:border-blue-600"
        />
      </section>

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-6">
          <div className="rounded-lg bg-blue-50 p-4 text-blue-800">
            <p className="font-semibold">
              Cart 🛒: {cartItems.length} item
              {cartItems.length !== 1 ? "s" : ""}
            </p>

            <button
              onClick={() => window.history.back()}
              className="mt-2 font-semibold underline"
            >
              Go to Cart
            </button>
          </div>
        </section>
      )}

      {/* Products */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.name}
              className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200"
            >
              <div className="flex h-48 items-center justify-center bg-gray-100 text-gray-400">
                Product Image
              </div>

              <div className="p-5">
                <p className="text-sm text-gray-500">
                  {product.store}
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-900">
                  {product.name}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {product.category}
                </p>

                <p className="mt-3 text-lg font-bold text-blue-700">
                  {product.price}
                </p>

                <button
                  onClick={() => addToCart(product.name)}
                  className="mt-4 w-full rounded-lg bg-blue-700 py-2.5 font-semibold text-white hover:bg-blue-800"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <p className="mt-8 text-center text-gray-500">
            No products found.
          </p>
        )}
      </section>
    </main>
  );
}