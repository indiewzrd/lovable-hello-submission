import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to the landing page
  redirect('/(public)/(landing)')
}