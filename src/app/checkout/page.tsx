"use client";

import { useEffect, useState } from "react";

export default function Checkout() {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const amount = Number(params.get("total")) || 0;
    setSubtotal(amount);
  }, []);

  const getDeliveryFee = () => {
    const place = location.toLowerCase();

    if (place.includes("nairobi")) {
      return 200;
    }

    if (place.includes("mombasa")) {
      return 500;
    }

    if (place.includes("kisumu")) {
      return 400;
    }

    return 0;
  };

  const deliveryFee = getDeliveryFee();
  const total = subtotal + deliveryFee;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Checkout
        </h1>

        <p className="mt-2 text-gray-600">
          Complete your order details below.
        </p>

        {orderPlaced && (
          <p className="mt-4 rounded-lg bg-green-100 p-3 font-semibold text-green-700">
            Order received successfully! We will contact you shortly.
          </p>
        )}

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

          <button
            type="button"
            onClick={() => setOrderPlaced(true)}
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
          >
            Place Order
          </button>
        </div>
      </div>
    </main>
  );
}