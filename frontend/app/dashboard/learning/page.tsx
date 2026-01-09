import { redirect } from 'next/navigation';

export default function LearningPage() {
  redirect('/dashboard/intelligence?tab=learning');
}