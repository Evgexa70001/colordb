export const styles = {
	base: {
		wrapper: 'w-full',
		label: 'block text-sm font-medium mb-2',
		slider: `
			w-full h-2 
			bg-gray-200 
			rounded-lg 
			appearance-none 
			cursor-pointer 
			focus:outline-none 
			focus:ring-2 
			focus:ring-blue-500 
			focus:ring-opacity-50
			disabled:cursor-not-allowed 
			disabled:opacity-50
		`,
		valueDisplay: 'text-sm font-medium mt-1',
	},
	theme: {
		light: {
			label: 'text-gray-700',
			slider: `
				bg-gray-200 
				[&::-webkit-slider-thumb]:appearance-none 
				[&::-webkit-slider-thumb]:h-5 
				[&::-webkit-slider-thumb]:w-5 
				[&::-webkit-slider-thumb]:rounded-full 
				[&::-webkit-slider-thumb]:bg-blue-500 
				[&::-webkit-slider-thumb]:cursor-pointer
				[&::-webkit-slider-thumb]:border-2
				[&::-webkit-slider-thumb]:border-white
				[&::-webkit-slider-thumb]:shadow-md
				[&::-moz-range-thumb]:h-5 
				[&::-moz-range-thumb]:w-5 
				[&::-moz-range-thumb]:rounded-full 
				[&::-moz-range-thumb]:bg-blue-500 
				[&::-moz-range-thumb]:cursor-pointer 
				[&::-moz-range-thumb]:border-none
				[&::-moz-range-thumb]:shadow-md
			`,
			valueDisplay: 'text-gray-600',
		},
		dark: {
			label: 'text-gray-300',
			slider: `
				bg-gray-700 
				[&::-webkit-slider-thumb]:appearance-none 
				[&::-webkit-slider-thumb]:h-5 
				[&::-webkit-slider-thumb]:w-5 
				[&::-webkit-slider-thumb]:rounded-full 
				[&::-webkit-slider-thumb]:bg-blue-500 
				[&::-webkit-slider-thumb]:cursor-pointer
				[&::-webkit-slider-thumb]:border-2
				[&::-webkit-slider-thumb]:border-gray-800
				[&::-webkit-slider-thumb]:shadow-lg
				[&::-moz-range-thumb]:h-5 
				[&::-moz-range-thumb]:w-5 
				[&::-moz-range-thumb]:rounded-full 
				[&::-moz-range-thumb]:bg-blue-500 
				[&::-moz-range-thumb]:cursor-pointer 
				[&::-moz-range-thumb]:border-none
				[&::-moz-range-thumb]:shadow-lg
			`,
			valueDisplay: 'text-gray-400',
		},
	},
}
