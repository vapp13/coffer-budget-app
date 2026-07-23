/** @type {import('next').NextConfig} */

// Set by the GitHub Actions workflow to "/<repo-name>" for project pages
// (https://username.github.io/repo-name/). Left empty for local dev, and
// for a user/org page repo (username.github.io) which is served at the root.
const basePath = process.env.BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  // Static export: this app has no server routes, middleware, or SSR data
  // fetching — everything talks to Firebase directly from the browser — so
  // it can be hosted as plain static files on GitHub Pages.
  output: "export",
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
};

export default nextConfig;
