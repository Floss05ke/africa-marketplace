import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../generated/prisma/client";

function createListingId() {
  return `TRL-LST-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
}

function normalizeVariants(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((variant) => {
    const item =
      variant && typeof variant === "object"
        ? (variant as Record<string, unknown>)
        : {};

    return {
      name:
        typeof item.name === "string"
          ? item.name.trim()
          : "",
      sku:
        typeof item.sku === "string" && item.sku.trim()
          ? item.sku.trim()
          : null,
      price: Number(item.price),
      attributes:
        item.attributes &&
        typeof item.attributes === "object" &&
        !Array.isArray(item.attributes)
          ? item.attributes
          : null,
    };
  });
}

async function getProductResponse(productId: string) {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      store: true,
      category: true,
      inventory: true,
      variants: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          inventory: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    brand: product.brand,
    sku: product.sku,
    price: Number(product.basePrice),
    currency: product.currency,
    status: product.status,
    store: {
      id: product.store.id,
      name: product.store.name,
      slug: product.store.slug,
    },
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    inventory: product.inventory
      ? {
          available: product.inventory.available,
          reserved: product.inventory.reserved,
          lowStockAt: product.inventory.lowStockAt,
        }
      : null,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      listingId: variant.listingId,
      name: variant.name,
      sku: variant.sku,
      price: Number(variant.price),
      attributes: variant.attributes,
      inventory: variant.inventory
        ? {
            available: variant.inventory.available,
            reserved: variant.inventory.reserved,
            lowStockAt: variant.inventory.lowStockAt,
          }
        : null,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function GET() {
  try {
    // Temporary development vendor.
    // Authentication will replace this lookup later.
    const vendor = await prisma.vendor.findFirst();

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "No vendor account found.",
        },
        { status: 404 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        vendorId: vendor.id,
      },
      include: {
        store: true,
        category: true,
        inventory: true,
        variants: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            inventory: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: product.brand,
        sku: product.sku,
        price: Number(product.basePrice),
        currency: product.currency,
        status: product.status,
        store: {
          id: product.store.id,
          name: product.store.name,
          slug: product.store.slug,
        },
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        },
        inventory: product.inventory
          ? {
              available: product.inventory.available,
              reserved: product.inventory.reserved,
              lowStockAt: product.inventory.lowStockAt,
            }
          : null,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          listingId: variant.listingId,
          name: variant.name,
          sku: variant.sku,
          price: Number(variant.price),
          attributes: variant.attributes,
          inventory: variant.inventory
            ? {
                available: variant.inventory.available,
                reserved: variant.inventory.reserved,
                lowStockAt: variant.inventory.lowStockAt,
              }
            : null,
          createdAt: variant.createdAt,
          updatedAt: variant.updatedAt,
        })),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Vendor products GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load vendor products.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const vendor = await prisma.vendor.findFirst();

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "No vendor account found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const brand =
      typeof body.brand === "string"
        ? body.brand.trim()
        : null;

    const sku =
      typeof body.sku === "string"
        ? body.sku.trim()
        : "";

    const storeId =
      typeof body.storeId === "string"
        ? body.storeId
        : "";

    const categoryId =
      typeof body.categoryId === "string"
        ? body.categoryId
        : "";

    const price = Number(body.price);

    if (!name || !sku || !storeId || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, SKU, store and category are required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Price must be a valid amount greater than zero.",
        },
        { status: 400 }
      );
    }

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        vendorId: vendor.id,
      },
    });

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected store does not belong to this vendor.",
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected category was not found.",
        },
        { status: 400 }
      );
    }

    const existingSku = await prisma.product.findFirst({
      where: {
        vendorId: vendor.id,
        sku,
      },
    });

    if (existingSku) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a product using this SKU.",
        },
        { status: 409 }
      );
    }

    const variants = normalizeVariants(body.variants);

    for (const variant of variants) {
      if (!variant.name) {
        return NextResponse.json(
          {
            success: false,
            error: "Every variant must have a name.",
          },
          { status: 400 }
        );
      }

      if (!Number.isFinite(variant.price) || variant.price <= 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Every variant must have a valid price greater than zero.",
          },
          { status: 400 }
        );
      }
    }

    const variantSkus = variants
      .map((variant) => variant.sku)
      .filter((value): value is string => Boolean(value));

    if (new Set(variantSkus).size !== variantSkus.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Variant SKUs must be unique within this product.",
        },
        { status: 409 }
      );
    }

    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!baseSlug) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product name cannot create a valid URL slug.",
        },
        { status: 400 }
      );
    }

    let slug = baseSlug;
    let suffix = 2;

    while (
      await prisma.product.findUnique({
        where: { slug },
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    // Create parent product first.
    // We intentionally avoid Prisma transactions because
    // PrismaNeonHttp does not support transactions.
    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        storeId: store.id,
        categoryId: category.id,
        name,
        slug,
        description,
        brand,
        sku,
        basePrice: price,
        currency: "KES",
        status: "DRAFT",
      },
    });

    // Create variants/listings under the parent product.
    const createdVariants = [];

    for (const variant of variants) {
      const listingId = createListingId();

      const createdVariant =
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            listingId,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            attributes: variant.attributes ?? undefined,
          },
        });

      createdVariants.push(createdVariant);
    }

    const responseProduct =
      await getProductResponse(product.id);

    if (!responseProduct) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product was created, but could not be loaded afterward.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        product: responseProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Vendor products POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create vendor product.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const vendor = await prisma.vendor.findFirst();

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "No vendor account found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const productId =
      typeof body.productId === "string"
        ? body.productId
        : "";

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const existingProduct =
      await prisma.product.findFirst({
        where: {
          id: productId,
          vendorId: vendor.id,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    // Variant update.
    if (body.variantId !== undefined) {
      const variantId =
        typeof body.variantId === "string"
          ? body.variantId
          : "";

      if (!variantId) {
        return NextResponse.json(
          {
            success: false,
            error: "Variant ID is required.",
          },
          { status: 400 }
        );
      }

      const existingVariant =
        await prisma.productVariant.findFirst({
          where: {
            id: variantId,
            productId,
          },
        });

      if (!existingVariant) {
        return NextResponse.json(
          {
            success: false,
            error: "Variant not found.",
          },
          { status: 404 }
        );
      }

      const variantUpdateData: {
        name?: string;
        sku?: string | null;
        price?: number;
        attributes?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
      } = {};

      if (body.variantName !== undefined) {
        if (
          typeof body.variantName !== "string" ||
          !body.variantName.trim()
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Variant name cannot be empty.",
            },
            { status: 400 }
          );
        }

        variantUpdateData.name =
          body.variantName.trim();
      }

      if (body.variantSku !== undefined) {
        if (
          body.variantSku !== null &&
          typeof body.variantSku !== "string"
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Variant SKU must be text or null.",
            },
            { status: 400 }
          );
        }

        const newVariantSku =
          typeof body.variantSku === "string"
            ? body.variantSku.trim()
            : null;

        if (newVariantSku) {
          const duplicateVariant =
            await prisma.productVariant.findFirst({
              where: {
                productId,
                sku: newVariantSku,
                NOT: {
                  id: variantId,
                },
              },
            });

          if (duplicateVariant) {
            return NextResponse.json(
              {
                success: false,
                error:
                  "Another variant under this product already uses that SKU.",
              },
              { status: 409 }
            );
          }
        }

        variantUpdateData.sku =
          newVariantSku || null;
      }

      if (body.variantPrice !== undefined) {
        const variantPrice =
          Number(body.variantPrice);

        if (
          !Number.isFinite(variantPrice) ||
          variantPrice <= 0
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Variant price must be a valid amount greater than zero.",
            },
            { status: 400 }
          );
        }

        variantUpdateData.price = variantPrice;
      }

      if (body.attributes !== undefined) {
        if (
          body.attributes !== null &&
          (typeof body.attributes !== "object" ||
            Array.isArray(body.attributes))
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Variant attributes must be an object or null.",
            },
            { status: 400 }
          );
        }

        variantUpdateData.attributes =
          body.attributes === null
            ? Prisma.JsonNull
            : (body.attributes as Prisma.InputJsonValue);
      }

      if (
        Object.keys(variantUpdateData).length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No valid variant changes were provided.",
          },
          { status: 400 }
        );
      }

      const updatedVariant =
        await prisma.productVariant.update({
          where: {
            id: variantId,
          },
          data: variantUpdateData,
        });

      return NextResponse.json({
        success: true,
        variant: {
          id: updatedVariant.id,
          listingId: updatedVariant.listingId,
          name: updatedVariant.name,
          sku: updatedVariant.sku,
          price: Number(updatedVariant.price),
          attributes: updatedVariant.attributes,
          updatedAt: updatedVariant.updatedAt,
        },
      });
    }

    // Parent product update.
    const updateData: {
      name?: string;
      description?: string | null;
      brand?: string | null;
      sku?: string;
      storeId?: string;
      categoryId?: string;
      basePrice?: number;
      status?:
        | "DRAFT"
        | "ACTIVE"
        | "INACTIVE"
        | "OUT_OF_STOCK";
    } = {};

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Product name cannot be empty.",
          },
          { status: 400 }
        );
      }

      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description =
        typeof body.description === "string"
          ? body.description.trim()
          : null;
    }

    if (body.brand !== undefined) {
      updateData.brand =
        typeof body.brand === "string"
          ? body.brand.trim()
          : null;
    }

    if (body.sku !== undefined) {
      if (
        typeof body.sku !== "string" ||
        !body.sku.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "SKU cannot be empty.",
          },
          { status: 400 }
        );
      }

      const newSku = body.sku.trim();

      const duplicateSku =
        await prisma.product.findFirst({
          where: {
            vendorId: vendor.id,
            sku: newSku,
            NOT: {
              id: productId,
            },
          },
        });

      if (duplicateSku) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You already have another product using this SKU.",
          },
          { status: 409 }
        );
      }

      updateData.sku = newSku;
    }

    if (body.storeId !== undefined) {
      if (
        typeof body.storeId !== "string" ||
        !body.storeId
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "A valid store is required.",
          },
          { status: 400 }
        );
      }

      const store = await prisma.store.findFirst({
        where: {
          id: body.storeId,
          vendorId: vendor.id,
        },
      });

      if (!store) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Selected store does not belong to this vendor.",
          },
          { status: 400 }
        );
      }

      updateData.storeId = store.id;
    }

    if (body.categoryId !== undefined) {
      if (
        typeof body.categoryId !== "string" ||
        !body.categoryId
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "A valid category is required.",
          },
          { status: 400 }
        );
      }

      const category =
        await prisma.category.findUnique({
          where: {
            id: body.categoryId,
          },
        });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Selected category was not found.",
          },
          { status: 400 }
        );
      }

      updateData.categoryId = category.id;
    }

    if (body.price !== undefined) {
      const newPrice = Number(body.price);

      if (
        !Number.isFinite(newPrice) ||
        newPrice <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Price must be a valid amount greater than zero.",
          },
          { status: 400 }
        );
      }

      updateData.basePrice = newPrice;
    }

    if (body.status !== undefined) {
      const allowedStatuses = [
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "OUT_OF_STOCK",
      ] as const;

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid product status.",
          },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No valid product changes were provided.",
        },
        { status: 400 }
      );
    }

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: updateData,
    });

    const responseProduct =
      await getProductResponse(productId);

    if (!responseProduct) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product was updated, but could not be loaded afterward.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: responseProduct,
    });
  } catch (error) {
    console.error("Vendor products PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update vendor product.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const vendor = await prisma.vendor.findFirst();

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "No vendor account found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const productId =
      typeof body.productId === "string"
        ? body.productId
        : "";

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    const existingProduct =
      await prisma.product.findFirst({
        where: {
          id: productId,
          vendorId: vendor.id,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    if (existingProduct.status === "INACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: "Product is already inactive.",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        status: "INACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product has been deactivated.",
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        status: product.status,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    console.error("Vendor products DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to deactivate vendor product.",
      },
      { status: 500 }
    );
  }
}
