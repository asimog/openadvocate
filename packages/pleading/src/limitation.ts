import type { IsoDate } from '@vakilbench/core';

const DAY_MS = 86_400_000;

// UTC arithmetic so the result never depends on the machine's time zone or DST.
export function limitationDeadline(orderDate: IsoDate, days = 90): IsoDate {
  const start = Date.parse(`${orderDate}T00:00:00Z`);
  if (Number.isNaN(start)) throw new Error(`invalid date ${orderDate}`);
  return new Date(start + days * DAY_MS).toISOString().slice(0, 10);
}
