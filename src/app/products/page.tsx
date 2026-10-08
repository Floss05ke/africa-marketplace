import { getProducts } from "../../lib/products";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const products = await getProducts();

  const productData = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: `${product.currency} ${Number(product.basePrice).toLocaleString("en-KE")}`,
    store: product.store.name,
    category: product.category.name,
  }));

  return <ProductsClient products={productData} />;
}
