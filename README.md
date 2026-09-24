# Anmol Bisht: Portfolio

**Real-time, human.** A portfolio designed as a live, breathing network: precise and engineered, calm and warm.

Built with Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · React Three Fiber · GSAP + ScrollTrigger + SplitText · Lenis · Motion.

## Sections

1. **Hero:** a live 3D network where packets hop between nodes like WebSocket messages, reacting to the cursor and to scroll (camera dolly). Masked word-by-word headline and a telemetry readout.
2. **About:** pinned; sentences light up line by line while the network settles into a calm ring.
3. **Healo:** pinned case study. A token-streaming chat demo (stop/regenerate) drives packets through an SVG architecture diagram; five scroll chapters; collaborators; count-up impact stats. On mobile the chapters become a swipe carousel.
4. **Stack:** the skills as a system map. Hover or focus a skill to light its wires to the products it powers; on mobile, grouped chips that expand to show where each skill is used.
5. **Log:** experience as a packet trace. Each role arrives as a message, and the Infiheal roles form a promotion path.
6. **Activity:** your GitHub contribution calendar as a 3D city of days, one bar per day, like GitHub's graph. Pick a year and bars morph in a wave, a scan line sweeps the weeks, and hover or tap reads out any day. The busiest day glows amber.
7. **Other work:** 3D-tilt cards with pointer-following light and a magnetic drift.
8. **Contact:** the network converges into a single node that *becomes* the call-to-action; copy-to-clipboard email, LinkedIn, GitHub, résumé.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build (use this for perf checks)
npm run lint
```

Deploys to Vercel with zero config.

### GitHub contributions data

The Activity section reads `site.githubUsername` from `content.ts`. Data is fetched on the server at build time and refreshed daily (ISR), so visitors never wait on GitHub:

- **Recommended:** add a `GITHUB_TOKEN` environment variable in Vercel (a fine-grained token with *no* permissions is enough for public contributions). This uses GitHub's official GraphQL API.
- **Without a token:** it falls back to the public `github-contributions-api.jogruber.de` service.
- **If both are unreachable:** it renders clearly labelled sample data, so a deploy never fails because of GitHub.

Set `NEXT_PUBLIC_SITE_URL` once you have a custom domain (used for canonical URL, sitemap, OG); otherwise Vercel's production URL is used automatically.

## Editing content

**Everything you'd want to change lives in [`src/content/content.ts`](src/content/content.ts).** Placeholders marked `[ADD]`:

- `site.githubUsername` / `site.github`: set to `anmolbisht2308` (this repo's owner); change them if that's not your profile
- `public/resume.pdf`: drop your résumé here (linked from the nav)
- `work[].image`: screenshots for the Other Work section

The Healo architecture diagram's node labels (`healo.arch`) and the scroll chapters (`healo.steps`) are also in `content.ts`, so you can correct any detail of the system description there. Chat-demo replies (`healo.chat`) are illustrative and labelled as such on the page.

## Structure

```
src/
├─ app/                 layout (fonts, metadata), page, OG image, sitemap, robots, icon
├─ content/content.ts   all copy, typed
├─ lib/                 gsap (plugin registration + custom eases), motion tokens, device tier, hooks
└─ components/
   ├─ providers/        SmoothScroll (Lenis on GSAP's ticker)
   ├─ global/           Nav, Footer, Preloader (+ head IntroScript), Cursor (+ lazy CursorMount), Grain, ScrollStream
   ├─ three/            SceneMount (deferred) → SceneCanvas → NetworkScene; scene-store bridges scroll → WebGL
   ├─ sections/         Hero, about/, healo/{HealoSection, HealoStage, ChatStream, ArchitectureDiagram, …},
   │                    skills/{SystemMap, SkillList}, experience/, work/, contact/
   └─ ui/               Headline (CSS word reveal), SplitReveal, SectionHeader, Magnetic, TiltCard, Counter, CopyEmail
```

## How the motion system works

- **Tokens** are defined once in `globals.css` (`--ease-signal`, `--ease-transit`, …) and mirrored in `lib/motion.ts`. GSAP registers the same curves as CustomEases, so CSS, GSAP and Motion all share one feel.
- **One WebGL canvas**, fixed behind the page. Sections marked `data-scene` wake it; elsewhere, or when the tab is hidden, the render loop is stopped (`frameloop="never"`). Scroll choreography writes plain numbers into `scene-store.ts` (`dolly`, `calm`, `converge`), and the scene reads them per frame. No React re-renders are involved.
- **Adaptive quality:** `lib/device-tier.ts` picks a starting tier (node, packet and dust counts, DPR, bloom). drei's `PerformanceMonitor` steps it down if FPS drops. Bloom is only enabled on the high tier.
- **3D is deferred** until the first interaction (desktop also wakes after 4.5s), so it never competes with first paint or hydration. Phones stay WebGL-free until the first touch or scroll.
- **Hero headline and lead** are revealed with pure CSS. They paint in place under the preloader, so LCP registers at first paint without waiting on JS.
- **Reduced motion:** no Lenis, no pinning, no preloader, and the 3D scene renders one still frame. Reveals become short fades. The chat demo still works but shows replies instantly.
- **Who does what:** GSAP drives everything scroll-linked, plus the spring-based magnetic buttons and card tilt (`quickTo`, no React renders). Motion powers the morphing cursor, which is lazy-loaded on fine-pointer devices only, keeping Motion out of the critical bundle. Small enter/exit transitions are CSS keyframes built on the same easing tokens.

## Performance architecture

- Every section is wrapped in `<Suspense>`, so React hydrates them one at a time instead of in one long task. Below-the-fold sections are also split into their own chunks (still server-rendered).
- `useLazyGSAP` defers a section's GSAP/ScrollTrigger setup until it's within a viewport of the screen. Pinned sections (About, Healo) are set up eagerly, because a pin adds scroll distance and adding it late would shift anchor-link targets.
- `SplitReveal` splits text lazily, just before it scrolls into view.
- Only the display font (the LCP face) is preloaded.

## Quality checks (local production build, Lighthouse 12)

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile (simulated 4G, 4× CPU) | 92–95 | 100 | 100 | 100 |
| Mobile (DevTools-throttled, real 4× CPU) | 90 | 100 | 100 | 100 |
| Desktop | 99 | 100 | 100 | 100 |

CLS is 0 everywhere. Check again on your deployed URL with PageSpeed Insights: real CDN latency differs from localhost.
