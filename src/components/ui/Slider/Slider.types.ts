export interface SliderProps {
	value: number
	min: number
	max: number
	step?: number
	onChange: (value: number) => void
	label?: string
	disabled?: boolean
	className?: string
	showValue?: boolean
	formatValue?: (value: number) => string
}
