import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: {
        slug,
      },
      include: {
        store: true,
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: `${product.currency} ${Number(product.basePrice).toLocaleString(
        "en-KE"
      )}`,
      store: product.store.name,
      storeSlug: product.store.slug,
      category: product.category.name,
      description: product.description,
    });
  } catch (error) {
    console.error("Product API error:", error);

    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 }
    );
  }
}
