import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import PrivateRoute from './components/PrivateRoute'
import ShelvesView from './pages/ShelvesView'
import QualityControl from './pages/QualityControl'
import ColorVisualization from './pages/ColorVisualization'
import Header from './components/Header'

function App() {
	return (
		<Router>
			<ThemeProvider>
				<AuthProvider>
					<Routes>
						<Route path='/signup' element={<Signup />} />
						<Route path='/login' element={<Login />} />
						<Route
							path='*'
							element={
								<>
									<Header />
									<Routes>
										<Route
											path='/'
											element={
												<PrivateRoute>
													<Dashboard />
												</PrivateRoute>
											}
										/>
										<Route
											path='/shelves'
											element={
												<PrivateRoute>
													<ShelvesView />
												</PrivateRoute>
											}
										/>
										<Route
											path='/quality'
											element={
												<PrivateRoute>
													<QualityControl />
												</PrivateRoute>
											}
										/>
										<Route
											path='/visualization'
											element={
												<PrivateRoute>
													<ColorVisualization />
												</PrivateRoute>
											}
										/>
										<Route path='*' element={<Navigate to='/' />} />
									</Routes>
								</>
							}
						/>
					</Routes>
					<Toaster position='bottom-right' />
				</AuthProvider>
			</ThemeProvider>
		</Router>
	)
}

export default App
