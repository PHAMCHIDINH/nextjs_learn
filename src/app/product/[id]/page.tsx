import ProductDetailPage from "@/modules/product/pages/ProductDetailPage";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default function Page({ params }: ProductPageProps) {
  return <ProductDetailPage params={params} />;
}
