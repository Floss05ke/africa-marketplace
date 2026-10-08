import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const store = await prisma.store.findUnique({
      where: {
        slug,
      },
      include: {
        products: {
          where: {
            status: "ACTIVE",
          },
          include: {
            category: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      products: store.products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: `${product.currency} ${Number(
          product.basePrice
        ).toLocaleString("en-KE")}`,
        category: product.category.name,
      })),
    });
  } catch (error) {
    console.error("Store API error:", error);

    return NextResponse.json(
      { error: "Failed to load store" },
      { status: 500 }
    );
  }
}

