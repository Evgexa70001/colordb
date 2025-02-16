import {
	collection,
	getDocs,
	addDoc,
	query,
	where,
	deleteDoc,
	doc,
	serverTimestamp,
	FirestoreError,
} from 'firebase/firestore'
import { db } from './firebase'
import { updateColor, getColors } from './colors'

export const UNCATEGORIZED = 'Без категории'

export async function getCategories(): Promise<string[]> {
	try {
		const categoriesRef = collection(db, 'categories')
		const snapshot = await getDocs(categoriesRef)
		const categories = snapshot.docs
			.map(doc => ({ id: doc.id, name: doc.data().name as string }))
			.filter(cat => cat.name && cat.name !== UNCATEGORIZED)
			.sort((a, b) => a.name.localeCompare(b.name))
			.map(cat => cat.name)

		return categories
	} catch (error) {
		const firestoreError = error as FirestoreError
		throw new Error(`Failed to fetch categories: ${firestoreError.message}`)
	}
}

export async function getCategoryByName(name: string) {
	try {
		const categoriesRef = collection(db, 'categories')
		const q = query(categoriesRef, where('name', '==', name))
		const snapshot = await getDocs(q)
		return snapshot.docs[0]?.id
	} catch (error) {
		const firestoreError = error as FirestoreError
		throw new Error(`Failed to fetch category: ${firestoreError.message}`)
	}
}

export async function addCategory(name: string): Promise<void> {
	if (!name.trim()) {
		throw new Error('Category name cannot be empty')
	}

	try {
		const categoriesRef = collection(db, 'categories')
		const q = query(categoriesRef, where('name', '==', name.trim()))
		const snapshot = await getDocs(q)

		if (!snapshot.empty) {
			throw new Error('Category already exists')
		}

		await addDoc(categoriesRef, {
			name: name.trim(),
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		})
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}
		const firestoreError = error as FirestoreError
		throw new Error(`Failed to add category: ${firestoreError.message}`)
	}
}

export async function deleteCategory(categoryName: string): Promise<void> {
	try {
		const categoryId = await getCategoryByName(categoryName)
		if (!categoryId) {
			throw new Error('Category not found')
		}

		const colors = await getColors()
		const affectedColors = colors.filter(
			color => color.category === categoryName
		)

		await Promise.all(
			affectedColors.map(color =>
				updateColor(color.id, {
					category: UNCATEGORIZED,
				})
			)
		)

		const categoryRef = doc(db, 'categories', categoryId)
		await deleteDoc(categoryRef)
	} catch (error) {
		const firestoreError = error as FirestoreError
		throw new Error(`Failed to delete category: ${firestoreError.message}`)
	}
}

export async function updateColorCategory(
	colorId: string,
	newCategory: string
): Promise<void> {
	try {
		// Проверяем существование категории
		if (newCategory !== UNCATEGORIZED) {
			const categories = await getCategories()
			if (!categories.includes(newCategory)) {
				throw new Error(`Category ${newCategory} does not exist`)
			}
		}

		// Обновляем цвет с новой категорией
		await updateColor(colorId, {
			category: newCategory,
		})
	} catch (error) {
		console.error('Error updating color category:', error)
		throw error
	}
}
