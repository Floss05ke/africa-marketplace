
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function isNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

export async function GET() {
  try {
    // Temporary development vendor.
    // Authentication will replace this lookup later.
    const vendor = await prisma.vendor.findFirst();

    if (!vendor) {
      return errorResponse("No vendor account found.", 404);
    }

    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
        store: {
          select: { name: true },
        },
        inventory: {
          select: {
            id: true,
            available: true,
            reserved: true,
            lowStockAt: true,
            updatedAt: true,
          },
        },
        variants: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            listingId: true,
            name: true,
            sku: true,
            inventory: {
              select: {
                id: true,
                available: true,
                reserved: true,
                lowStockAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const items = products.flatMap((product) => [
      {
        itemType: "PRODUCT" as const,
        productId: product.id,
        variantId: null,
        name: product.name,
        sku: product.sku,
        listingId: null,
        storeName: product.store.name,
        productStatus: product.status,
        inventory: product.inventory,
      },
      ...product.variants.map((variant) => ({
        itemType: "VARIANT" as const,
        productId: product.id,
        variantId: variant.id,
        name: `${product.name} — ${variant.name}`,
        sku: variant.sku,
        listingId: variant.listingId,
        storeName: product.store.name,
        productStatus: product.status,
        inventory: variant.inventory,
      })),
    ]);

    const summary = {
      totalItems: items.length,
      trackedItems: items.filter((item) => item.inventory !== null).length,
      untrackedItems: items.filter((item) => item.inventory === null).length,
      lowStockItems: items.filter(
        (item) =>
          item.inventory !== null &&
          item.inventory.available <= item.inventory.lowStockAt
      ).length,
      totalAvailable: items.reduce(
        (total, item) => total + (item.inventory?.available ?? 0),
        0
      ),
      totalReserved: items.reduce(
        (total, item) => total + (item.inventory?.reserved ?? 0),
        0
      ),
    };

    return NextResponse.json({
      success: true,
      summary,
      items,
    });
  } catch (error) {
    console.error("Vendor inventory GET error:", error);
    return errorResponse("Unable to load vendor inventory.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    // Temporary development vendor.
    // Authentication will replace this lookup later.
    const vendor = await prisma.vendor.findFirst();

    if (!vendor) {
      return errorResponse("No vendor account found.", 404);
    }

    let body: Record<string, unknown>;

    try {
      const parsed: unknown = await request.json();

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return errorResponse("Request body must be a JSON object.");
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return errorResponse("Request body must contain valid JSON.");
    }

    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";

    const variantId =
      typeof body.variantId === "string" ? body.variantId.trim() : "";

    if (!productId) {
      return errorResponse("Product ID is required.");
    }

    if (body.variantId !== undefined && !variantId) {
      return errorResponse("Variant ID must be a non-empty string.");
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId: vendor.id,
      },
      select: { id: true },
    });

    if (!product) {
      return errorResponse("Product not found for this vendor.", 404);
    }

    let target:
      | { productId: string; variantId: string | null }
      | null = null;

    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          productId: product.id,
        },
        select: { id: true, productId: true },
      });

      if (!variant) {
        return errorResponse("Variant not found for this product.", 404);
      }

      target = {
        productId: variant.productId,
        variantId: variant.id,
      };
    } else {
      target = {
        productId: product.id,
        variantId: null,
      };
    }

    const existingInventory = target.variantId
      ? await prisma.inventory.findUnique({
          where: { variantId: target.variantId },
        })
      : await prisma.inventory.findUnique({
          where: { productId: target.productId },
        });

    const availableProvided = body.available !== undefined;
    const lowStockProvided = body.lowStockAt !== undefined;

    if (!availableProvided && !lowStockProvided) {
      return errorResponse(
        "Provide available stock, low-stock threshold, or both."
      );
    }

    if (
      availableProvided &&
      !isNonNegativeInteger(body.available)
    ) {
      return errorResponse(
        "Available stock must be a non-negative whole number."
      );
    }

    if (
      lowStockProvided &&
      !isNonNegativeInteger(body.lowStockAt)
    ) {
      return errorResponse(
        "Low-stock threshold must be a non-negative whole number."
      );
    }

    const available = availableProvided
      ? (body.available as number)
      : (existingInventory?.available ?? 0);

    const reserved = existingInventory?.reserved ?? 0;

    const lowStockAt = lowStockProvided
      ? (body.lowStockAt as number)
      : (existingInventory?.lowStockAt ?? 5);

    if (available < reserved) {
      return errorResponse(
        `Available stock cannot be lower than reserved stock (${reserved}).`
      );
    }

    const inventory = target.variantId
      ? await prisma.inventory.upsert({
          where: { variantId: target.variantId },
          create: {
            variantId: target.variantId,
            available,
            reserved: 0,
            lowStockAt,
          },
          update: {
            available,
            lowStockAt,
          },
        })
      : await prisma.inventory.upsert({
          where: { productId: target.productId },
          create: {
            productId: target.productId,
            available,
            reserved: 0,
            lowStockAt,
          },
          update: {
            available,
            lowStockAt,
          },
        });

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully.",
      inventory: {
        id: inventory.id,
        productId: inventory.productId,
        variantId: inventory.variantId,
        available: inventory.available,
        reserved: inventory.reserved,
        lowStockAt: inventory.lowStockAt,
        updatedAt: inventory.updatedAt,
      },
    });
  } catch (error) {
    console.error("Vendor inventory PATCH error:", error);
    return errorResponse("Unable to update vendor inventory.", 500);
  }
}
