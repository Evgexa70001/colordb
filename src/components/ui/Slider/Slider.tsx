import React from 'react'
import { useTheme } from '@contexts/ThemeContext'
import { SliderProps } from './Slider.types'
import { styles } from './Slider.styles'

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
	(
		{
			value,
			min,
			max,
			step = 1,
			onChange,
			label,
			disabled = false,
			className = '',
			showValue = false,
			formatValue,
		},
		ref
	) => {
		const { isDark } = useTheme()
		const theme = isDark ? styles.theme.dark : styles.theme.light

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = parseFloat(e.target.value)
			onChange(newValue)
		}

		const displayValue = formatValue ? formatValue(value) : value.toString()

		return (
			<div className={`${styles.base.wrapper} ${className}`}>
				{label && (
					<label className={`${styles.base.label} ${theme.label}`}>
						{label}
					</label>
				)}
				<input
					ref={ref}
					type='range'
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={handleChange}
					disabled={disabled}
					className={`${styles.base.slider} ${theme.slider}`}
				/>
				{showValue && (
					<div className={`${styles.base.valueDisplay} ${theme.valueDisplay}`}>
						{displayValue}
					</div>
				)}
			</div>
		)
	}
)

Slider.displayName = 'Slider'
