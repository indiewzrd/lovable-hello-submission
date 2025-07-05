import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow as formatDistanceToNowFn } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNowFn(dateObj, { addSuffix: true })
}
