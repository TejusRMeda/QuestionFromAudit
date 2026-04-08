import { vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Chainable Supabase query mock builder.
 * Handles chains like: .from("table").select().eq().single()
 */
function createQueryBuilder(response: { data: any; error: any; count?: number }) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(response),
  };
  // Make the builder thenable so it resolves when awaited without .single()
  Object.defineProperty(builder, "then", {
    value: (resolve: any, reject?: any) => {
      return Promise.resolve(response).then(resolve, reject);
    },
    configurable: true,
  });
  return builder;
}

interface TableConfig {
  data?: any;
  error?: any;
  count?: number;
}

interface MockSupabaseOptions {
  user?: { id: string; email?: string } | null;
  tables?: Record<string, TableConfig>;
}

/**
 * Creates a mock Supabase client with configurable auth and per-table responses.
 */
export function createMockSupabaseClient(options: MockSupabaseOptions = {}) {
  const { user = null, tables = {} } = options;

  const fromMock = vi.fn((tableName: string) => {
    const config = tables[tableName] || { data: null, error: null };
    return createQueryBuilder({
      data: config.data ?? null,
      error: config.error ?? null,
      count: config.count,
    });
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from: fromMock,
  };
}

/**
 * Creates a NextRequest for testing route handlers.
 */
export function createNextRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
  } = {}
): NextRequest {
  const { method = "GET", body } = options;
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

/**
 * Creates a mock Supabase client with per-call (sequential) responses for a table.
 * Useful when a route calls .from("table") multiple times with different expected results.
 */
export function createSequentialMockClient(options: {
  user?: { id: string; email?: string } | null;
  calls: Array<{ table: string; response: TableConfig }>;
}) {
  const { user = null, calls } = options;
  let callIndex = 0;

  const fromMock = vi.fn((tableName: string) => {
    const call = calls[callIndex];
    if (call && call.table !== tableName) {
      throw new Error(
        `Supabase mock: expected from("${call.table}") at call ${callIndex}, got from("${tableName}")`
      );
    }
    callIndex++;
    const config = call?.response || { data: null, error: null };
    return createQueryBuilder({
      data: config.data ?? null,
      error: config.error ?? null,
      count: config.count,
    });
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from: fromMock,
  };
}
