# Cloudflare Pages deployment

Deployment target: **https://whoami.school**. The Cloudflare Pages project is **`whoami-school`**, with the verified Pages address **https://whoami-school.pages.dev**. The intended primary hostname is `whoami.school`; `www.whoami.school` redirects to it.

Keep [EasyFix4Life/mental-arithmetic-trainer](https://github.com/EasyFix4Life/mental-arithmetic-trainer) private. Preserve the existing application, teaching method, interface, releases, and desktop and mobile packaging.

## Activation status

Status checked **November 2, 2026**. Treat pending items as unfinished until verified.

| Item | Verified state |
| --- | --- |
| Pages deployment | Pages.dev website verified |
| Dynadot nameservers | Cloudflare nameservers saved in Dynadot |
| Cloudflare zone | Pending registry nameserver propagation and activation |
| Apex Pages custom domain | Association pending |
| Custom-domain HTTPS certificate | Provisioning and validity pending |
| Always Use HTTPS | Pending |

The DNS records and redirect configuration below describe the configured routing. They do not establish that public DNS, the custom-domain certificate, or the apex website is ready.

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

The deployment baseline is commit **`2edc1d91628885a71fe2f176f789de5e9361d99a`**, the v1.1.0 source. Cloudflare resolved Node `22.23.4` and npm `10.9.9` for the initial build.

`npm run build` checks TypeScript and builds the static Vite application. Install development dependencies; the web build tools are declared there. Skipping the Electron binary download affects installation in Cloudflare only.

## Domain and DNS

Dynadot remains the registrar. Preserve registration privacy, domain locking, and account protections. Cloudflare manages DNS on the **Free** plan.

Nameservers saved at Dynadot:

- `cecelia.ns.cloudflare.com`
- `vick.ns.cloudflare.com`

| Name | Type | Target | Proxy |
| --- | --- | --- | --- |
| `@` | CNAME | `whoami-school.pages.dev` | Proxied |
| `www` | A | `192.0.2.1` | Proxied |

Keep the apex hostname associated with the Pages project under **Custom domains** once activation completes.

The `www` address is a placeholder for Cloudflare's edge redirect; it does not host application files. The **Single Redirect** configuration is:

- Match expression: `(http.host eq "www.whoami.school")`
- Dynamic destination: `concat("https://whoami.school", http.request.uri.path)`
- Status: **301**
- Preserve query string: **Enabled**

Preserve unrelated DNS records. Do not transfer domain registration to Cloudflare.

## HTTPS

The configured minimum TLS version is **1.2**, with TLS **1.3 enabled**.

After nameserver propagation, verify Cloudflare activation, the Pages custom-domain status, and certificate provisioning. Enable and verify **Always Use HTTPS** when available. Confirm that HTTP requests reach HTTPS, both HTTPS hostnames present valid certificates, and `www` redirects to the apex while preserving paths and query strings. Update the activation status above only after these checks pass.

## Verification and maintenance

Verification performed **November 2, 2026** against the baseline source:

- All **267 source files** in the local source snapshot matched the GitHub tree by Git blob hash.
- **196 unit tests** across eight files passed.
- Strict TypeScript checking and the production build passed.
- **54 browser tests** passed across desktop and mobile Chrome emulation, covering Learn, Practice, instructional examples, operand layouts, input rules, scoring, timers, round statistics, navigation, and responsive layout.
- Deployed Pages.dev assets were verified byte-identical to the production build.

The isolated local checks used Node `26.11.1` and npm `11.20.0`, with the existing installed dependencies. Mobile Chrome emulation is not physical-device or Safari testing.

Cloudflare builds the production `main` branch. Use a dedicated branch for focused source or deployment-documentation changes where practical. Before deploying application changes, run `npm test` and `npm run build`. After deployment, exercise Learn and Practice on the live site and check assets, browser errors, desktop and mobile layouts, redirects, and HTTPS. Inspect Cloudflare build logs if deployment fails.
