/**
 * supabaseClient.js — The Employee Playbook
 * ------------------------------------------------------------
 * Purpose:
 * - Single, central Supabase client (browser + server safe)
 * - Works with Vite/Vanilla, Next.js, and Node (where env is available)
 *
 * IMPORTANT:
 * - Do NOT put your Supabase service role key in client-side code.
 * - Use ONLY the anon/public key in the browser.
 *
 * Expected env vars (pick the ones you use; this file supports both):
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY        (recommended)
 * - NEXT_PUBLIC_SUPABASE_URL (Next.js)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (Next.js)
 * - VITE_SUPABASE_URL        (Vite)
 * - VITE_SUPABASE_ANON_KEY   (Vite)
 */

import { createClient } from "@supabase/supabase-js";

/* =========================
   Resolve environment vars safely
========================= */

function readEnv(key) {
  // Works in: Next.js, Vite, Node
  try {
    // Next.js/Vite style
    if (typeof import.meta !== "undefined" && import.meta.env && key in import.meta.env) {
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    // Node/Next server runtime
    if (typeof process !== "undefined" && process.env && key in process.env) {
      return process.env[key];
    }
  } catch (e) {}

  return undefined;
}

function resolveSupabaseConfig() {
  const url =
    readEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    readEnv("VITE_SUPABASE_URL") ||
    readEnv("SUPABASE_URL");

  const anonKey =
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    readEnv("VITE_SUPABASE_ANON_KEY") ||
    readEnv("SUPABASE_ANON_KEY");

  return { url, anonKey };
}

/* =========================
   Create singleton client
========================= */

let _client = null;

export function getSupabaseClient() {
  if (_client) return _client;

  const { url, anonKey } = resolveSupabaseConfig();

  if (!url || !anonKey) {
    // Throwing here is better than silently failing later.
    // You'll see this immediately in the console during deployment.
    throw new Error(
      "[TEP] Supabase config missing. Set SUPABASE_URL + SUPABASE_ANON_KEY (or NEXT_PUBLIC_/VITE_ equivalents)."
    );
  }

  _client = createClient(url, anonKey, {
    auth: {
      // Keep sessions alive and auto-refresh in the browser
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-application-name": "the-employee-playbook",
      },
    },
  });

  return _client;
}

/* =========================
   Convenience exports
========================= */

export const supabase = (() => {
  // Lazy init pattern to avoid crashing import in non-env contexts
  // (e.g., certain build steps). If env is missing, it throws when used.
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const client = getSupabaseClient();
        const value = client[prop];
        return typeof value === "function" ? value.bind(client) : value;
      },
    }
  );
})();

/* =========================
   Minimal helpers (optional but useful)
========================= */

export async function getSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

export async function getUser() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user || null;
}

export async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
  return true;
}
