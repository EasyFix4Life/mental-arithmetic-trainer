'use strict';

const path = require('node:path');

const APP_URL = 'app://trainer/index.html';
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

function parseAppUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'app:' || url.host !== 'trainer'
      || url.username || url.password || url.search) return null;
    return url;
  } catch {
    return null;
  }
}

// Main-frame navigation stays on the single bundled application document.
function isAllowedAppUrl(value) {
  const url = parseAppUrl(value);
  return url !== null && url.pathname === '/index.html';
}

// Only the document and Vite's generated asset directory are reachable. No
// filesystem URL or path from a renderer is passed directly to net.fetch.
function resolveAssetPath(distRoot, requestUrl) {
  const url = parseAppUrl(requestUrl);
  if (!url) return null;
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (pathname.includes('\\') || pathname.includes('\0')) return null;
  const segments = pathname.split('/');
  if (segments.some((segment) => segment === '.' || segment === '..')) return null;
  if (pathname !== '/index.html' && !/^\/assets\/[A-Za-z0-9_./-]+$/.test(pathname)) return null;
  const root = path.resolve(distRoot);
  const resolved = path.resolve(root, `.${pathname}`);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

module.exports = {
  APP_URL,
  CONTENT_SECURITY_POLICY,
  isAllowedAppUrl,
  resolveAssetPath,
};
