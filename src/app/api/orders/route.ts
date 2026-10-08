import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

type IncomingItem = {
  product: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      fullName,
      email,
      phone,
      location,
      items,
    }: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      items?: IncomingItem[];
    } = body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !location ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required order information." },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((item) => ({
      product: String(item.product),
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));

    const products = await prisma.product.findMany({
      where: {
        name: {
          in: normalizedItems.map((item) => item.product),
        },
        status: "ACTIVE",
      },
      include: {
        store: true,
      },
    });

    if (products.length !== normalizedItems.length) {
      return NextResponse.json(
        { error: "One or more products are unavailable." },
        { status: 400 }
      );
    }

    const productMap = new Map(
      products.map((product) => [product.name, product])
    );

    const subtotal = normalizedItems.reduce((sum, item) => {
      const product = productMap.get(item.product);

      if (!product) return sum;

      return (
        sum +
        Number(product.basePrice) * item.quantity
      );
    }, 0);

    const place = location.toLowerCase();

    let deliveryFee = 0;

    if (place.includes("nairobi")) {
      deliveryFee = 200;
    } else if (place.includes("mombasa")) {
      deliveryFee = 500;
    } else if (place.includes("kisumu")) {
      deliveryFee = 400;
    }

    const total = subtotal + deliveryFee;

    const result = await (async () => {
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: fullName,
            phone,
            role: "CUSTOMER",
            countryCode: "KE",
          },
        });
      }

      let customer = await prisma.customer.findUnique({
        where: { userId: user.id },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            userId: user.id,
          },
        });
      }

      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          currency: "KES",
          subtotal,
          total,
          status: "PENDING",
        },
      });

      const vendorGroups = new Map<string, typeof products>();

      for (const product of products) {
        const existing = vendorGroups.get(product.vendorId) || [];
        existing.push(product);
        vendorGroups.set(product.vendorId, existing);
      }

      for (const [vendorId, vendorProducts] of vendorGroups) {
        const vendorItems = normalizedItems.filter((item) =>
          vendorProducts.some(
            (product) => product.name === item.product
          )
        );

        const vendorSubtotal = vendorItems.reduce((sum, item) => {
          const product = productMap.get(item.product);

          if (!product) return sum;

          return (
            sum +
            Number(product.basePrice) * item.quantity
          );
        }, 0);

        const vendorOrder = await prisma.vendorOrder.create({
          data: {
            orderId: order.id,
            vendorId,
            subtotal: vendorSubtotal,
            commission: 0,
            status: "PENDING",
          },
        });

        for (const item of vendorItems) {
          const product = productMap.get(item.product);

          if (!product) continue;

          await prisma.orderItem.create({
            data: {
              vendorOrderId: vendorOrder.id,
              productId: product.id,
              productName: product.name,
              sku: product.slug,
              quantity: item.quantity,
              unitPrice: product.basePrice,
              totalPrice:
                Number(product.basePrice) * item.quantity,
            },
          });
        }

        await prisma.payout.create({
          data: {
            vendorId,
            vendorOrderId: vendorOrder.id,
            amount: vendorSubtotal,
            currency: "KES",
            status: "PENDING",
          },
        });
      }

      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          currency: "KES",
          provider: "PENDING",
          status: "PENDING",
        },
      });

      return order;
    })();

    return NextResponse.json(
      {
        success: true,
        orderId: result.id,
        status: result.status,
        subtotal,
        deliveryFee,
        total,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create order.",
      },
      { status: 500 }
    );
  }
}
