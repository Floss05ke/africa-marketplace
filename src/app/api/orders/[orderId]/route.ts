import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { OrderStatus } from "../../../../generated/prisma/client";

const statusFlow: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_HANDOVER,
  OrderStatus.HANDED_TO_DS,
  OrderStatus.DS_RECEIVED,
  OrderStatus.DS_VERIFIED,
  OrderStatus.IN_LOGISTICS,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERY_ATTEMPTED,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
];

const terminalStatuses: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
];

function serializeDecimal(value: unknown) {
  if (value && typeof value === "object" && "toString" in value) {
    return Number(value.toString());
  }

  return value;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        vendorOrders: {
          include: {
            items: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        currency: order.currency,
        subtotal: serializeDecimal(order.subtotal),
        total: serializeDecimal(order.total),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        payment: order.payment
          ? {
              id: order.payment.id,
              status: order.payment.status,
              provider: order.payment.provider,
              reference: order.payment.reference,
              amount: serializeDecimal(order.payment.amount),
            }
          : null,
        vendorOrders: order.vendorOrders.map((vendorOrder) => ({
          id: vendorOrder.id,
          vendorId: vendorOrder.vendorId,
          status: vendorOrder.status,
          subtotal: serializeDecimal(vendorOrder.subtotal),
          commission: serializeDecimal(vendorOrder.commission),
          items: vendorOrder.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: serializeDecimal(item.unitPrice),
            totalPrice: serializeDecimal(item.totalPrice),
          })),
        })),
        statusHistory: order.statusHistory.map((entry) => ({
          id: entry.id,
          fromStatus: entry.fromStatus,
          toStatus: entry.toStatus,
          changedBy: entry.changedBy,
          note: entry.note,
          createdAt: entry.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/orders/[orderId] error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to retrieve order." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();

    const requestedStatus = body.status as OrderStatus;
    const changedBy =
      typeof body.changedBy === "string" && body.changedBy.trim()
        ? body.changedBy.trim()
        : "SYSTEM";

    const note =
      typeof body.note === "string" && body.note.trim()
        ? body.note.trim()
        : null;

    const validStatuses = [
      ...statusFlow,
      ...terminalStatuses,
    ] as string[];

    if (!validStatuses.includes(requestedStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order status.",
          allowedStatuses: validStatuses,
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (order.status === requestedStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Order is already in this status.",
        },
        { status: 400 }
      );
    }

    const currentIndex = statusFlow.indexOf(order.status);
    const nextIndex = statusFlow.indexOf(requestedStatus);

    const isTerminalTarget = terminalStatuses.includes(requestedStatus);
    const isTerminalCurrent = terminalStatuses.includes(order.status);

    if (isTerminalCurrent) {
      return NextResponse.json(
        {
          success: false,
          error: "A cancelled or refunded order cannot be moved to another status.",
        },
        { status: 400 }
      );
    }

    if (!isTerminalTarget) {
      const isNextStep = nextIndex === currentIndex + 1;

      if (!isNextStep) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status transition from ${order.status} to ${requestedStatus}.`,
            expectedNextStatus:
              statusFlow[currentIndex + 1] ?? null,
          },
          { status: 400 }
        );
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: requestedStatus,
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: requestedStatus,
        changedBy,
        note,
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error("PATCH /api/orders/[orderId] error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update order status." },
      { status: 500 }
    );
  }
}
