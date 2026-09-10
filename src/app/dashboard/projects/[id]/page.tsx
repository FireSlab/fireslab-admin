import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ProjectForm from '@/components/ProjectForm';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('fireslab_admin_token')?.value;

  const BACKEND_URL =
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const res = await fetch(`${BACKEND_URL}/projects/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    notFound();
  }

  const responseData = await res.json();
  const project = responseData.data;

  if (!project) {
    notFound();
  }

  const initialData = {
    id: project.id,
    title: project.title || '',
    slug: project.slug || '',
    location: project.location || '',
    category: project.category || 'hotel',
    product_used: project.product_used || '',
    product_id: project.product_id || '',
    image_url: project.image_url || '',
    description: project.description || '',
    client_name: project.client_name || '',
    completion_year: project.completion_year || new Date().getFullYear(),
    is_featured: project.is_featured ?? false,
    is_published: project.is_published ?? true,
    order_index: project.order_index || 0,
  };

  return <ProjectForm initialData={initialData} isEdit={true} />;
}
