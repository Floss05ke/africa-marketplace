"use client";

import Cart from "./Cart";
import { useCart } from "./CartContext";

const categories = [
  "Fashion",
  "Beauty",
  "Electronics",
  "Home & Living",
  "Phones & Accessories",
  "Jewelry",
  "Food & Beverages",
  "Arts & Crafts",
];

const products = [
  {
    name: "Modern Sofa Set",
    price: "KES 45,000",
    store: "HomeStyle Store",
  },
  {
    name: "Smart Watch",
    price: "KES 3,500",
    store: "TechHub Store",
  },
  {
    name: "Leather Handbag",
    price: "KES 4,200",
    store: "Urban Fashion",
  },
  {
    name: "Skincare Collection",
    price: "KES 2,800",
    store: "Glow Beauty",
  },
];

export default function Home() {
  const { cartItems, addToCart, removeFromCart } = useCart();

  const startShopping = () => {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const openCart = () => {
    document.getElementById("cart")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-2xl font-bold">
              AfricaMarket
            </div>

            <div className="flex flex-1 md:mx-10">
              <input
                type="text"
                placeholder="Search products, stores and categories..."
                className="w-full rounded-l-lg px-4 py-3 text-gray-800 outline-none"
              />

              <button className="rounded-r-lg bg-blue-900 px-6 font-semibold">
                Search
              </button>
            </div>

            <div className="flex gap-5 text-sm font-medium">
              <button>Sign In</button>

              <button onClick={openCart}>
                Cart 🛒({cartItems.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl overflow-x-auto px-6 py-4">
          <div className="flex gap-6 whitespace-nowrap text-sm font-medium text-gray-700">
            {categories.map((category) => (
              <button
                key={category}
                className="hover:text-blue-700"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-blue-700 px-8 py-12 text-white">
          <div className="max-w-2xl">
            <p className="mb-3 font-semibold uppercase tracking-wide">
              One marketplace. Many stores.
            </p>

            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Discover products from sellers across Africa
            </h1>

            <p className="mt-5 text-lg text-blue-100">
              Shop from multiple independent stores, compare products,
              and manage everything from one marketplace.
            </p>

            <button
              onClick={startShopping}
              className="mt-7 rounded-lg bg-white px-6 py-3 font-bold text-blue-700 hover:bg-blue-50"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-6 pb-12"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Featured Products
          </h2>

          <button
            onClick={() => (window.location.href = "/products")}
            className="font-semibold text-blue-700"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
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

                <h3 className="mt-1 font-semibold text-gray-900">
                  {product.name}
                </h3>

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
      </section>

      {/* Vendor section */}
      <section className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900">
            Shop From Independent Stores
          </h2>

          <p className="mt-2 text-gray-600">
            Discover trusted vendors and support businesses across Africa.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              "HomeStyle Store",
              "TechHub Store",
              "Urban Fashion",
            ].map((store) => (
              <div
                key={store}
                className="rounded-xl border p-5 hover:border-blue-500"
              >
                <h3 className="font-bold text-gray-900">
                  {store}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Browse this store
                </p>

                <button className="mt-4 font-semibold text-blue-700">
                  Visit Store →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cart */}
      <section
        id="cart"
        className="mx-auto max-w-7xl px-6 pb-12"
      >
        <Cart
          items={cartItems}
          onRemove={removeFromCart}
        />
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-6 py-8 text-center text-gray-400">
        <p>
          © 2026 AfricaMarket. A marketplace built for Africa and beyond.
        </p>
      </footer>
    </main>
  );
}