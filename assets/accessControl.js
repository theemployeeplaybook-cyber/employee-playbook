// assets/accessControl.js — The Employee Playbook (static HTML + Supabase CDN)
// Use on PROTECTED pages only.

(function () {
  const client = window.supabaseClient;

  if (!client) {
    console.error("[TEP] window.supabaseClient is missing. Check script order.");
    return;
  }

  function buildReturnTo() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function redirectToSignIn() {
    const returnTo = buildReturnTo();
    localStorage.setItem("returnTo", returnTo);
    window.location.href = "sign-in.html?returnTo=" + encodeURIComponent(returnTo);
  }

  (async () => {
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      const session = data?.session;
      if (!session) {
        redirectToSignIn();
      }
      // If session exists, do nothing (page loads normally)
    } catch (err) {
      console.error("[TEP] accessControl error:", err);
      redirectToSignIn();
    }
  })();
})();
