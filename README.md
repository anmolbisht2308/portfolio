# Anmol Bisht: Portfolio

**Real-time, human.** A portfolio designed as a live, breathing network: precise and engineered, calm and warm.

Built with Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · React Three Fiber · GSAP + ScrollTrigger + SplitText · Lenis · Motion.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build (use this for perf checks)
npm run lint
```

Deploys to Vercel with zero config. Set `NEXT_PUBLIC_SITE_URL` once you have a custom domain (used for canonical URL, sitemap, OG); otherwise Vercel's production URL is used automatically.

## Editing content

**Everything you'd want to change lives in [`src/content/content.ts`](src/content/content.ts).** Placeholders marked `[ADD]`:

- `site.github`: your GitHub URL (GitHub links stay hidden while empty)
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
   ├─ global/           Nav, Preloader (+ head IntroScript), Cursor, Grain, ScrollStream
   ├─ three/            SceneMount (deferred) → SceneCanvas → NetworkScene; scene-store bridges scroll → WebGL
   ├─ sections/         Hero, healo/{HealoSection, ChatStream, ArchitectureDiagram, Collaborations, ImpactStats}
   └─ ui/               Headline (CSS word reveal), SplitReveal, Magnetic, Counter
```

## How the motion system works

- **Tokens** are defined once in `globals.css` (`--ease-signal`, `--ease-transit`, …) and mirrored in `lib/motion.ts`. GSAP registers the same curves as CustomEases, so CSS, GSAP and Motion all share one feel.
- **One WebGL canvas**, fixed behind the page. Sections marked `data-scene` wake it; elsewhere, or when the tab is hidden, the render loop is stopped (`frameloop="never"`). Scroll choreography writes plain numbers into `scene-store.ts` (`dolly`, `calm`, `converge`), and the scene reads them per frame. No React re-renders are involved.
- **Adaptive quality:** `lib/device-tier.ts` picks a starting tier (node, packet and dust counts, DPR, bloom). drei's `PerformanceMonitor` steps it down if FPS drops. Bloom is only enabled on the high tier.
- **3D is deferred** until the first interaction (or 4.5s) so it never competes with first paint or hydration.
- **Hero headline** is split on the server and revealed with pure CSS, so the LCP element paints immediately (under the preloader) without waiting on JS.
- **Reduced motion:** no Lenis, no pinning, no preloader, and the 3D scene renders one still frame. Reveals become short fades. The chat demo still works but shows replies instantly.

## Quality checks (local production build, Lighthouse 12)

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile (simulated 4G, 4× CPU) | 90 | 100 | 100 | 100 |
| Desktop | 99 | 100 | 100 | 100 |
