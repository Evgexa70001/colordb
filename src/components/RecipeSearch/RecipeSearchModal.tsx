import React, { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { X, ChevronDown, Plus } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown } from '@/components/ui/Dropdown/Dropdown'
// import type { PantoneColor } from '@/types'

const COMMON_PAINTS = [
  'M',
  'Y',
  'C',
  'K',
  'Tr.W',
  'Red 032',
  'W.Red',
  'Rub.Red',
  'Rhodamine',
  'Purple',
  'Violet',
  'Blue 072',
  'Ref.B',
  'Green',
  'Orange',
]

interface RecipeSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (recipe: { items: Array<{ paint: string; amount: number }> }) => void
}

type InputMode = 'grams' | 'percent'

export default function RecipeSearchModal({
  isOpen,
  onClose,
  onSearch,
}: RecipeSearchModalProps) {
  const { isDark } = useTheme()
  const [items, setItems] = useState<Array<{ paint: string; amount: string }>>([
    { paint: '', amount: '' },
  ])
  const [inputMode, setInputMode] = useState<InputMode>('grams')

  const addItem = () => {
    setItems([...items, { paint: '', amount: '' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (
    index: number,
    updates: Partial<{ paint: string; amount: string }>
  ) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, ...updates } : item))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert string amounts to numbers for validation and submission
    const itemsWithNumbers = items.map(item => ({
      ...item,
      amount: item.amount === '' ? 0 : parseFloat(item.amount)
    }))
    
    if (inputMode === 'percent') {
      // Check if percentages sum up to 100%
      const totalPercent = itemsWithNumbers.reduce((sum, item) => sum + item.amount, 0)
      if (Math.abs(totalPercent - 100) > 0.01) {
        alert('Сумма процентов должна быть равна 100%')
        return
      }

      // Convert percentages to grams (assuming 1000g total)
      const totalGrams = 1000
      const convertedItems = itemsWithNumbers.map(item => ({
        paint: item.paint,
        amount: Math.round((item.amount / 100) * totalGrams),
      }))
      onSearch({ items: convertedItems })
    } else {
      onSearch({ items: itemsWithNumbers })
    }
    onClose()
  }

  // Calculate total and remaining percentage
  const totalAmount = items.reduce((sum, item) => {
    const amount = item.amount === '' ? 0 : parseFloat(item.amount)
    return sum + amount
  }, 0)
  const remainingPercent = inputMode === 'percent' ? 100 - totalAmount : 0

  // Reset items when modal is opened
  useEffect(() => {
    if (isOpen) {
      setItems([{ paint: '', amount: '' }])
      setInputMode('grams')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onClose={onClose} className='relative z-50'>
      <div className='fixed inset-0 bg-black/30' aria-hidden='true' />
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <Dialog.Panel
          className={`mx-auto max-w-2xl w-full rounded-lg p-6 shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className='flex justify-between items-start mb-6'>
            <Dialog.Title
              className={`text-lg font-medium ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}
            >
              Поиск по рецепту
            </Dialog.Title>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Input mode toggle */}
            <div className='flex gap-4 items-center'>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Режим ввода:
              </span>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setInputMode('grams')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    inputMode === 'grams'
                      ? isDark
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Граммы
                </button>
                <button
                  type='button'
                  onClick={() => setInputMode('percent')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    inputMode === 'percent'
                      ? isDark
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Проценты
                </button>
              </div>
            </div>

            {inputMode === 'percent' && (
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Осталось: {remainingPercent.toFixed(1)}%
              </div>
            )}

            <div className='space-y-4'>
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <div className='flex flex-col sm:flex-row gap-4'>
                    <div className='flex-1'>
                      <Dropdown
                        items={COMMON_PAINTS}
                        value={item.paint}
                        onChange={(value) => updateItem(index, { paint: value })}
                        placeholder='Выберите краску'
                        triggerComponent={
                          <Input
                            type='text'
                            value={item.paint}
                            onChange={(e) =>
                              updateItem(index, { paint: e.target.value })
                            }
                            label='Название краски'
                            rightElement={
                              <ChevronDown className='w-4 h-4 transform transition-transform duration-200' />
                            }
                          />
                        }
                      />
                    </div>
                    <div className='w-full sm:w-32'>
                      <Input
                        type='number'
                        value={item.amount}
                        onChange={(e) =>
                          updateItem(index, { 
                            amount: e.target.value 
                          })
                        }
                        min='0'
                        max={inputMode === 'percent' ? '100' : undefined}
                        step={inputMode === 'percent' ? '0.1' : '1'}
                        label={`Количество (${inputMode === 'grams' ? 'гр.' : '%'})`}
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removeItem(index)}
                        className={`self-end p-2.5 rounded-md ${
                          isDark
                            ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
                            : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <X className='w-5 h-5' />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              type='button'
              variant='outline'
              onClick={addItem}
              leftIcon={<Plus className='w-4 h-4' />}
              className='w-full'
            >
              Добавить компонент
            </Button>

            <div className='flex justify-end space-x-3'>
              <Button variant='secondary' type='button' onClick={onClose}>
                Отмена
              </Button>
              <Button type='submit'>Найти</Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 