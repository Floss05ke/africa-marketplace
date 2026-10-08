"use client";

import { useEffect, useState } from "react";
import { useCart } from "../CartContext";

export default function Checkout() {
  const { cartItems, clearCart } = useCart();

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSubtotal(Number(params.get("total")) || 0);
  }, []);

  const getDeliveryFee = () => {
    const place = location.toLowerCase();

    if (place.includes("nairobi")) return 200;
    if (place.includes("mombasa")) return 500;
    if (place.includes("kisumu")) return 400;

    return 0;
  };

  const deliveryFee = getDeliveryFee();
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    setError("");

    if (!fullName || !email || !phone || !location) {
      setError("Please complete all delivery details.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          location,
          items: cartItems,
          deliveryFee,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not place order.");
      }

      setOrderId(data.orderId);
      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not place order."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Checkout
        </h1>

        <p className="mt-2 text-gray-600">
          Complete your order details below.
        </p>

        {orderPlaced ? (
          <div className="mt-6 rounded-lg bg-green-100 p-5">
            <h2 className="text-xl font-bold text-green-800">
              Order received successfully!
            </h2>

            <p className="mt-2 text-green-700">
              Your order reference is:
            </p>

            <p className="mt-1 font-bold text-green-900">
              {orderId}
            </p>

            <p className="mt-3 text-green-700">
              Payment status: Pending
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <input
              type="text"
              placeholder="Delivery Address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-gray-700">
                Subtotal: KES {subtotal.toLocaleString()}
              </p>

              <p className="mt-2 text-gray-700">
                Delivery Fee: KES {deliveryFee.toLocaleString()}
              </p>

              <p className="mt-2 text-lg font-bold text-gray-900">
                Total: KES {total.toLocaleString()}
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-100 p-3 font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={placeOrder}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
