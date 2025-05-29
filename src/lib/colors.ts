import {
	collection,
	getDocs,
	addDoc,
	deleteDoc,
	doc,
	updateDoc,
	serverTimestamp,
	DocumentReference,
	FirestoreError,
	writeBatch,
	enableNetwork,
	disableNetwork,
	increment,
	arrayUnion,
	arrayRemove,
} from 'firebase/firestore'
import { db } from './firebase'
import type { PantoneColor } from '../types'
import toast from 'react-hot-toast'
import { getFirestore } from 'firebase/firestore'

let isOffline = false

export async function setOfflineMode(offline: boolean) {
	if (offline === isOffline) return
	isOffline = offline
	try {
		if (offline) {
			await disableNetwork(db)
		} else {
			await enableNetwork(db)
		}
	} catch (error) {
		console.error('Error setting offline mode:', error)
	}
}

export async function getColors(): Promise<PantoneColor[]> {
	try {
		const colorsRef = collection(db, 'colors')
		const snapshot = await getDocs(colorsRef)
		return snapshot.docs
			.map(
				doc =>
					({
						id: doc.id,
						...doc.data(),
					} as PantoneColor)
			)
			.sort((a, b) => a.name.localeCompare(b.name))
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error(
				'Работаем в офлайн режиме. Изменения будут синхронизированы при восстановлении соединения.'
			)
			return []
		}
		throw new Error(`Failed to fetch colors: ${firestoreError.message}`)
	}
}

export async function saveColor(
	color: Omit<PantoneColor, 'id'>
): Promise<DocumentReference> {
	try {
		const colorsRef = collection(db, 'colors')
		const docRef = await addDoc(colorsRef, {
			name: color.name,
			alternativeName: color.alternativeName || '',
			hex: color.hex,
			recipe: color.recipe || '',
			customers: color.customers || [],
			inStock: color.inStock ?? true,
			isVerified: color.isVerified ?? false,
			category: color.category || 'Uncategorized',
			notes: color.notes || '',
			manager: color.manager || '',
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			labValues: color.labValues || null,
			labSource: color.labSource || null,
			additionalColors: color.additionalColors || [],
		})
		return docRef
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error('Изменения будут сохранены после восстановления соединения')
			throw new Error('offline')
		}
		throw error
	}
}

export async function updateColor(
	id: string,
	updates: Partial<PantoneColor>
): Promise<void> {
	try {
		const colorRef = doc(db, 'colors', id)
		const finalUpdates = {
			...updates,
			alternativeName: updates.alternativeName ?? '',
			notes: updates.notes ?? '',
			manager: updates.manager ?? '',
			updatedAt: serverTimestamp(),
			labValues: updates.labValues ?? null,
			labSource: updates.labSource ?? null,
			additionalColors: updates.additionalColors ?? [],
		}
		await updateDoc(colorRef, finalUpdates)
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error('Изменения будут сохранены после восстановления соединения')
			throw new Error('offline')
		}
		console.error('Error updating color:', error)
		throw error
	}
}

export async function deleteColor(colorId: string): Promise<void> {
	try {
		const colorRef = doc(db, 'colors', colorId)
		await deleteDoc(colorRef)
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error('Удаление будет выполнено после восстановления соединения')
			throw new Error('offline')
		}
		throw error
	}
}

export async function deleteColorsWithoutRecipes(): Promise<number> {
	try {
		const colorsRef = collection(db, 'colors')
		const snapshot = await getDocs(colorsRef)
		const batch = writeBatch(db)
		let deletedCount = 0

		snapshot.docs.forEach(doc => {
			const color = doc.data()
			if (!color.recipe || color.recipe.trim() === '') {
				batch.delete(doc.ref)
				deletedCount++
			}
		})

		if (deletedCount > 0) {
			await batch.commit()
		}

		return deletedCount
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error('Операция будет выполнена после восстановления соединения')
			throw new Error('offline')
		}
		throw error
	}
}

export const incrementUsageCount = async (colorId: string) => {
	try {
		const colorRef = doc(db, 'colors', colorId)
		await updateDoc(colorRef, {
			usageCount: increment(1),
		})
	} catch (error) {
		console.error('Error incrementing usage count:', error)
		throw error
	}
}

export const resetAllUsageCounts = async () => {
	try {
		const colorsRef = collection(db, 'colors')
		const snapshot = await getDocs(colorsRef)

		const batch = writeBatch(db)
		snapshot.docs.forEach(doc => {
			batch.update(doc.ref, { usageCount: 0 })
		})

		await batch.commit()
	} catch (error) {
		console.error('Error resetting usage counts:', error)
		throw error
	}
}

export const linkColors = async (colorId1: string, colorId2: string) => {
	const db = getFirestore()
	const batch = writeBatch(db)

	const color1Ref = doc(db, 'colors', colorId1)
	const color2Ref = doc(db, 'colors', colorId2)

	batch.update(color1Ref, {
		linkedColors: arrayUnion(colorId2),
	})

	batch.update(color2Ref, {
		linkedColors: arrayUnion(colorId1),
	})

	await batch.commit()
}

export const unlinkColors = async (colorId1: string, colorId2: string) => {
	const db = getFirestore()
	const batch = writeBatch(db)

	const color1Ref = doc(db, 'colors', colorId1)
	const color2Ref = doc(db, 'colors', colorId2)

	batch.update(color1Ref, {
		linkedColors: arrayRemove(colorId2),
	})

	batch.update(color2Ref, {
		linkedColors: arrayRemove(colorId1),
	})

	await batch.commit()
}

export async function updateColorTasks(
	id: string,
	tasks: Array<{ id: string; text: string; status: 'open' | 'done' }>
): Promise<void> {
	return updateColor(id, { tasks })
}
