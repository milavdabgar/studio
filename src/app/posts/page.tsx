import { redirect } from 'next/navigation';

export function generateMetadata() {
  redirect('/posts/en');
}

export default function BlogIndexPage() {
  // This component won't render because of the redirect in generateMetadata
  return null;
}

