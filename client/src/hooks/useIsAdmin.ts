import { useUser } from '@clerk/clerk-react'

// Admin email whitelist - should match server-side configuration
const ADMIN_EMAILS = ['kevinfremon@gmail.com']

export function useIsAdmin(): boolean {
  const { user } = useUser()

  // Check if current user is an admin based on their email
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  return userEmail ? ADMIN_EMAILS.includes(userEmail) : false
}
