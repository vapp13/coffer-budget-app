const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
// Changes every build, so `activate` always clears out the previous
// version's cache instead of serving stale assets after a deploy.
const buildVersion = String(Date.now());

const serviceWorkerSource = `
// Auto-generated at build time — do not edit directly (see app/sw.js/route.ts).
const CACHE_NAME = "coffer-cache-${buildVersion}";
const BASE_PATH = "${basePath}";
const OFFLINE_URL = BASE_PATH + "/offline/";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([OFFLINE_URL]).catch(() => {
        // Ignore — offline fallback just won't be pre-warmed if this fails.
      })
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop every cache from a previous build so nothing stale lingers.
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never touch cross-origin requests — this is critical for Firebase Auth,
  // Firestore, and any other Google API calls. Those must always go straight
  // to the network so authentication, real-time listeners, and data fetches
  // behave exactly as they would with no service worker at all.
  if (url.origin !== self.location.origin) return;

  // Only GET requests are cacheable; anything else passes through untouched.
  if (request.method !== "GET") return;

  const isNavigation = request.mode === "navigate";

  if (isNavigation) {
    event.respondWith(networkFirstForNavigation(request));
  } else {
    event.respondWith(cacheFirstForStaticAssets(request));
  }
});

async function networkFirstForNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("You're offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function cacheFirstForStaticAssets(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 504 });
  }
}
`;

export async function GET() {
  return new Response(serviceWorkerSource, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
    },
  });
}
