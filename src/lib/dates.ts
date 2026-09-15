export function toDateId(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateId(dateId: string): Date {
  const [year, month, day] = dateId.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function startOfWeek(date: Date): Date {
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const result = addDays(date, diffToMonday)
  result.setHours(0, 0, 0, 0)
  return result
}

export function formatDayLabel(dateId: string): string {
  return parseDateId(dateId).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatFullDayLabel(dateId: string): string {
  return parseDateId(dateId).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
