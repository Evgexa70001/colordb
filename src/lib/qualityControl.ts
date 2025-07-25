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
		
		// Очищаем undefined значения перед сохранением
		const cleanPaint = { ...paint }
		if (cleanPaint.notes === undefined) {
			delete cleanPaint.notes
		}
		
		const docRef = await addDoc(referencePaintsRef, {
			...cleanPaint,
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
		
		// Очищаем undefined значения перед обновлением
		const cleanUpdates = { ...updates }
		if (cleanUpdates.notes === undefined) {
			delete cleanUpdates.notes
		}
		
		await updateDoc(paintRef, {
			...cleanUpdates,
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
		
		// Очищаем undefined значения перед сохранением
		const cleanTest = { ...test }
		if (cleanTest.notes === undefined) {
			delete cleanTest.notes
		}
		if (cleanTest.attachments === undefined) {
			delete cleanTest.attachments
		}
		if (cleanTest.referencePaintId === undefined) {
			delete cleanTest.referencePaintId
		}
		if (cleanTest.deltaE2000 === undefined) {
			delete cleanTest.deltaE2000
		}
		
		const docRef = await addDoc(newPaintTestsRef, {
			...cleanTest,
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
		
		// Очищаем undefined значения перед обновлением
		const cleanUpdates = { ...updates }
		if (cleanUpdates.notes === undefined) {
			delete cleanUpdates.notes
		}
		if (cleanUpdates.attachments === undefined) {
			delete cleanUpdates.attachments
		}
		if (cleanUpdates.referencePaintId === undefined) {
			delete cleanUpdates.referencePaintId
		}
		if (cleanUpdates.deltaE2000 === undefined) {
			delete cleanUpdates.deltaE2000
		}
		
		await updateDoc(testRef, {
			...cleanUpdates,
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