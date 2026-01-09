import { redirect } from 'next/navigation';

export default function DataSourcesPage() {
  redirect('/dashboard/integrations?tab=files');
}