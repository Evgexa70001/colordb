import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { ReferencePaint, NewPaintTest } from '@/types'
import ReferencePaints from './ReferencePaints'
import NewPaintTests from './NewPaintTests'
import {
	saveReferencePaint,
	updateReferencePaint,
	deleteReferencePaint,
	getReferencePaints,
	saveNewPaintTest,
	deleteNewPaintTest,
	getNewPaintTests,
} from '@/lib/qualityControl'
import { toast } from 'react-hot-toast'

const IncomingControl: React.FC = () => {
	const { isDark } = useTheme()
	const { user } = useAuth()
	const [referencePaints, setReferencePaints] = useState<ReferencePaint[]>([])
	const [newPaintTests, setNewPaintTests] = useState<NewPaintTest[]>([])
	const [activeSection, setActiveSection] = useState<'reference' | 'tests'>(
		'reference'
	)
	const [loading, setLoading] = useState(true)

	// Загрузка данных из Firebase
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true)
				const [paints, tests] = await Promise.all([
					getReferencePaints(),
					getNewPaintTests(),
				])
				setReferencePaints(paints)
				setNewPaintTests(tests)
			} catch (error) {
				console.error('Error loading data:', error)
				if (error instanceof Error && error.message !== 'offline') {
					toast.error('Ошибка при загрузке данных')
				}
			} finally {
				setLoading(false)
			}
		}

		loadData()
	}, [])

	const handleAddReferencePaint = async (
		paint: Omit<ReferencePaint, 'id' | 'createdBy'>
	) => {
		try {
			const newPaint: Omit<ReferencePaint, 'id'> = {
				...paint,
				createdBy: user?.uid || 'unknown',
			}
			const docRef = await saveReferencePaint(newPaint)
			
			// Добавляем в локальное состояние с полученным ID
			const savedPaint: ReferencePaint = {
				...newPaint,
				id: docRef.id,
			}
			setReferencePaints(prev => [...prev, savedPaint])
			toast.success('Эталонная краска добавлена')
		} catch (error) {
			console.error('Error adding reference paint:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при добавлении эталонной краски')
			}
		}
	}

	const handleUpdateReferencePaint = async (
		id: string,
		paint: Partial<ReferencePaint>
	) => {
		try {
			await updateReferencePaint(id, paint)
			setReferencePaints(prev =>
				prev.map(p => (p.id === id ? { ...p, ...paint } : p))
			)
			toast.success('Эталонная краска обновлена')
		} catch (error) {
			console.error('Error updating reference paint:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при обновлении эталонной краски')
			}
		}
	}

	const handleDeleteReferencePaint = async (id: string) => {
		try {
			await deleteReferencePaint(id)
			setReferencePaints(prev => prev.filter(p => p.id !== id))
			toast.success('Эталонная краска удалена')
		} catch (error) {
			console.error('Error deleting reference paint:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при удалении эталонной краски')
			}
		}
	}

	const handleAddNewPaintTest = async (
		test: Omit<NewPaintTest, 'id' | 'testedAt' | 'testedBy'>
	) => {
		try {
			const newTest: Omit<NewPaintTest, 'id'> = {
				...test,
				testedAt: new Date(),
				testedBy: user?.uid || 'unknown',
			}
			const docRef = await saveNewPaintTest(newTest)
			
			// Добавляем в локальное состояние с полученным ID
			const savedTest: NewPaintTest = {
				...newTest,
				id: docRef.id,
			}
			setNewPaintTests(prev => [...prev, savedTest])
			toast.success('Тест новой краски добавлен')
		} catch (error) {
			console.error('Error adding new paint test:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при добавлении теста')
			}
		}
	}

	const handleDeleteNewPaintTest = async (id: string) => {
		try {
			await deleteNewPaintTest(id)
			setNewPaintTests(prev => prev.filter(t => t.id !== id))
			toast.success('Тест удален')
		} catch (error) {
			console.error('Error deleting new paint test:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при удалении теста')
			}
		}
	}

	const getStats = () => {
		const totalReferencePaints = referencePaints.length
		const activeReferencePaints = referencePaints.filter(
			p => p.status === 'active'
		).length
		const totalTests = newPaintTests.length
		const passedTests = newPaintTests.filter(t => t.status === 'passed').length
		const failedTests = newPaintTests.filter(t => t.status === 'failed').length

		return {
			totalReferencePaints,
			activeReferencePaints,
			totalTests,
			passedTests,
			failedTests,
		}
	}

	const stats = getStats()

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
					<div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
						Загрузка данных...
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* Статистика */}
			<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
				<div
					className={`p-4 rounded-lg border ${
						isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
					} shadow-sm`}
				>
					<div
						className={`text-2xl font-bold ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						{stats.totalReferencePaints}
					</div>
					<div
						className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
					>
						Всего эталонов
					</div>
				</div>
				<div
					className={`p-4 rounded-lg border ${
						isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
					} shadow-sm`}
				>
					<div
						className={`text-2xl font-bold ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						{stats.activeReferencePaints}
					</div>
					<div
						className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
					>
						Активных эталонов
					</div>
				</div>
				<div
					className={`p-4 rounded-lg border ${
						isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
					} shadow-sm`}
				>
					<div
						className={`text-2xl font-bold ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						{stats.totalTests}
					</div>
					<div
						className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
					>
						Всего тестов
					</div>
				</div>
				<div
					className={`p-4 rounded-lg border ${
						isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
					} shadow-sm`}
				>
					<div
						className={`text-2xl font-bold ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						{stats.passedTests}
					</div>
					<div
						className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
					>
						Прошедших тестов
					</div>
				</div>
			</div>

			{/* Переключатель секций */}
			<div
				className={`rounded-xl border ${
					isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
				} shadow-sm`}
			>
				<div className='border-b border-gray-200 dark:border-gray-700'>
					<div className='flex'>
						<button
							onClick={() => setActiveSection('reference')}
							className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
								activeSection === 'reference'
									? 'border-blue-500 text-blue-600 dark:text-blue-400'
									: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
							}`}
						>
							Эталонные краски
						</button>
						<button
							onClick={() => setActiveSection('tests')}
							className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
								activeSection === 'tests'
									? 'border-green-500 text-green-600 dark:text-green-400'
									: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
							}`}
						>
							Тестирование новых красок
						</button>
					</div>
				</div>

				<div className='p-6'>
					{activeSection === 'reference' ? (
						<ReferencePaints
							referencePaints={referencePaints}
							onAdd={handleAddReferencePaint}
							onUpdate={handleUpdateReferencePaint}
							onDelete={handleDeleteReferencePaint}
						/>
					) : (
						<NewPaintTests
							referencePaints={referencePaints}
							newPaintTests={newPaintTests}
							onAdd={handleAddNewPaintTest}
							onDelete={handleDeleteNewPaintTest}
						/>
					)}
				</div>
			</div>
		</div>
	)
}

export default IncomingControl
