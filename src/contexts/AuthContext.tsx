import React, { createContext, useContext, useState, useEffect } from 'react'
import {
	User,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut as firebaseSignOut,
	onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthContextType {
	user: User | null
	loading: boolean
	signIn: (email: string, password: string) => Promise<void>
	signUp: (email: string, password: string) => Promise<void>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, user => {
			setUser(user)
			setLoading(false)
		})

		return unsubscribe
	}, [])

	const signIn = async (email: string, password: string) => {
		await signInWithEmailAndPassword(auth, email, password)
	}

	const signUp = async (email: string, password: string) => {
		await createUserWithEmailAndPassword(auth, email, password)
	}

	const signOut = async () => {
		await firebaseSignOut(auth)
	}

	return (
		<AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
			{!loading && children}
		</AuthContext.Provider>
	)
}
