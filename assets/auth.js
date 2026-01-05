// assets/auth.js — The Employee Playbook (static HTML + Supabase CDN)
// Works with: sign-in.html + create-account.html
// Requires: supabaseClient.js already created window.supabaseClient

(function () {
  const client = window.supabaseClient;

  if (!client) {
    console.error("[TEP] window.supabaseClient is missing. Check script order.");
    return;
  }

  // ----------------------------
  // Helpers
  // ----------------------------
  function qs(name) {
    return document.querySelector(name);
  }

  function getReturnTo() {
    // Priority: ?returnTo= in URL, else localStorage, else dashboard
    const url = new URL(window.location.href);
    return (
      url.searchParams.get("returnTo") ||
      localStorage.getItem("returnTo") ||
      "dashboard.html"
    );
  }

  function clearReturnTo() {
    localStorage.removeItem("returnTo");
  }

  function goAfterLogin() {
    const to = getReturnTo();
    clearReturnTo();
    window.location.href = to;
  }

  function setStatus(message, isError = false) {
    // Optional: add <div id="auth-status"></div> to your pages
    const el = document.getElementById("auth-status");
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? "#b42318" : "";
  }

  async function ensureProfileRow(user) {
    // OPTIONAL: only runs if you created public.profiles table.
    // Safe: if profiles doesn't exist yet, it will fail silently (but log).
    try {
      // Check if row exists
      const { data: existing, error: selErr } = await client
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (selErr) throw selErr;
      if (existing?.id) return;

      // Insert new profile row
      const { error: insErr } = await client.from("profiles").insert([
        {
          id: user.id,
          plan: "free",
          created_at: new Date().toISOString(),
        },
      ]);
      if (insErr) throw insErr;
    } catch (e) {
      console.warn("[TEP] Profile create skipped/failed:", e?.message || e);
    }
  }

  // ----------------------------
  // SIGN IN (sign-in.html)
  // Expected IDs:
  //  - signin-email
  //  - signin-password
  //  - signin-form  (recommended) OR signin-button
  // ----------------------------
  const signInForm = document.getElementById("signin-form");
  const signInBtn = document.getElementById("signin-button");

  async function handleSignIn(e) {
    if (e) e.preventDefault();

    const email = (document.getElementById("signin-email")?.value || "").trim();
    const password = document.getElementById("signin-password")?.value || "";

    if (!email || !password) {
      setStatus("Please enter your email and password.", true);
      alert("Please enter your email and password.");
      return;
    }

    setStatus("Signing you in…");

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Success
      setStatus("Signed in. Redirecting…");
      goAfterLogin();
    } catch (err) {
      console.error(err);
      setStatus(err?.message || "Sign-in failed.", true);
      alert(err?.message || "Sign-in failed.");
    }
  }

  if (signInForm) signInForm.addEventListener("submit", handleSignIn);
  if (signInBtn) signInBtn.addEventListener("click", handleSignIn);

  // ----------------------------
  // SIGN UP (create-account.html)
  // Expected IDs:
  //  - signup-email
  //  - signup-password
  //  - signup-form  (recommended) OR signup-button
  // ----------------------------
  const signUpForm = document.getElementById("signup-form");
  const signUpBtn = document.getElementById("signup-button");

  async function handleSignUp(e) {
    if (e) e.preventDefault();

    const email = (document.getElementById("signup-email")?.value || "").trim();
    const password = document.getElementById("signup-password")?.value || "";

    if (!email || !password) {
      setStatus("Please enter your email and password.", true);
      alert("Please enter your email and password.");
      return;
    }

    setStatus("Creating your account…");

    try {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;

      // If email confirmations are OFF, data.user will exist immediately
      if (data?.user) {
        await ensureProfileRow(data.user);
      }

      setStatus("Account created. You can sign in now.");
      alert("Account created. You can now sign in.");

      // Optionally redirect to sign-in page
      window.location.href = "sign-in.html";
    } catch (err) {
      console.error(err);
      setStatus(err?.message || "Sign-up failed.", true);
      alert(err?.message || "Sign-up failed.");
    }
  }

  if (signUpForm) signUpForm.addEventListener("submit", handleSignUp);
  if (signUpBtn) signUpBtn.addEventListener("click", handleSignUp);

  // ----------------------------
  // Optional: Sign out button support (any page)
  // Add a button with id="signout-button"
  // ----------------------------
  const signOutBtn = document.getElementById("signout-button");
  async function handleSignOut() {
    try {
      await client.auth.signOut();
      localStorage.removeItem("returnTo");
      window.location.href = "sign-in.html";
    } catch (err) {
      console.error(err);
      alert(err?.message || "Sign-out failed.");
    }
  }
  if (signOutBtn) signOutBtn.addEventListener("click", handleSignOut);
})();
