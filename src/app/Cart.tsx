"use client";

import { useState } from "react";

type CartProps = {
  items: string[];
  onRemove: (product: string) => void;
};

export default function Cart({ items, onRemove }: CartProps) {
  const prices: Record<string, number> = {
    "Modern Sofa Set": 45000,
    "Smart Watch": 3500,
    "Leather Handbag": 4200,
    "Skincare Collection": 2800,
  };

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const uniqueItems = [...new Set(items)];

  const getQuantity = (item: string) => {
    return quantities[item] || 1;
  };

  const increaseQuantity = (item: string) => {
    setQuantities((current) => ({
      ...current,
      [item]: getQuantity(item) + 1,
    }));
  };

  const decreaseQuantity = (item: string) => {
    setQuantities((current) => ({
      ...current,
      [item]: Math.max(getQuantity(item) - 1, 1),
    }));
  };

  const removeItem = (item: string) => {
    setQuantities((current) => {
      const updated = { ...current };
      delete updated[item];
      return updated;
    });

    onRemove(item);
  };

  const total = uniqueItems.reduce((sum, item) => {
    const quantity = getQuantity(item);
    const price = prices[item] || 0;

    return sum + price * quantity;
  }, 0);

  const totalItems = uniqueItems.reduce((sum, item) => {
    return sum + getQuantity(item);
  }, 0);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        Shopping Cart
      </h2>

      <p className="mt-2 text-gray-600">
        Items in your cart: {totalItems}
      </p>

      <p className="mt-2 text-lg font-bold text-gray-900">
        Total: KES {total.toLocaleString()}
      </p>

      {uniqueItems.length === 0 ? (
        <p className="mt-4 text-gray-500">
          Your cart is empty.
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {uniqueItems.map((item) => {
              const quantity = getQuantity(item);

              return (
                <li
                  key={item}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-gray-800"
                >
                  <span>{item}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decreaseQuantity(item)}
                      className="rounded bg-gray-200 px-3 py-1 font-bold"
                    >
                      −
                    </button>

                    <span className="min-w-6 text-center">
                      {quantity}
                    </span>

                    <button
                      onClick={() => increaseQuantity(item)}
                      className="rounded bg-gray-200 px-3 py-1 font-bold"
                    >
                      +
                    </button>

                    <button
                      onClick={() => removeItem(item)}
                      className="rounded bg-red-100 px-3 py-1 font-semibold text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            onClick={() =>
              (window.location.href = `/checkout?total=${total}`)
            }
            className="mt-6 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700"
          >
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
}