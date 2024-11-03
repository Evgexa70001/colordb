import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Signup() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const { signUp } = useAuth()

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()

		if (password !== confirmPassword) {
			return setError('Passwords do not match')
		}

		if (password.length < 6) {
			return setError('Password must be at least 6 characters')
		}

		try {
			setError('')
			setLoading(true)
			await signUp(email, password)
			navigate('/login')
		} catch (err) {
			setError('Failed to create account')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<div className='sm:mx-auto sm:w-full sm:max-w-md'>
				<div className='flex justify-center'>
					<UserPlus className='w-12 h-12 text-blue-600' />
				</div>
				<h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
					Create your account
				</h2>
			</div>

			<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
				<div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					{error && (
						<div className='mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-gray-700'
							>
								Email address
							</label>
							<input
								id='email'
								type='email'
								required
								value={email}
								onChange={e => setEmail(e.target.value)}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500'
							/>
						</div>

						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700'
							>
								Password
							</label>
							<input
								id='password'
								type='password'
								required
								value={password}
								onChange={e => setPassword(e.target.value)}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500'
							/>
						</div>

						<div>
							<label
								htmlFor='confirm-password'
								className='block text-sm font-medium text-gray-700'
							>
								Confirm Password
							</label>
							<input
								id='confirm-password'
								type='password'
								required
								value={confirmPassword}
								onChange={e => setConfirmPassword(e.target.value)}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500'
							/>
						</div>

						<button
							type='submit'
							disabled={loading}
							className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
						>
							{loading ? 'Creating account...' : 'Sign up'}
						</button>
					</form>

					<div className='mt-6'>
						<div className='relative'>
							<div className='absolute inset-0 flex items-center'>
								<div className='w-full border-t border-gray-300' />
							</div>
							<div className='relative flex justify-center text-sm'>
								<span className='px-2 bg-white text-gray-500'>
									Already have an account?
								</span>
							</div>
						</div>

						<div className='mt-6'>
							<Link
								to='/login'
								className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100'
							>
								Sign in
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
