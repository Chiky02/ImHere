#!/usr/bin/env node
/**
 * Checks that PWA assets are not redirected to Vercel SSO
 * (Deployment Protection). That redirect causes the CORS error on
 * manifest.webmanifest and breaks push / install.
 *
 * Usage:
 *   node scripts/check-public-assets.mjs
 *   node scripts/check-public-assets.mjs https://imhere-eight.vercel.app
 */
const base = (process.argv[2] || "https://imhere-eight.vercel.app").replace(
  /\/$/,
  "",
);
const paths = ["/manifest.webmanifest", "/sw.js", "/icon.svg"];

function isSso(url) {
  try {
    const u = new URL(url);
    return u.hostname === "vercel.com" && u.pathname.startsWith("/sso-api");
  } catch {
    return false;
  }
}

async function check(path) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const location = res.headers.get("location") || "";
  const okStatus = res.status >= 200 && res.status < 400;
  const sso =
    isSso(location) ||
    (res.status >= 300 && isSso(new URL(location, url).href));

  return {
    path,
    status: res.status,
    location: location.slice(0, 120),
    ok: okStatus && !sso,
    sso,
  };
}

const results = [];
for (const p of paths) {
  try {
    results.push(await check(p));
  } catch (err) {
    results.push({
      path: p,
      status: 0,
      location: String(err),
      ok: false,
      sso: false,
    });
  }
}

for (const r of results) {
  const mark = r.ok ? "OK " : "FAIL";
  console.log(
    `${mark} ${r.path} → ${r.status}${r.sso ? " (Vercel SSO / Deployment Protection)" : ""}${r.location ? ` loc=${r.location}` : ""}`,
  );
}

if (results.some((r) => r.sso)) {
  console.error(`
Deployment Protection is ON for this deployment.
Fix in Vercel: Project → Settings → Deployment Protection
→ set Production to "None" (or disable Standard Protection for Production).

Until then, /manifest.webmanifest redirects to vercel.com/sso-api and the
browser reports a CORS error. Push/PWA will not work reliably.
`);
  process.exit(1);
}

if (results.some((r) => !r.ok)) {
  process.exit(1);
}

console.log("Public PWA assets look reachable without SSO.");
