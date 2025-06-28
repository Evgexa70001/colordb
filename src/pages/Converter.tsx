import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  findClosestPantoneByLab,
  findPantoneByHex,
  labToHex,
  hexToLab,
  isValidHexColor,
  normalizeHexColor,
} from '@/utils/colorUtils';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Converter() {
  const [mode, setMode] = useState<'lab' | 'hex'>('lab');
  const [lab, setLab] = useState({ l: '', a: '', b: '' });
  const [hex, setHex] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (mode === 'lab') {
      setLab((prev) => ({ ...prev, [id]: value.replace(',', '.') }));
    } else {
      setHex(value);
    }
  };

  const handleModeChange = (newMode: 'lab' | 'hex') => {
    setMode(newMode);
    setResult(null);
    setError(null);
    if (newMode === 'lab') {
      setHex('');
    } else {
      setLab({ l: '', a: '', b: '' });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      if (mode === 'lab') {
        const l = parseFloat(lab.l);
        const a = parseFloat(lab.a);
        const b = parseFloat(lab.b);
        if (isNaN(l) || isNaN(a) || isNaN(b)) {
          setError('Введите корректные значения LAB.');
          setLoading(false);
          return;
        }
        const hexValue = labToHex({ l, a, b });
        const pantone = findClosestPantoneByLab({ l, a, b });
        setResult({
          input: { l, a, b, hex: hexValue },
          pantone,
        });
      } else {
        const hexValue = normalizeHexColor(hex);
        if (!isValidHexColor(hexValue)) {
          setError('Введите корректный HEX (например, #123ABC).');
          setLoading(false);
          return;
        }
        const labValue = hexToLab(hexValue);
        const pantone = findPantoneByHex(hexValue) || findClosestPantoneByLab(labValue);
        setResult({
          input: { ...labValue, hex: hexValue },
          pantone,
        });
      }
    } catch (e) {
      setError('Ошибка при поиске.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" />
        На главную
      </Link>
      <h2 className="text-2xl font-bold mb-4">Конвертер Pantone (LAB/HEX)</h2>
      <div className="mb-4 flex gap-2">
        <Button
          variant={mode === 'lab' ? 'primary' : 'outline'}
          onClick={() => handleModeChange('lab')}
        >
          LAB
        </Button>
        <Button
          variant={mode === 'hex' ? 'primary' : 'outline'}
          onClick={() => handleModeChange('hex')}
        >
          HEX
        </Button>
      </div>
      <form onSubmit={handleSearch} className="space-y-4">
        {mode === 'lab' ? (
          <div className="grid grid-cols-3 gap-4">
            <Input
              id="l"
              label="L"
              value={lab.l}
              onChange={handleInput}
              required
              type="text"
              inputMode="decimal"
              pattern="-?[0-9]*\.?[0-9]*"
              placeholder="Напр. 23.56"
            />
            <Input
              id="a"
              label="a"
              value={lab.a}
              onChange={handleInput}
              required
              type="text"
              inputMode="decimal"
              pattern="-?[0-9]*\.?[0-9]*"
              placeholder="Напр. -23.56"
            />
            <Input
              id="b"
              label="b"
              value={lab.b}
              onChange={handleInput}
              required
              type="text"
              inputMode="decimal"
              pattern="-?[0-9]*\.?[0-9]*"
              placeholder="Напр. 12.34"
            />
          </div>
        ) : (
          <Input
            id="hex"
            label="HEX"
            value={hex}
            onChange={handleInput}
            required
            type="text"
            inputMode="text"
            pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
            placeholder="#123ABC"
          />
        )}
        <Button type="submit" isLoading={loading} className="w-full">
          Найти Pantone
        </Button>
      </form>
      <div className="mt-6">
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {result && (
          <div className="border rounded-lg p-4 bg-gray-50 mt-2">
            <div className="mb-2 font-semibold">Введённый цвет:</div>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded border"
                style={{ background: result.input.hex }}
              />
              <div>
                <div>HEX: <span className="font-mono">{result.input.hex}</span></div>
                <div>LAB: <span className="font-mono">{`${result.input.l.toFixed(2)}, ${result.input.a.toFixed(2)}, ${result.input.b.toFixed(2)}`}</span></div>
              </div>
            </div>
            <div className="mb-2 font-semibold">Ближайший Pantone:</div>
            {result.pantone ? (
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded border"
                  style={{ background: result.pantone.hex }}
                />
                <div>
                  <div className="font-bold">{result.pantone.pantone}</div>
                  <div>HEX: <span className="font-mono">{result.pantone.hex}</span></div>
                  <div>LAB: <span className="font-mono">{`${result.pantone.lab.l.toFixed(2)}, ${result.pantone.lab.a.toFixed(2)}, ${result.pantone.lab.b.toFixed(2)}`}</span></div>
                  {typeof result.pantone.deltaE === 'number' && (
                    <div>ΔE: <span className="font-mono">{result.pantone.deltaE.toFixed(2)}</span></div>
                  )}
                </div>
              </div>
            ) : (
              <div>Не найдено.</div>
            )}
          </div>
        )}
      </div>
      <div className="mt-8 text-sm text-gray-500">
        <div>Введите LAB (например: 23.56, -23.56, 12.34) или HEX (#123ABC) для поиска ближайшего Pantone по вашей библиотеке.</div>
        <div className="mt-2">Поиск работает по данным <b>pantone.json</b> (LAB и HEX вычисляются локально).</div>
      </div>
    </div>
  );
} 