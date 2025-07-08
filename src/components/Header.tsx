import { useLocation, Link } from 'react-router-dom'
import { Sun, Moon, LogOut, Menu, ShieldAlert, Palette, Layers, Map, Target } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { useAuth } from '@contexts/AuthContext'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
	onSidebarOpen?: () => void
}

export default function Header({ onSidebarOpen }: HeaderProps) {
	const { isDark, toggleTheme } = useTheme()
	const { user, signOut } = useAuth()
	const location = useLocation()

	const navigationItems = [
		{
			path: '/',
			label: 'Цвета',
			icon: Palette,
			gradient: 'from-blue-500 to-indigo-600',
			activeColor: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
			hoverColor: 'hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
		},
		{
			path: '/shelves',
			label: 'Стеллажи',
			icon: Layers,
			gradient: 'from-emerald-500 to-teal-600',
			activeColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
			hoverColor: 'hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
		},
		{
			path: '/visualization',
			label: '2D карта',
			icon: Map,
			gradient: 'from-purple-500 to-violet-600',
			activeColor: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
			hoverColor: 'hover:text-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
		},
		{
			path: '/quality',
			label: 'Качество',
			icon: Target,
			gradient: 'from-orange-500 to-red-600',
			activeColor: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
			hoverColor: 'hover:text-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/10'
		}
	]

	return (
		<>
			<header
				className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
					isDark
						? 'bg-gray-900/90 backdrop-blur-xl border-gray-800/50'
						: 'bg-white/90 backdrop-blur-xl border-gray-200/50'
				} border-b shadow-lg shadow-black/5`}
			>
				<div className='max-w-7xl mx-auto'>
					<div className='flex items-center justify-between h-16 px-4 sm:px-6'>
						{/* Левая часть */}
						<div className='flex items-center gap-4'>
							{onSidebarOpen && (
								<button
									onClick={onSidebarOpen}
									className={`lg:hidden p-2.5 rounded-xl transition-all duration-200 ${
										isDark
											? 'hover:bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:scale-105'
											: 'hover:bg-gray-100/80 text-gray-600 hover:text-gray-900 hover:scale-105'
									} active:scale-95`}
								>
									<Menu className='w-5 h-5' />
								</button>
							)}

							<div className='flex items-center gap-6'>
								{/* Логотип */}
								<div className='flex items-center gap-3'>
									<div className={`w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-500/30'}`}>
										<Palette className='w-4 h-4 text-white' />
									</div>
									<h1
										className={`text-lg sm:text-xl lg:text-2xl font-bold ${
											isDark ? 'text-white' : 'text-gray-900'
										} flex items-center gap-2`}
									>
										<span className='bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent'>
											ColorDB
										</span>
										{user?.isAdmin && (
											<div className='flex items-center'>
												<ShieldAlert
													className={`w-5 h-5 ${
														isDark
															? 'text-blue-400 animate-pulse'
															: 'text-blue-600 animate-pulse'
													}`}
												/>
											</div>
										)}
									</h1>
								</div>

								{/* Десктопная навигация */}
								<nav className='hidden lg:flex items-center gap-2'>
									{navigationItems.map((item) => {
										const Icon = item.icon
										const isActive = location.pathname === item.path
										
										return (
											<Link
												key={item.path}
												to={item.path}
												className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
													isActive
														? item.activeColor
														: isDark
														? `text-gray-300 ${item.hoverColor.replace('dark:', '')}`
														: `text-gray-700 ${item.hoverColor.split(' ')[0]} ${item.hoverColor.split(' ')[1]}`
												} hover:scale-105 active:scale-95`}
											>
												<Icon className={`w-4 h-4 transition-transform duration-200 ${
													isActive ? 'scale-110' : 'group-hover:scale-110'
												}`} />
												<span>{item.label}</span>
												{isActive && (
													<div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-r ${item.gradient} rounded-full`} />
												)}
											</Link>
										)
									})}
								</nav>
							</div>
						</div>

						{/* Правая часть */}
						<div className='flex items-center gap-3'>
							<button
								onClick={toggleTheme}
								className={`p-2.5 rounded-xl transition-all duration-200 group ${
									isDark
										? 'hover:bg-gray-800/60 text-gray-400 hover:text-gray-200'
										: 'hover:bg-gray-100/80 text-gray-600 hover:text-gray-900'
								} hover:scale-105 active:scale-95`}
							>
								{isDark ? (
									<Sun className='w-5 h-5 transform group-hover:rotate-12 transition-transform duration-200' />
								) : (
									<Moon className='w-5 h-5 transform group-hover:-rotate-12 transition-transform duration-200' />
								)}
							</button>

							<div className={`h-6 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />

							<Button
								leftIcon={<LogOut className='w-4 h-4' />}
								onClick={() => signOut()}
								variant='outline'
								className='hover:scale-105 active:scale-95 transition-transform duration-200'
							>
								<span className='hidden sm:inline'>Выйти</span>
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Мобильная навигация */}
			<div className='lg:hidden fixed top-16 left-0 right-0 z-20'>
				<div
					className={`flex overflow-x-auto px-4 py-3 gap-2 ${
						isDark
							? 'bg-gray-900/95 backdrop-blur-xl border-gray-800/50'
							: 'bg-white/95 backdrop-blur-xl border-gray-200/50'
					} border-b shadow-sm`}
					style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
				>
					{navigationItems.map((item) => {
						const Icon = item.icon
						const isActive = location.pathname === item.path
						
						return (
							<Link
								key={item.path}
								to={item.path}
								className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
									isActive
										? item.activeColor
										: isDark
										? `text-gray-300 ${item.hoverColor.replace('dark:', '')}`
										: `text-gray-700 ${item.hoverColor.split(' ')[0]} ${item.hoverColor.split(' ')[1]}`
								} active:scale-95`}
							>
								<Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
								<span>{item.label}</span>
							</Link>
						)
					})}
				</div>
			</div>

			{/* Спейсер для фиксированного хедера */}
			<div className='h-16 lg:h-16' />
			<div className='lg:hidden h-16' />
		</>
	)
}
