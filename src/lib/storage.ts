import {
	collection,
	doc,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { PantoneColor } from '../types'

export async function getColors(): Promise<PantoneColor[]> {
	const colorsRef = collection(db, 'colors')
	const snapshot = await getDocs(colorsRef)
	return snapshot.docs.map(
		doc =>
			({
				id: doc.id,
				...doc.data(),
				customers: doc.data().customers || [],
				recipe: doc.data().recipe || '',
				inStock: doc.data().inStock ?? true,
			} as PantoneColor)
	)
}

export async function saveColor(
	color: Omit<PantoneColor, 'id'>
): Promise<void> {
	const colorsRef = collection(db, 'colors')
	await addDoc(colorsRef, {
		...color,
		recipe: color.recipe || '',
		customers: color.customers || [],
		inStock: color.inStock ?? true,
		createdAt: serverTimestamp(),
	})
}

export async function updateColor(color: PantoneColor): Promise<void> {
	const colorRef = doc(db, 'colors', color.id)
	await updateDoc(colorRef, {
		...color,
		recipe: color.recipe || '',
		customers: color.customers || [],
		inStock: color.inStock ?? true,
		updatedAt: serverTimestamp(),
	})
}

export async function deleteColor(colorId: string): Promise<void> {
	const colorRef = doc(db, 'colors', colorId)
	await deleteDoc(colorRef)
}

export async function getCategories(): Promise<string[]> {
	const categoriesRef = collection(db, 'categories')
	const snapshot = await getDocs(categoriesRef)
	return snapshot.docs.map(doc => doc.data().name as string)
}

export async function saveCategory(name: string): Promise<void> {
	const categoriesRef = collection(db, 'categories')
	const q = query(categoriesRef, where('name', '==', name))
	const snapshot = await getDocs(q)

	if (snapshot.empty) {
		await addDoc(categoriesRef, {
			name,
			createdAt: serverTimestamp(),
		})
	}
}
