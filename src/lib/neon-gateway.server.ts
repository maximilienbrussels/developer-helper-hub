/**
 * Neon via de Lovable connector gateway. Drop-in voor de `neon()`-client:
 * tagged template, `.query(text, params)`, `.unsafe(text)` en `.transaction([...])`.
 * Server-only; sleutels worden per request gelezen.
 */
const GATEWAY_URL = "https://connector-gateway.lovable.dev/neon";

export function hasGateway(): boolean {
  return !!(process.env.LOVABLE_API_KEY && process.env.NEON_API_KEY);
}

type Stmt = { query: string; params: unknown[] };

async function post(body: unknown): Promise<any> {
  const res = await fetch(`${GATEWAY_URL}/sql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": process.env.NEON_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* keep raw text */
  }
  if (!res.ok) {
    const err = new Error(`Neon ${res.status}${json?.code ? ` ${json.code}` : ""}: ${json?.message ?? text.slice(0, 300)}`);
    Object.assign(err, { status: res.status, code: json?.code });
    throw err;
  }
  return json;
}

class UnsafeRaw {
  constructor(public text: string) {}
}

function build(strings: TemplateStringsArray, values: unknown[]): Stmt {
  let query = strings[0];
  const params: unknown[] = [];
  values.forEach((v, i) => {
    if (v instanceof UnsafeRaw) query += v.text;
    else {
      params.push(v instanceof Date ? v.toISOString() : v);
      query += `$${params.length}`;
    }
    query += strings[i + 1];
  });
  return { query, params };
}

/** Lazy query: voert pas uit bij await, zodat `.transaction()` ze kan bundelen. */
function lazy(stmt: Stmt) {
  let p: Promise<any[]> | undefined;
  const run = () => (p ??= post(stmt).then((r) => r.rows ?? []));
  return {
    __stmt: stmt,
    then: (a?: any, b?: any) => run().then(a, b),
    catch: (b?: any) => run().catch(b),
    finally: (f?: any) => run().finally(f),
  } as unknown as Promise<any[]>;
}

export function gatewayClient(): any {
  const sql: any = (strings: TemplateStringsArray, ...values: unknown[]) =>
    lazy(build(strings, values));
  sql.query = (text: string, params: unknown[] = []) =>
    lazy({ query: text, params: params.map((v) => (v instanceof Date ? v.toISOString() : v)) });
  sql.unsafe = (text: string) => new UnsafeRaw(text);
  sql.transaction = async (queries: any[] | ((s: any) => any[])) => {
    const list = typeof queries === "function" ? queries(sql) : queries;
    const r = await post({ queries: list.map((q: any) => q.__stmt) });
    return (r.results ?? []).map((x: any) => x.rows ?? []);
  };
  return sql;
}
