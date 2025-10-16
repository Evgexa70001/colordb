import { useEffect } from 'react'
import { getColors, setOfflineMode } from '@lib/colors'
import { getCategories } from '@lib/categories'
import toast from 'react-hot-toast'

interface UseDashboardDataProps {
	setColors: (colors: any[]) => void
	setCategories: (categories: string[]) => void
	setIsLoading: (loading: boolean) => void
}

export const useDashboardData = ({
	setColors,
	setCategories,
	setIsLoading,
}: UseDashboardDataProps) => {
	const loadData = async () => {
		try {
			setIsLoading(true)
			const [fetchedColors, fetchedCategories] = await Promise.all([
				getColors(),
				getCategories(),
			])
			setColors(fetchedColors)
			setCategories(fetchedCategories)
		} catch (error) {
			console.error('Error loading data:', error)
			toast.error('Ошибка при загрузке данных')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	useEffect(() => {
		const handleOnline = async () => {
			try {
				await setOfflineMode(false)
				toast.success('Подключение восстановлено')
				loadData()
			} catch (error) {
				console.error('Error handling online state:', error)
			}
		}

		const handleOffline = async () => {
			try {
				await setOfflineMode(true)
				toast.error('Работаем в офлайн режиме')
			} catch (error) {
				console.error('Error handling offline state:', error)
			}
		}

		if (!navigator.onLine) {
			handleOffline()
		}

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

	return { loadData }
}
