package local.jeff.mentalarithmetic;

import java.net.URI;
import java.net.URISyntaxException;

/** Pure URL policy, kept independent of Android for direct regression checks. */
final class AssetPathPolicy {
    static final String HOST = "appassets.androidplatform.net";
    static final String APP_URL = "https://" + HOST + "/index.html";
    static final String CONTENT_SECURITY_POLICY = String.join("; ",
            "default-src 'none'",
            "script-src 'self'",
            "style-src 'self'",
            "img-src 'self'",
            "font-src 'self'",
            "connect-src 'none'",
            "object-src 'none'",
            "base-uri 'none'",
            "form-action 'none'",
            "frame-ancestors 'none'");

    private AssetPathPolicy() {}

    private static URI parseLocalUrl(String value) {
        try {
            URI uri = new URI(value);
            if (!"https".equals(uri.getScheme())
                    || !HOST.equals(uri.getRawAuthority())
                    || uri.getRawQuery() != null) return null;
            return uri;
        } catch (URISyntaxException | NullPointerException error) {
            return null;
        }
    }

    static boolean isAppDocument(String value) {
        URI uri = parseLocalUrl(value);
        return uri != null && "/index.html".equals(uri.getRawPath());
    }

    /** Return an AssetManager-relative path, never a filesystem path. */
    static String assetPath(String value) {
        URI uri = parseLocalUrl(value);
        if (uri == null || uri.getRawFragment() != null) return null;
        String path = uri.getPath();
        if (path == null || path.indexOf('\\') >= 0 || path.indexOf('\0') >= 0) return null;
        for (String segment : path.split("/", -1)) {
            if (segment.equals(".") || segment.equals("..")) return null;
        }
        if (!path.equals("/index.html") && !path.matches("/assets/[A-Za-z0-9_./-]+")) return null;
        return "www" + path;
    }

    static String mimeType(String assetPath) {
        if (assetPath.endsWith(".html")) return "text/html";
        if (assetPath.endsWith(".js") || assetPath.endsWith(".mjs")) return "text/javascript";
        if (assetPath.endsWith(".css")) return "text/css";
        if (assetPath.endsWith(".json")) return "application/json";
        if (assetPath.endsWith(".svg")) return "image/svg+xml";
        if (assetPath.endsWith(".png")) return "image/png";
        if (assetPath.endsWith(".webp")) return "image/webp";
        if (assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg")) return "image/jpeg";
        if (assetPath.endsWith(".woff2")) return "font/woff2";
        if (assetPath.endsWith(".woff")) return "font/woff";
        return "application/octet-stream";
    }
}
