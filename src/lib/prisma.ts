import "dotenv/config";
import https from "node:https";
import dns from "node:dns/promises";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.fetchFunction = async (input, init = {}) => {
  const url = new URL(input);
  const address = await dns.lookup(url.hostname, { family: 4 });

  const headers = Object.fromEntries(
    new Headers(init.headers || {}).entries()
  );

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: address.address,
        port: 443,
        path: url.pathname + url.search,
        method: init.method || "GET",
        headers,
        servername: url.hostname,
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode,
              headers: res.headers,
            })
          );
        });
      }
    );

    req.on("error", reject);

    if (init.body) {
      req.write(init.body);
    }

    req.end();
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaNeonHttp({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
