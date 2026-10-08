import { prisma } from "./prisma";

export async function getProducts() {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      store: true,
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
