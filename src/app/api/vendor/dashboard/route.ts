import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    // Temporary development vendor.
    // We will replace this with authenticated vendor identity
    // when authentication is implemented.
    const vendor = await prisma.vendor.findFirst({
      include: {
        stores: true,
        verification: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "No vendor account found.",
        },
        { status: 404 }
      );
    }

    const [
      totalProducts,
      activeProducts,
      draftProducts,
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyForHandoverOrders,
      completedOrders,
      pendingPayouts,
      paidPayouts,
      inventory,
    ] = await Promise.all([
      prisma.product.count({
        where: { vendorId: vendor.id },
      }),

      prisma.product.count({
        where: {
          vendorId: vendor.id,
          status: "ACTIVE",
        },
      }),

      prisma.product.count({
        where: {
          vendorId: vendor.id,
          status: "DRAFT",
        },
      }),

      prisma.vendorOrder.count({
        where: { vendorId: vendor.id },
      }),

      prisma.vendorOrder.count({
        where: {
          vendorId: vendor.id,
          status: "PENDING",
        },
      }),

      prisma.vendorOrder.count({
        where: {
          vendorId: vendor.id,
          status: "PREPARING",
        },
      }),

      prisma.vendorOrder.count({
        where: {
          vendorId: vendor.id,
          status: "READY_FOR_HANDOVER",
        },
      }),

      prisma.vendorOrder.count({
        where: {
          vendorId: vendor.id,
          status: "COMPLETED",
        },
      }),

      prisma.payout.aggregate({
        where: {
          vendorId: vendor.id,
          status: "PENDING",
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.payout.aggregate({
        where: {
          vendorId: vendor.id,
          status: "PAID",
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.inventory.findMany({
        where: {
          product: {
            vendorId: vendor.id,
          },
        },
        select: {
          available: true,
          reserved: true,
          lowStockAt: true,
        },
      }),
    ]);

    const lowStockProducts = inventory.filter(
      (item) => item.available <= item.lowStockAt
    ).length;

    const totalAvailableStock = inventory.reduce(
      (total, item) => total + item.available,
      0
    );

    const totalReservedStock = inventory.reduce(
      (total, item) => total + item.reserved,
      0
    );

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        verificationStatus: vendor.verification?.status ?? "PENDING",
        storeCount: vendor.stores.length,
        stores: vendor.stores.map((store) => ({
          id: store.id,
          name: store.name,
          slug: store.slug,
          status: store.status,
        })),
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        draft: draftProducts,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        preparing: preparingOrders,
        readyForHandover: readyForHandoverOrders,
        completed: completedOrders,
      },
      inventory: {
        productsWithInventory: inventory.length,
        lowStockProducts,
        totalAvailableStock,
        totalReservedStock,
      },
      payouts: {
        pending: Number(
          pendingPayouts._sum.amount?.toString() ?? "0"
        ),
        paid: Number(
          paidPayouts._sum.amount?.toString() ?? "0"
        ),
        currency: "KES",
      },
    });
  } catch (error) {
    console.error("Vendor dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load vendor dashboard.",
      },
      { status: 500 }
    );
  }
}
