import type { PantoneColor } from '@/types'

export const getTimestamp = (color: PantoneColor): number => {
	if (!color.createdAt) return 0

	// Handle Firestore Timestamp
	if (typeof color.createdAt === 'object' && 'seconds' in color.createdAt) {
		const timestamp = color.createdAt as {
			seconds: number
			nanoseconds: number
		}
		return timestamp.seconds * 1000
	}

	// Handle string date
	return new Date(color.createdAt).getTime()
}
