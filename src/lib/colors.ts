import {
	collection,
	getDocs,
	addDoc,
	deleteDoc,
	doc,
	updateDoc,
	getDoc,
	serverTimestamp,
	DocumentReference,
	FirestoreError,
	writeBatch,
	enableNetwork,
	disableNetwork,
	increment,
	arrayUnion,
	arrayRemove,
	deleteField,
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
			inStock: color.inStock ?? true,
			isVerified: color.isVerified ?? false,
			category: color.category || 'Uncategorized',
			notes: color.notes || '',
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

		// Если обновляется рецепт, нужно сохранить историю
		if (updates.recipe !== undefined) {
			// Получаем текущие данные цвета
			const currentDoc = await getDoc(colorRef)
			if (currentDoc.exists()) {
				const currentData = currentDoc.data() as PantoneColor
				const currentRecipe = currentData.recipe

				// Если у цвета есть текущий рецепт и он отличается от нового
				if (currentRecipe && currentRecipe !== updates.recipe) {
					// Добавляем текущий рецепт в историю
					const historyEntry = {
						recipe: currentRecipe,
						updatedAt: new Date().toISOString(),
						updatedBy: 'Система',
					}

					// Получаем текущую историю или создаем пустой массив
					const currentHistory = currentData.recipeHistory || []

					// Добавляем новую запись в начало массива
					const newHistory = [historyEntry, ...currentHistory]

					// Ограничиваем до 3 записей (удаляем старые)
					if (newHistory.length > 3) {
						newHistory.splice(3)
					}

					// Добавляем историю к обновлениям
					updates.recipeHistory = newHistory
				}
			}
		}

		await updateDoc(colorRef, {
			...updates,
			updatedAt: serverTimestamp(),
		})
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

export const clearAllShelfLocations = async () => {
	try {
		const colorsRef = collection(db, 'colors')
		const snapshot = await getDocs(colorsRef)
		const batch = writeBatch(db)
		snapshot.docs.forEach(doc => {
			batch.update(doc.ref, { shelfLocation: deleteField() })
		})
		await batch.commit()
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
