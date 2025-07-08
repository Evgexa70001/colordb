import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDocs,
	query,
	orderBy,
	serverTimestamp,
	DocumentReference,
	FirestoreError,
} from 'firebase/firestore'
import { db } from './firebase'
import { ReferencePaint, NewPaintTest } from '@/types'
import { toast } from 'react-hot-toast'

// Функции для работы с эталонными красками
export async function saveReferencePaint(
	paint: Omit<ReferencePaint, 'id'>
): Promise<DocumentReference> {
	try {
		const referencePaintsRef = collection(db, 'referencePaints')
		const docRef = await addDoc(referencePaintsRef, {
			...paint,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		})
		return docRef
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error('Эталонная краска будет сохранена после восстановления соединения')
			throw new Error('offline')
		}
		throw error
	}
}

export async function updateReferencePaint(
	id: string,
	updates: Partial<ReferencePaint>
): Promise<void> {
	try {
		const paintRef = doc(db, 'referencePaints', id)
		await updateDoc(paintRef, {
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
		throw error
	}
}

export async function deleteReferencePaint(id: string): Promise<void> {
	try {
		const paintRef = doc(db, 'referencePaints', id)
		await deleteDoc(paintRef)
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

export async function getReferencePaints(): Promise<ReferencePaint[]> {
	try {
		const referencePaintsRef = collection(db, 'referencePaints')
		const q = query(referencePaintsRef, orderBy('createdAt', 'desc'))
		const querySnapshot = await getDocs(q)
		
		return querySnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		})) as ReferencePaint[]
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error('Данные будут загружены после восстановления соединения')
			throw new Error('offline')
		}
		throw error
	}
}

// Функции для работы с тестами новых красок
export async function saveNewPaintTest(
	test: Omit<NewPaintTest, 'id'>
): Promise<DocumentReference> {
	try {
		const newPaintTestsRef = collection(db, 'newPaintTests')
		const docRef = await addDoc(newPaintTestsRef, {
			...test,
			testedAt: serverTimestamp(),
			createdAt: serverTimestamp(),
		})
		return docRef
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error('Тест будет сохранен после восстановления соединения')
			throw new Error('offline')
		}
		throw error
	}
}

export async function updateNewPaintTest(
	id: string,
	updates: Partial<NewPaintTest>
): Promise<void> {
	try {
		const testRef = doc(db, 'newPaintTests', id)
		await updateDoc(testRef, {
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
		throw error
	}
}

export async function deleteNewPaintTest(id: string): Promise<void> {
	try {
		const testRef = doc(db, 'newPaintTests', id)
		await deleteDoc(testRef)
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

export async function getNewPaintTests(): Promise<NewPaintTest[]> {
	try {
		const newPaintTestsRef = collection(db, 'newPaintTests')
		const q = query(newPaintTestsRef, orderBy('testedAt', 'desc'))
		const querySnapshot = await getDocs(q)
		
		return querySnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		})) as NewPaintTest[]
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error('Данные будут загружены после восстановления соединения')
			throw new Error('offline')
		}
		throw error
	}
} 