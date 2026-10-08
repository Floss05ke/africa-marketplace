"use client";

import { useMemo } from "react";
import { CartItem } from "./CartContext";

type CartProps = {
  items: CartItem[];
  onRemove: (product: string) => void;
  onUpdateQuantity?: (product: string, quantity: number) => void;
};

const prices: Record<string, number> = {
  "Modern Sofa Set": 45000,
  "Smart Watch": 3500,
  "Leather Handbag": 4200,
  "Skincare Collection": 2800,
};

export default function Cart({
  items,
  onRemove,
  onUpdateQuantity,
}: CartProps) {
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (prices[item.product] || 0) * item.quantity,
        0
      ),
    [items]
  );

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

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

      {items.length === 0 ? (
        <p className="mt-4 text-gray-500">
          Your cart is empty.
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li
                key={item.product}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-gray-800"
              >
                <span>{item.product}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onUpdateQuantity?.(
                        item.product,
                        Math.max(1, item.quantity - 1)
                      )
                    }
                    className="rounded bg-gray-200 px-3 py-1 font-bold"
                  >
                    −
                  </button>

                  <span className="min-w-6 text-center">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      onUpdateQuantity?.(
                        item.product,
                        item.quantity + 1
                      )
                    }
                    className="rounded bg-gray-200 px-3 py-1 font-bold"
                  >
                    +
                  </button>

                  <button
                    onClick={() => onRemove(item.product)}
                    className="rounded bg-red-100 px-3 py-1 font-semibold text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
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
