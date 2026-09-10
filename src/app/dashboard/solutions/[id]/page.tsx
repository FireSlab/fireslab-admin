import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import SolutionForm from '@/components/SolutionForm';

interface EditSolutionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSolutionPage({ params }: EditSolutionPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('fireslab_admin_token')?.value;

  const BACKEND_URL =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const res = await fetch(`${BACKEND_URL}/solutions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    notFound();
  }

  const responseData = await res.json();
  const solution = responseData.data;

  if (!solution) {
    notFound();
  }

  const initialData = {
    id: solution.id,
    category_tag: solution.category_tag || '',
    title_line1: solution.title_line1 || '',
    title_line2: solution.title_line2 || '',
    description: solution.description || '',
    image_url: solution.image_url || '',
    features: Array.isArray(solution.features) ? solution.features : [],
    linked_product_id: solution.linked_product_id || '',
    is_published: solution.is_published ?? true,
    order_index: solution.order_index || 0,
  };

  return <SolutionForm initialData={initialData} isEdit={true} />;
}
