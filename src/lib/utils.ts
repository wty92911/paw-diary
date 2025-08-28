import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function calculateAge(birthDate: Date | string): string {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  const ageInMs = today.getTime() - birth.getTime()
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24))
  
  if (ageInDays < 30) {
    return `${ageInDays} days old`
  } else if (ageInDays < 365) {
    const months = Math.floor(ageInDays / 30)
    return `${months} month${months > 1 ? 's' : ''} old`
  } else {
    const years = Math.floor(ageInDays / 365)
    const remainingMonths = Math.floor((ageInDays % 365) / 30)
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''} old`
    }
    return `${years}y ${remainingMonths}m old`
  }
}

export function formatWeight(weight?: number): string {
  if (!weight) return 'Unknown'
  return `${weight} kg`
}

export function getDefaultPetPhoto(): string {
  return '/default-pet.jpg'
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp']
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' }
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File must be a valid image format (JPEG, PNG, WebP, BMP)' }
  }
  
  return { isValid: true }
}