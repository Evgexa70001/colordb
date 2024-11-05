export function isValidHexColor(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

export function normalizeHexColor(hex: string): string {
  if (!isValidHexColor(hex)) return '#000000';

  // If it's a 3-digit hex, convert to 6-digit
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return hex;
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalizedHex = normalizeHexColor(hex);
  if (normalizedHex === '#000000') return [0, 0, 0];

  try {
    const r = parseInt(normalizedHex.slice(1, 3), 16);
    const g = parseInt(normalizedHex.slice(3, 5), 16);
    const b = parseInt(normalizedHex.slice(5, 7), 16);
    return [r, g, b];
  } catch (error) {
    return [0, 0, 0];
  }
}

export function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  // Convert RGB to [0,1] range
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  // Find K (black)
  const k = 1 - Math.max(red, green, blue);

  // Handle pure black
  if (k === 1) {
    return [0, 0, 0, 100];
  }

  // Calculate CMY
  const c = ((1 - red - k) / (1 - k)) * 100;
  const m = ((1 - green - k) / (1 - k)) * 100;
  const y = ((1 - blue - k) / (1 - k)) * 100;

  // Convert K to percentage
  const kPercent = k * 100;

  return [Math.round(c), Math.round(m), Math.round(y), Math.round(kPercent)];
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Convert RGB to XYZ
  let rr = r / 255;
  let gg = g / 255;
  let bb = b / 255;

  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;

  rr *= 100;
  gg *= 100;
  bb *= 100;

  const x = rr * 0.4124 + gg * 0.3576 + bb * 0.1805;
  const y = rr * 0.2126 + gg * 0.7152 + bb * 0.0722;
  const z = rr * 0.0193 + gg * 0.1192 + bb * 0.9505;

  // Convert XYZ to Lab
  const xRef = 95.047;
  const yRef = 100.0;
  const zRef = 108.883;

  let xx = x / xRef;
  let yy = y / yRef;
  let zz = z / zRef;

  xx = xx > 0.008856 ? Math.pow(xx, 1 / 3) : 7.787 * xx + 16 / 116;
  yy = yy > 0.008856 ? Math.pow(yy, 1 / 3) : 7.787 * yy + 16 / 116;
  zz = zz > 0.008856 ? Math.pow(zz, 1 / 3) : 7.787 * zz + 16 / 116;

  const labL = Math.round(116 * yy - 16);
  const labA = Math.round(500 * (xx - yy));
  const labB = Math.round(200 * (yy - zz));

  return [labL, labA, labB];
}

export function getColorDistance(hex1: string, hex2: string): number {
  const normalized1 = normalizeHexColor(hex1);
  const normalized2 = normalizeHexColor(hex2);

  if (normalized1 === '#000000' || normalized2 === '#000000') {
    return Infinity;
  }

  const rgb1 = hexToRgb(normalized1);
  const rgb2 = hexToRgb(normalized2);

  const lab1 = rgbToLab(...rgb1);
  const lab2 = rgbToLab(...rgb2);

  // Calculate Delta E (CIE76)
  return Math.sqrt(
    Math.pow(lab2[0] - lab1[0], 2) +
      Math.pow(lab2[1] - lab1[1], 2) +
      Math.pow(lab2[2] - lab1[2], 2),
  );
}

export function getColorInfo(hex: string) {
  const normalizedHex = normalizeHexColor(hex);
  if (normalizedHex === '#000000') {
    return {
      rgb: { r: 0, g: 0, b: 0 },
      cmyk: { c: 0, m: 0, y: 0, k: 0 },
      lab: { l: 0, a: 0, b: 0 },
    };
  }

  const rgb = hexToRgb(normalizedHex);
  const cmyk = rgbToCmyk(...rgb);
  const lab = rgbToLab(...rgb);

  return {
    rgb: {
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
    },
    cmyk: {
      c: cmyk[0],
      m: cmyk[1],
      y: cmyk[2],
      k: cmyk[3],
    },
    lab: {
      l: lab[0],
      a: lab[1],
      b: lab[2],
    },
  };
}
