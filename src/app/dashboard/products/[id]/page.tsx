import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/ProductForm';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('fireslab_admin_token')?.value;

  const BACKEND_URL =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const res = await fetch(`${BACKEND_URL}/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    notFound();
  }

  const responseData = await res.json();
  const product = responseData.data;

  if (!product) {
    notFound();
  }

  // Format initialData for ProductForm
  const initialData = {
    id: product.id,
    category_id: product.category_id || product.categories?.id || '',
    card_title: product.card_title || '',
    slug: product.slug || '',
    card_badge: product.card_badge || '',
    card_description: product.card_description || '',
    card_image_url: product.card_image_url || '',
    gallery_images: Array.isArray(product.gallery_images) ? product.gallery_images : [],
    card_specs: Array.isArray(product.card_specs) ? product.card_specs : [],
    modal_title: product.modal_title || '',
    modal_tagline: product.modal_tagline || '',
    modal_description: product.modal_description || '',
    features: Array.isArray(product.features) ? product.features : [],
    materials: Array.isArray(product.materials) ? product.materials : [],
    capacities: Array.isArray(product.capacities) ? product.capacities : [],
    technical_specs: Array.isArray(product.technical_specs) ? product.technical_specs : [],
    applications: Array.isArray(product.applications) ? product.applications : [],
    faqs: Array.isArray(product.faqs) ? product.faqs : [],
    cta_text: product.cta_text || '',
    is_published: product.is_published ?? true,
    order_index: product.order_index || 0,
  };

  return <ProductForm initialData={initialData} isEdit={true} />;
}
