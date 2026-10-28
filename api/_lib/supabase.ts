// Supabase Client Helper for Vercel Serverless Backend
// Backend ONLY access using SERVICE_ROLE_KEY to bypass RLS and protect credentials

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export async function supabaseQuery<T>(table: string, queryParams = ''): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables not configured');
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${queryParams}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase query failed: ${errorText}`);
  }

  return res.json();
}

export async function supabaseInsert<T>(table: string, data: any): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase insert failed: ${errorText}`);
  }

  const result = await res.json();
  return result[0];
}

export async function supabaseUpdate<T>(table: string, filter: string, data: any): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase update failed: ${errorText}`);
  }

  const result = await res.json();
  return result[0];
}

