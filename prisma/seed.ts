import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const vendorUser = await prisma.user.upsert({
    where: {
      email: "demo-vendor@trilliar.test",
    },
    update: {},
    create: {
      email: "demo-vendor@trilliar.test",
      name: "Demo Vendor",
      phone: "+254700000000",
      role: "VENDOR",
      status: "ACTIVE",
      countryCode: "KE",
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: {
      userId: vendorUser.id,
    },
    update: {},
    create: {
      userId: vendorUser.id,
    },
  });

  const stores = [
    {
      name: "HomeStyle Store",
      slug: "homestyle-store",
      description: "Modern furniture and home décor.",
    },
    {
      name: "TechHub Store",
      slug: "techhub-store",
      description: "Smart technology and accessories.",
    },
    {
      name: "Urban Fashion",
      slug: "urban-fashion",
      description: "Fashion accessories and everyday style.",
    },
    {
      name: "Glow Beauty",
      slug: "glow-beauty",
      description: "Beauty and skincare products.",
    },
  ];

  const storeRecords = [];

  for (const storeData of stores) {
    const store = await prisma.store.upsert({
      where: {
        slug: storeData.slug,
      },
      update: {},
      create: {
        vendorId: vendor.id,
        ...storeData,
      },
    });

    storeRecords.push(store);
  }

  const categories = [
    {
      name: "Home & Living",
      slug: "home-living",
    },
    {
      name: "Electronics",
      slug: "electronics",
    },
    {
      name: "Fashion",
      slug: "fashion",
    },
    {
      name: "Beauty",
      slug: "beauty",
    },
  ];

  const categoryRecords = [];

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: {
        slug: categoryData.slug,
      },
      update: {},
      create: categoryData,
    });

    categoryRecords.push(category);
  }

  const products = [
    {
      name: "Modern Sofa Set",
      slug: "modern-sofa-set",
      sku: "HS-MSS-001",
      basePrice: 45000,
      storeIndex: 0,
      categoryIndex: 0,
      description: "A modern sofa set designed for stylish contemporary homes.",
      brand: "HomeStyle",
    },
    {
      name: "Smart Watch",
      slug: "smart-watch",
      sku: "TH-SW-001",
      basePrice: 3500,
      storeIndex: 1,
      categoryIndex: 1,
      description: "A modern smart watch with useful everyday features.",
      brand: "TechHub",
    },
    {
      name: "Leather Handbag",
      slug: "leather-handbag",
      sku: "UF-LH-001",
      basePrice: 4200,
      storeIndex: 2,
      categoryIndex: 2,
      description: "A stylish leather handbag suitable for everyday use.",
      brand: "Urban Fashion",
    },
    {
      name: "Skincare Collection",
      slug: "skincare-collection",
      sku: "GB-SC-001",
      basePrice: 2800,
      storeIndex: 3,
      categoryIndex: 3,
      description: "A curated skincare collection for everyday beauty routines.",
      brand: "Glow Beauty",
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: {
        slug: productData.slug,
      },
      update: {
        name: productData.name,
        description: productData.description,
        brand: productData.brand,
        basePrice: productData.basePrice,
        currency: "KES",
        status: "ACTIVE",
        vendorId: vendor.id,
        storeId: storeRecords[productData.storeIndex].id,
        categoryId: categoryRecords[productData.categoryIndex].id,
      },
      create: {
        name: productData.name,
        slug: productData.slug,
        sku: productData.sku,
        description: productData.description,
        brand: productData.brand,
        basePrice: productData.basePrice,
        currency: "KES",
        status: "ACTIVE",
        vendorId: vendor.id,
        storeId: storeRecords[productData.storeIndex].id,
        categoryId: categoryRecords[productData.categoryIndex].id,
      },
    });
  }

  console.log("Demo marketplace data seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
