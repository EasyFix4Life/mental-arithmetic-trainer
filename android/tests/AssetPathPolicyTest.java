package local.jeff.mentalarithmetic;

import java.util.Objects;

/** Run with javac/java; no Android device or third-party test runtime required. */
public final class AssetPathPolicyTest {
    private static int assertions;

    private static void equal(Object actual, Object expected, String label) {
        assertions++;
        if (!Objects.equals(actual, expected)) {
            throw new AssertionError(label + ": expected " + expected + ", got " + actual);
        }
    }

    public static void main(String[] args) {
        String origin = "https://appassets.androidplatform.net";
        equal(AssetPathPolicy.assetPath(origin + "/index.html"), "www/index.html", "document");
        equal(AssetPathPolicy.assetPath(origin + "/assets/index-a_B123.js"),
                "www/assets/index-a_B123.js", "bundled module");
        equal(AssetPathPolicy.assetPath(origin + "/assets/nested/font.woff2"),
                "www/assets/nested/font.woff2", "nested bundled asset");
        equal(AssetPathPolicy.isAppDocument(origin + "/index.html"), true, "single document");
        equal(AssetPathPolicy.isAppDocument(origin + "/index.html#lesson"), true, "same document fragment");

        String[] blocked = {
                "http://appassets.androidplatform.net/index.html",
                "https://example.com/index.html",
                "https://appassets.androidplatform.net.evil.example/index.html",
                "https://appassets.androidplatform.net:443/index.html",
                "https://user@appassets.androidplatform.net/index.html",
                "https://appassets.androidplatform.net/index.html?tracking=1",
                "https://appassets.androidplatform.net/index.html#fragment",
                "https://appassets.androidplatform.net/",
                "https://appassets.androidplatform.net/private.txt",
                "https://appassets.androidplatform.net/assets/../index.html",
                "https://appassets.androidplatform.net/assets/%2e%2e/index.html",
                "https://appassets.androidplatform.net/assets/./index.js",
                "https://appassets.androidplatform.net/assets/%252e%252e/index.html",
                "https://appassets.androidplatform.net/assets/abc%00.js",
                "https://appassets.androidplatform.net/assets/abc%5cdef.js",
                "file:///data/data/local.jeff.mentalarithmetic/private.xml",
                "content://local.jeff.mentalarithmetic/private.xml",
                "javascript:alert(1)",
                "data:text/html,hello",
                "not a valid URI",
                null
        };
        for (String value : blocked) equal(AssetPathPolicy.assetPath(value), null, "blocked " + value);
        equal(AssetPathPolicy.isAppDocument(origin + "/assets/index.js"), false, "no module navigation");
        equal(AssetPathPolicy.isAppDocument("https://example.com/index.html"), false, "no external navigation");
        equal(AssetPathPolicy.mimeType("www/index.html"), "text/html", "HTML MIME");
        equal(AssetPathPolicy.mimeType("www/assets/index.js"), "text/javascript", "module MIME");
        equal(AssetPathPolicy.mimeType("www/assets/index.css"), "text/css", "stylesheet MIME");
        equal(AssetPathPolicy.CONTENT_SECURITY_POLICY.contains("connect-src 'none'"), true, "no network CSP");
        equal(AssetPathPolicy.CONTENT_SECURITY_POLICY.contains("script-src 'self'"), true, "local script CSP");
        System.out.println("Asset URL policy: " + assertions + " assertions passed.");
    }
}
