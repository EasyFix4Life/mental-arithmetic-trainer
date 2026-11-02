# Cloudflare Pages deployment

The production website is **https://whoami.school**. The Cloudflare Pages project is **`whoami-school`**, with the Pages address **https://whoami-school.pages.dev**. `www.whoami.school` redirects to the primary hostname.

Keep [EasyFix4Life/mental-arithmetic-trainer](https://github.com/EasyFix4Life/mental-arithmetic-trainer) private. Preserve the existing application, teaching method, interface, releases, and desktop and mobile packaging.

## Verified deployment

Verified **November 2, 2026**:

| Item | Verified state |
| --- | --- |
| Pages deployment | Production website and Pages.dev address load the existing application |
| Nameservers | Cloudflare nameservers saved at Dynadot and published by the .school registry |
| Cloudflare zone | Active, Free plan |
| Pages custom domains | Apex and www both Active with SSL enabled |
| HTTPS | Both hostnames pass certificate validation |
| HTTP redirects | Apex and www redirect to the primary HTTPS URL |
| www canonical redirect | 301; path and query string preserved |
| Always Use HTTPS | Enabled |

## Production build

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Blank — repository root |
| `NODE_VERSION` | `22` |
| `ELECTRON_SKIP_BINARY_DOWNLOAD` | `1` |
| Runtime environment variables | None |

The application source baseline is commit **`2edc1d91628885a71fe2f176f789de5e9361d99a`**, the v1.1.0 source. Deployment documentation does not change the application. Cloudflare resolved Node `22.23.4` and npm `10.9.9` for the initial production build.

`npm run build` checks TypeScript and builds the static Vite application. Install development dependencies; the web build tools are declared there. Skipping the Electron binary download affects installation in Cloudflare only.

## Domain and DNS

Dynadot remains the registrar. Preserve full registration privacy, domain locking, and account protections. Cloudflare manages DNS on the **Free** plan.

Authoritative nameservers:

- `cecelia.ns.cloudflare.com`
- `vick.ns.cloudflare.com`

| Name | Type | Target | Proxy |
| --- | --- | --- | --- |
| `@` | CNAME | `whoami-school.pages.dev` | Proxied |
| `www` | CNAME | `whoami-school.pages.dev` | Proxied |

Keep both hostnames associated with the Pages project under **Custom domains**. Preserve unrelated DNS records. Do not transfer domain registration to Cloudflare.

The **Single Redirect** named **Redirect www to whoami.school** uses:

- Match expression: `(http.host eq "www.whoami.school") and not starts_with(http.request.uri.path, "/.well-known/")`
- Dynamic destination: `concat("https://whoami.school", http.request.uri.path)`
- Status: **301**
- Preserve query string: **Enabled**

The `/.well-known/` exception lets certificate validation and renewal reach Pages. Keep it when editing the redirect; Cloudflare documents that redirects can block HTTP certificate validation. See [Pages debugging](https://developers.cloudflare.com/pages/configuration/debugging-pages/) and [domain control validation troubleshooting](https://developers.cloudflare.com/ssl/edge-certificates/changing-dcv-method/troubleshooting/).

## HTTPS

The configured SSL/TLS mode is **Full (Strict)**. The minimum TLS version is **1.2**, with TLS **1.3 enabled**. **Always Use HTTPS** is enabled.

Both requested Pages custom domains have SSL enabled, and normal HTTPS requests passed certificate validation without bypasses. Preserve certificate validation paths when changing rules.

## Verification and maintenance

Verification performed **November 2, 2026** against the baseline application:

- All **267 source files** in the local source snapshot matched the GitHub tree by Git blob hash.
- **196 unit tests** across eight files passed.
- Strict TypeScript checking and the production build passed.
- **54 local browser tests** passed across desktop and mobile Chrome emulation, covering Learn, Practice, instructional examples, operand layouts, input rules, scoring, timers, round statistics, navigation, and responsive layout.
- Live Pages.dev browser checks verified both correct and incorrect feedback, timers, multiplication stages and carrying, vertically aligned addition, digit choices, and phone layouts.
- Live whoami.school browser checks verified the complete 18 × 18 walkthrough, all ten answers of a Practice round, the results and timing statistics, navigation, desktop and phone layouts, and an empty warning/error console.
- HTML, JavaScript, and CSS served by whoami.school matched the original web build byte for byte.
- Apex HTTPS returned 200 without redirects. HTTP apex, HTTP www, and HTTPS www returned 301 redirects to the primary HTTPS hostname with paths and queries preserved. Following www reached the application after one redirect.
- The browser followed HTTPS www to the primary homepage without certificate warnings.
- A dummy HTTP certificate-validation path on www returned 200 without an apex redirect.

The isolated local checks used Node `26.11.1` and npm `11.20.0`, with the existing installed dependencies. Mobile layout checks used browser viewport emulation, not a physical phone.

Cloudflare automatically builds the production `main` branch. Use a dedicated branch for focused source or deployment-documentation changes where practical. Before deploying application changes, run `npm test` and `npm run build`. After deployment, exercise Learn and Practice on the live site and check assets, browser errors, desktop and phone layouts, redirects, and HTTPS. Inspect Cloudflare build logs if deployment fails.
