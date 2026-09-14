export function actorName(user: { displayName: string | null; email: string | null }): string {
  return user.displayName || user.email || 'Someone'
}
