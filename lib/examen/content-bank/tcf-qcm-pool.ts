import type { BankQuestion } from "./tcf-canada";
import {
  generateEditorialCePool,
  generateEditorialCoPool,
} from "./tcf-qcm-generator";

/** Sélectionne des QCM uniques selon l'ordre de série (rotation déterministe). */
export function selectQcmFromPool(
  pool: BankQuestion[],
  targetCount: number,
  seriesOrder: number
): BankQuestion[] {
  const start = (seriesOrder * 11) % Math.max(1, pool.length);
  const result: BankQuestion[] = [];

  for (let i = 0; i < targetCount; i++) {
    const src = pool[(start + i) % pool.length];
    result.push({
      ...src,
      order: i + 1,
      choices: src.choices?.map((c) => ({ ...c })),
    });
  }

  return result;
}

export function buildCoQuestionPool(base: BankQuestion[]): BankQuestion[] {
  return generateEditorialCoPool(base);
}

export function buildCeQuestionPool(base: BankQuestion[]): BankQuestion[] {
  return generateEditorialCePool(base);
}
