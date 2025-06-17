import { redirect } from 'next/navigation';

export default function BlogIndexPage() {
  // Redirect to English posts by default
  redirect('/posts/en');
}

