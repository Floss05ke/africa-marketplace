
"use client";

import { useCallback, useEffect, useState } from "react";

type InventoryRecord = {
  id: string;
  productId: string | null;
  variantId: string | null;
  available: number;
  reserved: number;
  lowStockAt: number;
  updatedAt: string;
};

type InventoryItem = {
  itemType: "PRODUCT" | "VARIANT";
  productId: string;
  variantId: string | null;
  name: string;
  sku: string | null;
  listingId: string | null;
  storeName: string;
  productStatus: string;
  inventory: InventoryRecord | null;
};

type InventoryData = {
  success: boolean;
  summary: {
    totalItems: number;
    trackedItems: number;
    untrackedItems: number;
    lowStockItems: number;
    totalAvailable: number;
    totalReserved: number;
  };
  items: InventoryItem[];
};

export default function VendorInventoryPage() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [notice, setNotice] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [thresholds, setThresholds] = useState<Record<string, string>>({});

  const loadInventory = useCallback(async () => {
    try {
      setError("");
      const response = await fetch("/api/vendor/inventory");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load inventory.");
      }

      const inventoryData = result as InventoryData;
      setData(inventoryData);

      setQuantities((current) => {
        const next = { ...current };
        for (const item of inventoryData.items) {
          const key = item.variantId ?? item.productId;
          if (next[key] === undefined) {
            next[key] = String(item.inventory?.available ?? 0);
          }
        }
        return next;
      });

      setThresholds((current) => {
        const next = { ...current };
        for (const item of inventoryData.items) {
          const key = item.variantId ?? item.productId;
          if (next[key] === undefined) {
            next[key] = String(item.inventory?.lowStockAt ?? 5);
          }
        }
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load inventory."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  async function saveItem(item: InventoryItem) {
    const key = item.variantId ?? item.productId;
    const available = Number(quantities[key]);
    const lowStockAt = Number(thresholds[key]);

    if (
      !Number.isSafeInteger(available) ||
      available < 0 ||
      !Number.isSafeInteger(lowStockAt) ||
      lowStockAt < 0
    ) {
      setNotice("Enter non-negative whole numbers for stock and threshold.");
      return;
    }

    setSavingId(key);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/vendor/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          ...(item.variantId ? { variantId: item.variantId } : {}),
          available,
          lowStockAt,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save inventory.");
      }

      setNotice(`${item.name}: inventory saved successfully.`);
      await loadInventory();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save inventory."
      );
    } finally {
      setSavingId("");
    }
  }

  const summary = data?.summary;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <a
              href="/vendor"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              ← Back to Vendor Dashboard
            </a>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Vendor Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Inventory Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track available stock, reserved units and low-stock thresholds.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadInventory()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh inventory
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            Loading inventory...
          </div>
        ) : data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard label="Total listings" value={summary!.totalItems} />
              <SummaryCard label="Available units" value={summary!.totalAvailable} />
              <SummaryCard label="Reserved units" value={summary!.totalReserved} />
              <SummaryCard label="Low-stock items" value={summary!.lowStockItems} />
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Your stock
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {summary!.trackedItems} tracked · {summary!.untrackedItems} awaiting stock setup
                </p>
              </div>

              {data.items.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  No products found for this vendor yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {data.items.map((item) => {
                    const key = item.variantId ?? item.productId;
                    const inventory = item.inventory;
                    const available = inventory?.available ?? 0;
                    const threshold = inventory?.lowStockAt ?? 5;
                    const lowStock = inventory !== null && available <= threshold;

                    return (
                      <article key={`${item.itemType}-${key}`} className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {item.storeName} · SKU: {item.sku || "Not assigned"}
                            </p>
                            {item.listingId && (
                              <p className="mt-1 break-all text-xs text-slate-500">
                                Listing ID: {item.listingId}
                              </p>
                            )}
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              inventory === null
                                ? "bg-slate-100 text-slate-600"
                                : lowStock
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {inventory === null
                              ? "Stock not set"
                              : lowStock
                                ? "Low stock"
                                : "Stock available"}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                          <div>
                            <label
                              htmlFor={`available-${key}`}
                              className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                              Available units
                            </label>
                            <input
                              id={`available-${key}`}
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              value={quantities[key] ?? String(available)}
                              onChange={(event) =>
                                setQuantities((current) => ({
                                  ...current,
                                  [key]: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`threshold-${key}`}
                              className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                              Low-stock threshold
                            </label>
                            <input
                              id={`threshold-${key}`}
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              value={thresholds[key] ?? String(threshold)}
                              onChange={(event) =>
                                setThresholds((current) => ({
                                  ...current,
                                  [key]: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              disabled={savingId === key}
                              onClick={() => void saveItem(item)}
                              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingId === key ? "Saving..." : "Save stock"}
                            </button>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                          Reserved: {inventory?.reserved ?? 0} · Product status: {item.productStatus}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value.toLocaleString("en-KE")}</p>
    </div>
  );
}
