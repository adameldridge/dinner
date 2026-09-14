// Client-side mirror of firestore.rules' allowlist. This only gives immediate
// UI feedback and signs out disallowed accounts right away — the actual
// enforcement is in firestore.rules. Keep both lists in sync.
export const ALLOWED_EMAILS: readonly string[] = [
  'adam@avari.technology',
  // TODO: this is Adam's own second account, used temporarily to test both
  // sides of the app. Replace with the partner's real email before real use.
  'adameldridge89@gmail.com',
]

export function isAllowedEmail(email: string | null | undefined): boolean {
  return !!email && ALLOWED_EMAILS.includes(email)
}
