// assets/supabaseClient.js (static HTML)

(function () {
  const SUPABASE_URL = "PASTE_YOUR_PROJECT_URL_HERE";
  const SUPABASE_ANON_KEY = "PASTE_YOUR_ANON_PUBLIC_KEY_HERE";

  if (!window.supabase) {
    console.error("Supabase CDN not loaded. Put the CDN script ABOVE supabaseClient.js");
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("✅ supabaseClient ready:", window.supabaseClient);
})();
