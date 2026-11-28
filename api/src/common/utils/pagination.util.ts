export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Clamps incoming page and limit values to safe positive integer bounds.
 */
export function normalizePagination(
  page?: number,
  limit?: number,
  defaultLimit = 20,
  maxLimit = 100,
): PaginationParams {
  const safeLimit = Math.min(
    Math.max(Number.isFinite(limit) ? Math.trunc(limit!) : defaultLimit, 1),
    maxLimit,
  );
  const safePage = Math.max(
    Number.isFinite(page) ? Math.trunc(page!) : 1,
    1,
  );
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

/**
 * Builds consistent pagination metadata for list responses.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / Math.max(limit, 1))),
  };
}
