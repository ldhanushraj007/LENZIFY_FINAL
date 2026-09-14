import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import dns from 'node:dns'

// FIX: Prevents UND_ERR_CONNECT_TIMEOUT on Windows Node 18+ when resolving outbound connections like Supabase API
try {
  dns.setDefaultResultOrder('ipv4first')
} catch {
  // Ignore in environments where not supported
}

// Resilient fetch wrapper to handle transient DNS or socket issues on Windows / Undici
export const resilientFetch: typeof fetch = async (input, init) => {
  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err: any) {
      lastError = err;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 250 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
};

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored
          }
        },
      },
      global: {
        fetch: resilientFetch,
      },
    }
  )
}

// Function specifically for Administrative / Backend operations that bypass RLS
export async function createAdminClient() {
  // Prefer service_role key if available for RLS bypass
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: {
        getAll() { return [] },
        setAll() { }
      },
      global: {
        fetch: resilientFetch,
      },
    }
  )
}
