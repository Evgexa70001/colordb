import { useState } from 'react'
import { Printer, X, Download } from 'lucide-react'
import { Button } from '@components/ui/Button'
import { useTheme } from '@contexts/ThemeContext'

interface Color {
	id: string
	name: string
	alternativeName?: string
	hex: string
	usageCount?: number
}

interface PrintPreviewProps {
	colors: Color[]
	onClose: () => void
	onPrint: () => void
}

export default function PrintPreview({ colors, onClose, onPrint }: PrintPreviewProps) {
	const { isDark } = useTheme()
	const [isPrinting, setIsPrinting] = useState(false)

	const handlePrint = async () => {
		setIsPrinting(true)
		try {
			await onPrint()
		} finally {
			setIsPrinting(false)
		}
	}

	const handleDownload = () => {
		const printContent = generatePrintContent(colors)
		const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `colors_list_${new Date().toISOString().split('T')[0]}.html`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	return (
		<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className={`max-w-4xl w-full max-h-[90vh] rounded-xl shadow-xl ${
				isDark ? 'bg-gray-800' : 'bg-white'
			}`}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
					<h2 className={`text-lg font-semibold ${
						isDark ? 'text-white' : 'text-gray-900'
					}`}>
						Предварительный просмотр печати
					</h2>
					<div className="flex items-center space-x-2">
						<Button
							variant="secondary"
							size="sm"
							leftIcon={<Download className="w-4 h-4" />}
							onClick={handleDownload}
						>
							Скачать
						</Button>
						<Button
							leftIcon={<Printer className="w-4 h-4" />}
							size="sm"
							onClick={handlePrint}
							disabled={isPrinting}
						>
							{isPrinting ? 'Печать...' : 'Печать'}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							leftIcon={<X className="w-4 h-4" />}
							onClick={onClose}
						>
							Закрыть
						</Button>
					</div>
				</div>

				{/* Content */}
				<div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
					<div 
						className="print-content"
						dangerouslySetInnerHTML={{ 
							__html: generatePrintContent(colors) 
						}}
					/>
				</div>
			</div>
		</div>
	)
}

function generatePrintContent(colors: Color[]): string {
	return `
		<html>
			<head>
				<title>Список цветов</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						padding: 20px;
						max-width: 800px;
						margin: 0 auto;
						background: white;
						color: #333;
					}
					h1 {
						font-size: 24px;
						margin-bottom: 20px;
						color: #333;
						text-align: center;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						margin-top: 12px;
					}
					th, td {
						padding: 8px 12px;
						text-align: left;
						border: 1px solid #e2e8f0;
					}
					th {
						background-color: #f8fafc;
						font-weight: 600;
					}
					.color-preview {
						width: 20px;
						height: 20px;
						border: 1px solid #e2e8f0;
						border-radius: 4px;
						display: inline-block;
					}
					@media print {
						th { background-color: #f8fafc !important; }
						body { margin: 0; padding: 20px; }
					}
				</style>
			</head>
			<body>
				<h1>Список цветов</h1>
				<table>
					<thead>
						<tr>
							<th>Цвет</th>
							<th>Название</th>
							<th>Альтернативное название</th>
							<th>Использований</th>
						</tr>
					</thead>
					<tbody>
						${colors
							.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
							.map(
								color => `
							<tr>
								<td>
									<div class="color-preview" style="background-color: ${color.hex}"></div>
								</td>
								<td>${color.name}</td>
								<td>${color.alternativeName || '-'}</td>
								<td>${color.usageCount || 0}</td>
							</tr>
						`
							)
							.join('')}
					</tbody>
				</table>
			</body>
		</html>
	`
}
