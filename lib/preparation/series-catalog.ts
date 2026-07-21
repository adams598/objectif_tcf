/** Une seule série gratuite par examen (groupe order 100). */
export const FREE_SERIES_ORDERS = [100] as const;

/** 60 séries payantes (orders 101–160). */
export const PREMIUM_SERIES_COUNT = 60;

export const PREMIUM_SERIES_ORDERS: number[] = Array.from(
  { length: PREMIUM_SERIES_COUNT },
  (_, index) => 101 + index
);
