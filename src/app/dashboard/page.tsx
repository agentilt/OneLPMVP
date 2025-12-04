import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Temporarily route dashboard traffic to analytics until a dedicated dashboard is implemented.
  redirect('/analytics')
}
