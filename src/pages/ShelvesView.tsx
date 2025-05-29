import { useEffect, useState } from 'react';
import type { PantoneColor } from '@/types';
import { getColors } from '@lib/colors';
import { Link } from 'react-router-dom';

// TODO: Получить реальные цвета из props или контекста
// const exampleColors: PantoneColor[] = [];

// Конфигурация для стеллажей 1 и 6
// const SHELVES_1_6 = [1, 6];
const SHELF_COUNT = 5;
const BUCKETS_PER_ROW = 4;
const ROWS_PER_SECTION = 2; // 2 ряда по 4 ведра = 8 ведер на секцию

// Стеллажи 2-5
const SHELVES_2_5 = [2, 3, 4, 5];
const SHELF_COUNT_2_5 = 4;

// Мапа для подписей стеллажей
const SHELF_LABELS: Record<number, string> = {
  1: '1 (беж/кор)',
  2: '2 (зеленые)',
  3: '3 (красные)',
  4: '4 (синие)',
  5: '5',
  6: '6',
};

// Функция для поиска всех цветов в конкретной позиции (стеллаж, секция, полка)
// function findColorsInPosition(colors: PantoneColor[], shelfId: number, section: number, shelfLevel: number) { ... }

// Функция для поиска цвета по точному местоположению (стеллаж полка/секция/ряд/позиция)
function findColorByLocation(colors: PantoneColor[], location: string) {
  return colors.find((color) => {
    if (!color.shelfLocation) return false;
    // Поддержка старого и нового формата
    // Новый формат: 1 4/2/1/1
    // Старый формат: 1 4/2 (будет найден только если location совпадает без /ряд/позиция)
    return color.shelfLocation.replace(/\\/g, '/') === location;
  });
}

// Для стеллажей 2-5: левая и правая часть, в каждой части — секция 1 и секция 2
function ShelfPart({
  shelfId,
  partName,
  shelfCount,
  colors,
}: {
  shelfId: number;
  partName: string; // 'Левая часть' или 'Правая часть'
  shelfCount: number;
  colors: PantoneColor[];
}) {
  // Для учёта уже размещённых цветов (по id)
  const usedColorIds = new Set<string>();

  // Определяем часть для shelfLocation
  const part = partName.toLowerCase().includes('левая') ? 'Левая' : 'Правая';

  return (
    <div>
      <div className="text-center text-xs font-bold mb-2">{partName}</div>
      <div className="grid grid-cols-2 gap-2">
        {[2, 1].map(sectionNumber => (
          <div key={sectionNumber}>
            <div className="text-center text-xs font-semibold mb-1">Секция {sectionNumber}</div>
            <div className="flex flex-col gap-2">
              {[...Array(shelfCount)].map((_, shelfIdx) => (
                <div key={shelfIdx} className="border rounded p-2 mb-1 bg-gray-50">
                  <div className="text-xs font-semibold mb-1 text-gray-700 text-center">
                  Секция {sectionNumber} / Полка {shelfCount - shelfIdx} 
                  </div>
                  <div className="flex flex-col gap-1">
                    {[...Array(ROWS_PER_SECTION)].map((_, rowIdx) => (
                      <div key={rowIdx} className="flex gap-2 justify-center">
                        {[...Array(BUCKETS_PER_ROW)].map((_, bucketIdx) => {
                          // Формируем короткий путь: стеллаж часть секция/полка
                          const shortLocation = `${shelfId} ${part} ${sectionNumber}/${shelfCount - shelfIdx}`;
                          // Формируем полный путь (если вдруг есть)
                          const fullLocation = `${shelfId} ${part} ${sectionNumber}/${shelfCount - shelfIdx}/${rowIdx + 1}/${bucketIdx + 1}`;

                          // 1. Сначала ищем цвет с точным полным путём (приоритет)
                          let color = findColorByLocation(colors, fullLocation);
                          // 2. Если не найден — ищем первый неиспользованный цвет с коротким путём
                          if (!color) {
                            const candidate = colors.find(
                              c =>
                                c.shelfLocation &&
                                c.shelfLocation.replace(/\\/g, '/') === shortLocation &&
                                !usedColorIds.has(c.id)
                            );
                            if (candidate) {
                              color = candidate;
                              usedColorIds.add(candidate.id);
                            }
                          }
                          // Если нашли цвет — помечаем его как использованный
                          if (color && color.shelfLocation && color.shelfLocation.replace(/\\/g, '/') === shortLocation) {
                            usedColorIds.add(color.id);
                          }
                          return (
                            <div
                              key={bucketIdx}
                              className={`w-12 h-12 border-2 rounded flex flex-col items-center justify-center text-[11px] font-bold transition-colors duration-200 overflow-hidden ${color ? '' : 'bg-gray-200 text-gray-400'}`}
                              style={color ? { backgroundColor: color.hex } : {}}
                              title={color ? color.name + (color.alternativeName ? ` (${color.alternativeName})` : '') : 'Свободно'}
                            >
                              {color ? (
                                <>
                                  <span className="text-xs text-white text-center w-full truncate">{color.name}</span>
                                  {color.alternativeName && (
                                    <span className="text-[10px] text-white text-center w-full truncate">{color.alternativeName}</span>
                                  )}
                                </>
                              ) : ''}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Для стеллажей 1 и 6: только одна часть, но две секции (1 и 2) на каждой полке
function ShelfSinglePart({
  shelfId,
  shelfCount,
  colors,
}: {
  shelfId: number;
  shelfCount: number;
  colors: PantoneColor[];
}) {
  // Для учёта уже размещённых цветов (по id)
  const usedColorIds = new Set<string>();

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {[2, 1].map(sectionNumber => (
          <div key={sectionNumber}>
            <div className="text-center text-xs font-semibold mb-1">Секция {sectionNumber}</div>
            <div className="flex flex-col gap-2">
              {[...Array(shelfCount)].map((_, shelfIdx) => (
                <div key={shelfIdx} className="border rounded p-2 mb-1 bg-gray-50">
                  <div className="text-xs font-semibold mb-1 text-gray-700 text-center">
                  Секция {sectionNumber}/ Полка {shelfCount - shelfIdx} 
                  </div>
                  <div className="flex flex-col gap-1">
                    {[...Array(ROWS_PER_SECTION)].map((_, rowIdx) => (
                      <div key={rowIdx} className="flex gap-2 justify-center">
                        {[...Array(BUCKETS_PER_ROW)].map((_, bucketIdx) => {
                          // Формируем короткий путь: стеллаж секция/полка
                          const shortLocation = `${shelfId} ${sectionNumber}/${shelfCount - shelfIdx}`;
                          // Формируем полный путь (если вдруг есть)
                          const fullLocation = `${shelfId} ${sectionNumber}/${shelfCount - shelfIdx}/${rowIdx + 1}/${bucketIdx + 1}`;

                          // 1. Сначала ищем цвет с точным полным путём (приоритет)
                          let color = findColorByLocation(colors, fullLocation);
                          // 2. Если не найден — ищем первый неиспользованный цвет с коротким путём
                          if (!color) {
                            const candidate = colors.find(
                              c =>
                                c.shelfLocation &&
                                c.shelfLocation.replace(/\\/g, '/') === shortLocation &&
                                !usedColorIds.has(c.id)
                            );
                            if (candidate) {
                              color = candidate;
                              usedColorIds.add(candidate.id);
                            }
                          }
                          // Если нашли цвет — помечаем его как использованный
                          if (color && color.shelfLocation && color.shelfLocation.replace(/\\/g, '/') === shortLocation) {
                            usedColorIds.add(color.id);
                          }
                          return (
                            <div
                              key={bucketIdx}
                              className={`w-12 h-12 border-2 rounded flex flex-col items-center justify-center text-[11px] font-bold transition-colors duration-200 overflow-hidden ${color ? '' : 'bg-gray-200 text-gray-400'}`}
                              style={color ? { backgroundColor: color.hex } : {}}
                              title={color ? color.name + (color.alternativeName ? ` (${color.alternativeName})` : '') : 'Свободно'}
                            >
                              {color ? (
                                <>
                                  <span className="text-xs text-white text-center w-full truncate">{color.name}</span>
                                  {color.alternativeName && (
                                    <span className="text-[10px] text-white text-center w-full truncate">{color.alternativeName}</span>
                                  )}
                                </>
                              ) : ''}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShelvesView() {
  const [colors, setColors] = useState<PantoneColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getColors()
      .then(data => {
        setColors(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Ошибка загрузки цветов');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-lg">Загрузка цветов...</div>;
  }
  if (error) {
    return <div className="p-6 text-lg text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link to="/" className="inline-block px-4 py-2 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium transition-colors">
          ← К списку цветов
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Схема стеллажей</h1>
      <div className="flex gap-8 flex-wrap">
        {/* Стеллажи 1 и 6 */}
        {[1, 6].map((shelfId) => (
          <div key={shelfId} className="border rounded-lg p-4 bg-white shadow-md min-w-[340px]">
            <h2 className="font-semibold mb-4">Стеллаж {SHELF_LABELS[shelfId] || shelfId}</h2>
            <ShelfSinglePart
              shelfId={shelfId}
              shelfCount={SHELF_COUNT}
              colors={colors}
            />
          </div>
        ))}
        {/* Стеллажи 2-5 */}
        {SHELVES_2_5.map((shelfId) => (
          <div key={shelfId} className="border rounded-lg p-4 bg-white shadow-md min-w-[600px]">
            <h2 className="font-semibold mb-4">Стеллаж {SHELF_LABELS[shelfId] || shelfId}</h2>
            <div className="grid grid-cols-2 gap-8">
              <ShelfPart
                shelfId={shelfId}
                partName="Левая часть"
                shelfCount={SHELF_COUNT_2_5}
                colors={colors}
              />
              <ShelfPart
                shelfId={shelfId}
                partName="Правая часть"
                shelfCount={SHELF_COUNT_2_5}
                colors={colors}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 