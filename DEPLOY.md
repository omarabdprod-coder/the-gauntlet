# Deploying The Gauntlet

The Gauntlet is a **static site** (flat HTML/CSS/JS, no build step, no backend). That makes it
cheap, simple, and — on the right host — extremely fast everywhere in the world.

## Recommended host: Cloudflare Pages (free, global CDN)

Cloudflare Pages serves your files from **300+ edge locations** worldwide with unlimited bandwidth,
free TLS, and automatic HTTP/2 + Brotli. This is the answer to "vast, not slow": users load it from
a server physically near them, anywhere on earth.

1. Push this repo to GitHub (see below).
2. Go to **dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git**.
3. Pick the repo. Build settings:
   - **Framework preset:** None
   - **Build command:** _(leave empty)_
   - **Build output directory:** `/`
4. **Save and Deploy.** You get a live URL like `https://the-gauntlet.pages.dev` in ~30 seconds.

(Netlify and GitHub Pages work identically — drag-and-drop or connect-the-repo, no build command. Cloudflare just has the widest, fastest edge network of the free options.)

## Custom domain (GitHub Student Pack)

The Student Pack includes a **free `.me` domain for a year from Namecheap** (and `.tech`, `.live`, etc. from others).

1. Claim it: **education.github.com/pack → Namecheap → Get your domain**.
2. In **Cloudflare Pages → your project → Custom domains → Set up a domain**, enter your domain.
3. Cloudflare shows you DNS records (or asks you to change nameservers). In Namecheap's dashboard,
   point the domain at Cloudflare (nameservers is easiest). Propagation is usually minutes.
4. TLS is automatic.

## After deploy — one edit

The social share tags in `index.html` use a placeholder domain. Find-and-replace
`https://the-gauntlet.pages.dev` with your real domain in these tags so link previews and the
share image resolve correctly:

- `<link rel="canonical">`
- `og:url`, `og:image`, `twitter:image`

Then test the preview card at **opengraph.xyz** or **cards-dev.twitter.com/validator**.

## Notes

- **Service worker (`sw.js`)** caches assets for instant repeat loads + offline play, but is
  network-first for the page so new deploys still appear. Bump `CACHE = 'gauntlet-vN'` in `sw.js`
  after a big change to force a clean refresh for returning players.
- **Not deployed but in the repo:** `serve.js`, `tools/`, `data/csv/`, `*.bat`, `.claude/` are dev
  tooling — harmless to ship, or delete before deploy if you want a lean public tree.
- No environment variables, secrets, or server config needed. It just works.
