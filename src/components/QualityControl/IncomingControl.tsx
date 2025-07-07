import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { ReferencePaint, NewPaintTest } from '@/types'
import ReferencePaints from './ReferencePaints'
import NewPaintTests from './NewPaintTests'

const IncomingControl: React.FC = () => {
	const { isDark } = useTheme()
	const { user } = useAuth()
	const [referencePaints, setReferencePaints] = useState<ReferencePaint[]>([])
	const [newPaintTests, setNewPaintTests] = useState<NewPaintTest[]>([])
	const [activeSection, setActiveSection] = useState<'reference' | 'tests'>(
		'reference'
	)

	// Загрузка данных из localStorage (в реальном приложении - из API)
	useEffect(() => {
		const savedReferencePaints = localStorage.getItem('referencePaints')
		const savedNewPaintTests = localStorage.getItem('newPaintTests')

		if (savedReferencePaints) {
			setReferencePaints(JSON.parse(savedReferencePaints))
		}
		if (savedNewPaintTests) {
			setNewPaintTests(JSON.parse(savedNewPaintTests))
		}
	}, [])

	// Сохранение данных в localStorage
	useEffect(() => {
		localStorage.setItem('referencePaints', JSON.stringify(referencePaints))
	}, [referencePaints])

	useEffect(() => {
		localStorage.setItem('newPaintTests', JSON.stringify(newPaintTests))
	}, [newPaintTests])

	const handleAddReferencePaint = (
		paint: Omit<ReferencePaint, 'id' | 'createdBy'>
	) => {
		const newPaint: ReferencePaint = {
			...paint,
			id: Date.now().toString(),
			createdBy: user?.uid || 'unknown',
		}
		setReferencePaints(prev => [...prev, newPaint])
	}

	const handleUpdateReferencePaint = (
		id: string,
		paint: Partial<ReferencePaint>
	) => {
		setReferencePaints(prev =>
			prev.map(p => (p.id === id ? { ...p, ...paint } : p))
		)
	}

	const handleDeleteReferencePaint = (id: string) => {
		setReferencePaints(prev => prev.filter(p => p.id !== id))
	}

	const handleAddNewPaintTest = (
		test: Omit<NewPaintTest, 'id' | 'testedAt' | 'testedBy'>
	) => {
		const newTest: NewPaintTest = {
			...test,
			id: Date.now().toString(),
			testedAt: new Date(),
			testedBy: user?.uid || 'unknown',
		}
		setNewPaintTests(prev => [...prev, newTest])
	}

	const handleDeleteNewPaintTest = (id: string) => {
		setNewPaintTests(prev => prev.filter(t => t.id !== id))
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
