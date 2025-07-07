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
	query,
	orderBy,
	where,
	limit,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
	ColorDeviation,
	ColorCorrection,
	ColorCreationReason,
} from '../types'
import toast from 'react-hot-toast'

export async function getDeviations(): Promise<ColorDeviation[]> {
	try {
		const deviationsRef = collection(db, 'deviations')
		const q = query(deviationsRef, orderBy('detectedAt', 'desc'))
		const snapshot = await getDocs(q)

		return snapshot.docs.map(
			doc =>
				({
					id: doc.id,
					...doc.data(),
					detectedAt: doc.data().detectedAt?.toDate() || new Date(),
					resolvedAt: doc.data().resolvedAt?.toDate() || null,
				} as ColorDeviation)
		)
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error(
				'Работаем в офлайн режиме. Данные будут загружены при восстановлении соединения.'
			)
			return []
		}
		throw new Error(`Failed to fetch deviations: ${firestoreError.message}`)
	}
}

export async function saveDeviation(
	deviation: Omit<ColorDeviation, 'id'>
): Promise<DocumentReference> {
	try {
		const deviationsRef = collection(db, 'deviations')
		const docRef = await addDoc(deviationsRef, {
			...deviation,
			detectedAt: serverTimestamp(),
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
			toast.error('Отклонение будет сохранено после восстановления соединения')
			throw new Error('offline')
		}
		throw error
	}
}

export async function updateDeviation(
	id: string,
	updates: Partial<ColorDeviation>
): Promise<void> {
	try {
		const deviationRef = doc(db, 'deviations', id)
		await updateDoc(deviationRef, {
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

export async function deleteDeviation(id: string): Promise<void> {
	try {
		const deviationRef = doc(db, 'deviations', id)
		await deleteDoc(deviationRef)
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

// Функции для работы с корректировками
export async function getCorrections(): Promise<ColorCorrection[]> {
	try {
		const correctionsRef = collection(db, 'corrections')
		const q = query(correctionsRef, orderBy('appliedAt', 'desc'))
		const snapshot = await getDocs(q)

		return snapshot.docs.map(
			doc =>
				({
					id: doc.id,
					...doc.data(),
					appliedAt: doc.data().appliedAt?.toDate() || new Date(),
				} as ColorCorrection)
		)
	} catch (error) {
		console.error('Error fetching corrections:', error)
		return []
	}
}

export async function saveCorrection(
	correction: Omit<ColorCorrection, 'id'>
): Promise<DocumentReference> {
	try {
		const correctionsRef = collection(db, 'corrections')
		const docRef = await addDoc(correctionsRef, {
			...correction,
			appliedAt: serverTimestamp(),
			createdAt: serverTimestamp(),
		})
		return docRef
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error(
				'Корректировка будет сохранена после восстановления соединения'
			)
			throw new Error('offline')
		}
		throw error
	}
}

// Получение отклонений по конкретному цвету
export async function getDeviationsByColor(
	colorId: string
): Promise<ColorDeviation[]> {
	try {
		const deviationsRef = collection(db, 'deviations')
		const q = query(
			deviationsRef,
			where('colorId', '==', colorId),
			orderBy('detectedAt', 'desc')
		)
		const snapshot = await getDocs(q)

		return snapshot.docs.map(
			doc =>
				({
					id: doc.id,
					...doc.data(),
					detectedAt: doc.data().detectedAt?.toDate() || new Date(),
					resolvedAt: doc.data().resolvedAt?.toDate() || null,
				} as ColorDeviation)
		)
	} catch (error) {
		console.error('Error fetching deviations by color:', error)
		return []
	}
}

// Получение последних отклонений
export async function getRecentDeviations(
	limitCount: number = 10
): Promise<ColorDeviation[]> {
	try {
		const deviationsRef = collection(db, 'deviations')
		const q = query(
			deviationsRef,
			orderBy('detectedAt', 'desc'),
			limit(limitCount)
		)
		const snapshot = await getDocs(q)

		return snapshot.docs.map(
			doc =>
				({
					id: doc.id,
					...doc.data(),
					detectedAt: doc.data().detectedAt?.toDate() || new Date(),
					resolvedAt: doc.data().resolvedAt?.toDate() || null,
				} as ColorDeviation)
		)
	} catch (error) {
		console.error('Error fetching recent deviations:', error)
		return []
	}
}

// Функции для работы с причинами создания цветов
export async function getColorCreationReasons(): Promise<
	ColorCreationReason[]
> {
	try {
		const reasonsRef = collection(db, 'colorCreationReasons')
		const q = query(reasonsRef, orderBy('createdAt', 'desc'))
		const snapshot = await getDocs(q)

		return snapshot.docs.map(
			doc =>
				({
					id: doc.id,
					...doc.data(),
					createdAt: doc.data().createdAt?.toDate() || new Date(),
					approvedAt: doc.data().approvedAt?.toDate() || null,
					completionDate: doc.data().completionDate?.toDate() || null,
				} as ColorCreationReason)
		)
	} catch (error) {
		const firestoreError = error as FirestoreError
		if (
			firestoreError.code === 'failed-precondition' ||
			firestoreError.code === 'unavailable'
		) {
			toast.error(
				'Работаем в офлайн режиме. Данные будут загружены при восстановлении соединения.'
			)
			return []
		}
		throw new Error(
			`Failed to fetch color creation reasons: ${firestoreError.message}`
		)
	}
}

export async function saveColorCreationReason(
	reason: Omit<ColorCreationReason, 'id'>
): Promise<DocumentReference> {
	try {
		const reasonsRef = collection(db, 'colorCreationReasons')
		const docRef = await addDoc(reasonsRef, {
			...reason,
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
			toast.error('Причина будет сохранена после восстановления соединения')
			throw new Error('offline')
		}
		throw error
	}
}

export async function updateColorCreationReason(
	id: string,
	updates: Partial<ColorCreationReason>
): Promise<void> {
	try {
		const reasonRef = doc(db, 'colorCreationReasons', id)
		await updateDoc(reasonRef, {
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

export async function deleteColorCreationReason(id: string): Promise<void> {
	try {
		const reasonRef = doc(db, 'colorCreationReasons', id)
		await deleteDoc(reasonRef)
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

export async function getColorCreationReasonsByColor(
	colorId: string
): Promise<ColorCreationReason[]> {
	try {
		const reasonsRef = collection(db, 'colorCreationReasons')
		const q = query(
			reasonsRef,
			where('colorId', '==', colorId),
			orderBy('createdAt', 'desc')
		)
		const snapshot = await getDocs(q)

		return snapshot.docs.map(
			doc =>
				({
					id: doc.id,
					...doc.data(),
					createdAt: doc.data().createdAt?.toDate() || new Date(),
					approvedAt: doc.data().approvedAt?.toDate() || null,
					completionDate: doc.data().completionDate?.toDate() || null,
				} as ColorCreationReason)
		)
	} catch (error) {
		console.error('Error fetching color creation reasons by color:', error)
		return []
	}
}
