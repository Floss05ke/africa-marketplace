"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  success: boolean;
  vendor: {
    id: string;
    verificationStatus: string;
    storeCount: number;
    stores: {
      id: string;
      name: string;
      slug: string;
      status: string;
    }[];
  };
  products: {
    total: number;
    active: number;
    draft: number;
  };
  orders: {
    total: number;
    pending: number;
    preparing: number;
    readyForHandover: number;
    completed: number;
  };
  inventory: {
    productsWithInventory: number;
    lowStockProducts: number;
    totalAvailableStock: number;
    totalReservedStock: number;
  };
  payouts: {
    pending: number;
    paid: number;
    currency: string;
  };
};

export default function VendorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/vendor/dashboard");

        if (!response.ok) {
          throw new Error("Unable to load vendor dashboard.");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Unable to load vendor dashboard.");
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load vendor dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">Loading vendor dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">
              Vendor Dashboard
            </h1>
            <p className="mt-2 text-red-600">
              {error || "Dashboard data is unavailable."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const formatCurrency = (amount: number) =>
    `${data.payouts.currency} ${amount.toLocaleString("en-KE")}`;

  const verificationLabel =
    data.vendor.verificationStatus === "VERIFIED"
      ? "Verified"
      : data.vendor.verificationStatus === "REJECTED"
        ? "Rejected"
        : "Pending Review";

  const verificationClass =
    data.vendor.verificationStatus === "VERIFIED"
      ? "bg-green-50 text-green-700 border-green-200"
      : data.vendor.verificationStatus === "REJECTED"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Vendor Portal
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your stores, listings, orders, inventory and payouts.
            </p>
          </div>

          <div
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${verificationClass}`}
          >
            Verification: {verificationLabel}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Stores"
            value={data.vendor.storeCount}
            description="Active vendor stores"
          />

          <DashboardCard
            title="Products"
            value={data.products.active}
            description={`${data.products.draft} draft listings`}
          />

          <DashboardCard
            title="Orders"
            value={data.orders.total}
            description={`${data.orders.pending} pending orders`}
          />

          <DashboardCard
            title="Pending Payout"
            value={formatCurrency(data.payouts.pending)}
            description="Current pending amount"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <DashboardSection title="Order Overview">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBox label="Pending" value={data.orders.pending} />
              <StatBox label="Preparing" value={data.orders.preparing} />
              <StatBox
                label="Ready"
                value={data.orders.readyForHandover}
              />
              <StatBox label="Completed" value={data.orders.completed} />
            </div>
          </DashboardSection>

          <DashboardSection title="Inventory">
            <div className="grid grid-cols-2 gap-4">
              <StatBox
                label="Available"
                value={data.inventory.totalAvailableStock}
              />
              <StatBox
                label="Reserved"
                value={data.inventory.totalReservedStock}
              />
              <StatBox
                label="Low Stock"
                value={data.inventory.lowStockProducts}
              />
              <StatBox
                label="Tracked Products"
                value={data.inventory.productsWithInventory}
              />
            </div>
          </DashboardSection>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <DashboardSection title="Your Stores">
            <div className="space-y-3">
              {data.vendor.stores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {store.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      /store/{store.slug}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {store.status}
                  </span>
                </div>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection title="Payout Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-blue-50 px-5 py-4">
                <div>
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatCurrency(data.payouts.pending)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-5 py-4">
                <div>
                  <p className="text-sm text-slate-600">Paid</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatCurrency(data.payouts.paid)}
                  </p>
                </div>
              </div>
            </div>
          </DashboardSection>
        </section>

        <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Vendor Operations
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Your vendor portal will become the central place for managing
            listings, stock, incoming orders, DS handovers, store performance
            and payouts.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ActionPlaceholder label="Manage Products" />
            <a
              href="/vendor/inventory"
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-center text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Manage Inventory
            </a>
            <ActionPlaceholder label="View Orders" />
            <ActionPlaceholder label="View Payouts" />
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function DashboardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ActionPlaceholder({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 opacity-80"
    >
      {label}
    </button>
  );
}
