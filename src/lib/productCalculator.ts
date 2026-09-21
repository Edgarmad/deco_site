import type { Product, ProductCalculatorConfig } from '../types/products';

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const numberFromText = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;

  const match = value.replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const number = Number(match[0]);
  return Number.isFinite(number) && number > 0 ? number : undefined;
};

const textValue = (value: unknown) => typeof value === 'string' ? value.trim() : '';

const piecesFromText = (value: unknown) => {
  const text = textValue(value).toLowerCase();
  if (!text || /\bn\/a\b|\bna\b/.test(text)) return undefined;
  const pieces = numberFromText(value);
  return pieces && Number.isInteger(pieces) ? pieces : undefined;
};

const coverageFromText = (value: unknown) => {
  const text = textValue(value).toLowerCase();
  if (!/m(?:²|2)/.test(text)) return undefined;
  return numberFromText(value);
};

const lengthFromDimensions = (dimensions?: string) => {
  if (!dimensions || !/cm\b/i.test(dimensions)) return undefined;
  const length = numberFromText(dimensions);
  return length ? length / 100 : undefined;
};

const linearSlugs = new Set(['vigas-interior', 'viga-exterior', 'angulo-asa', 'angulo-coextruido', 'quilla-wpc']);

const isLinearProduct = (product: Product) => {
  const labels = [
    product.categorySlug,
    product.categoryName,
    product.name,
    product.variants[0]?.name
  ].filter(Boolean).map(normalize);

  return labels.some((label) => linearSlugs.has(label) ||
    label.includes('vigas wpc') ||
    label.includes('viga coextruida') ||
    label.includes('angulo asa') ||
    label.includes('angulo coextruido') ||
    label.includes('quilla wpc'));
};

const isExcludedProduct = (product: Product) => {
  const labels = [product.categorySlug, product.categoryName, product.name]
    .filter(Boolean)
    .map(normalize);
  return labels.some((label) => label === 'accesorios' || label.includes('accesor')) ||
    labels.some((label) => label.includes('grapa deck'));
};

export const getProductCalculator = (product: Product): ProductCalculatorConfig | undefined => {
  if (isExcludedProduct(product)) return undefined;

  const specs = product.technicalSpecs ?? {};
  const piecesPerPresentation = piecesFromText(specs.pieces_per_box);
  const presentationLabel = textValue(specs.presentation) || undefined;

  if (isLinearProduct(product)) {
    const pieceLengthMeters = lengthFromDimensions(product.dimensions);
    if (!pieceLengthMeters) return undefined;
    return { mode: 'linear', pieceLengthMeters, piecesPerPresentation, presentationLabel };
  }

  const coverage = coverageFromText(specs.coverage);
  if (!coverage) return undefined;
  return { mode: 'area', coverage, coverageUnit: 'm²', piecesPerPresentation, presentationLabel };
};

export type CalculatorResult = {
  requested: number;
  presentations: number;
  units: number;
  covered: number;
};

export const calculateArea = (
  requested: number,
  config: Extract<ProductCalculatorConfig, { mode: 'area' }>
): CalculatorResult | undefined => {
  if (!Number.isFinite(requested) || requested <= 0) return undefined;
  const presentations = Math.ceil(requested / config.coverage);
  const units = presentations * (config.piecesPerPresentation ?? 1);
  return { requested, presentations, units, covered: presentations * config.coverage };
};

export const calculateLinear = (
  requested: number,
  config: Extract<ProductCalculatorConfig, { mode: 'linear' }>
): CalculatorResult | undefined => {
  if (!Number.isFinite(requested) || requested <= 0) return undefined;
  const pieces = Math.ceil(requested / config.pieceLengthMeters);
  const presentations = config.piecesPerPresentation
    ? Math.ceil(pieces / config.piecesPerPresentation)
    : pieces;
  const units = config.piecesPerPresentation
    ? presentations * config.piecesPerPresentation
    : pieces;
  return { requested, presentations, units, covered: units * config.pieceLengthMeters };
};
