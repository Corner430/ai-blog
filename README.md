# Corner430 AI Blog

A modern blog built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/), integrated with [Tencent Hunyuan AI](https://cloud.tencent.com/document/product/1729).

Based on [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) v2.

## AI Features

- **AI Summary** — Auto-generated article summaries with streaming output. Cached in localStorage (keyed by `slug + contentHash`) to avoid repeated API calls.
- **AI Q&A** — Floating chat panel on article pages. Readers ask questions about the current article; AI answers based on article content with multi-turn conversation support.
- **Semantic Search** — Replaces the default KBar search. Embedding index is generated at build time (`public/embedding-index.json`), and queries are matched via cosine similarity at runtime.
- **Auto Tags** — AI-suggested tags for articles, managed through the admin dashboard with checkbox selection and frontmatter write-back.
- **Cover Image Generation** — Async task model (submit job -> poll status -> preview/download). Powered by Hunyuan image generation API.
- **Writing Assistant** — AI-powered polish and continue-writing with streaming output, copy, and replace-to-editor support.

All AI features gracefully degrade when `HUNYUAN_API_KEY` is not configured — APIs return `503`, and frontend components handle errors without breaking the page.

## Admin Dashboard

Access at `/admin` (not exposed in the public navigation bar).

- **Cover Image Generation** (`/admin/cover`) — Input title + summary, submit generation task, poll progress, preview result, download image or copy URL.
- **Auto Tags** (`/admin/tags`) — Browse article list, generate AI tag suggestions, select/deselect tags, write selected tags to MDX frontmatter.
- **Writing Assistant** (`/admin/writing`) — Input text, choose polish or continue-writing, view streaming result, copy or replace back to editor.

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 15 (App Router) | React Server Components |
| Language | TypeScript | Type-safe |
| Styling | Tailwind CSS 4 | Dark/light theme support |
| Content | MDX + Contentlayer | Markdown with embedded React components |
| AI Text | Tencent Hunyuan (OpenAI-compatible) | `ai` v6 (Vercel AI SDK) + `openai` v6 |
| AI Image | Hunyuan Image Generation (OpenAI-compatible) | Async job-based API |
| E2E Testing | Playwright | 16 spec files, `page.route()` API mocking |
| Unit Testing | Jest + React Testing Library | 95 tests across lib/API/component layers |
| Deployment | Vercel | Git push auto-deploy |
| Comments | Giscus | Based on GitHub Discussions |

## Project Structure

```
app/
├── api/
│   ├── ai/
│   │   ├── summary/route.ts      # AI summary (streaming)
│   │   ├── chat/route.ts         # AI Q&A (streaming)
│   │   ├── search/route.ts       # Semantic search
│   │   ├── tags/route.ts         # Auto tag generation
│   │   ├── cover/submit/route.ts # Cover image job submission
│   │   ├── cover/query/route.ts  # Cover image job polling
│   │   └── writing/route.ts      # Writing assistant (streaming)
│   └── admin/
│       ├── articles/route.ts     # Read article list from data/blog/
│       └── tags/write/route.ts   # Write tags to MDX frontmatter
├── admin/
│   ├── page.tsx                  # Admin dashboard home
│   ├── cover/page.tsx            # Cover image management
│   ├── tags/page.tsx             # Tag management
│   └── writing/page.tsx          # Writing assistant
components/
├── ai/
│   ├── AiSummary.tsx             # Streaming summary (with localStorage cache)
│   ├── AiChat.tsx                # Floating Q&A panel
│   └── AiSearch.tsx              # Semantic search modal
lib/
├── hunyuan.ts                    # Hunyuan text API wrapper (OpenAI SDK)
├── hunyuan-image.ts              # Hunyuan image API wrapper (OpenAI-compatible)
└── embeddings.ts                 # Embedding index & cosine similarity utils
scripts/
└── generate-embeddings.mjs       # Build-time embedding index generation
e2e/
├── helpers/mock-api.ts           # Shared API mock utilities
├── homepage.spec.ts              # Homepage tests
├── navigation.spec.ts            # Desktop navigation tests
├── mobile-nav.spec.ts            # Mobile navigation tests (390x844)
├── search.spec.ts                # Search tests
├── theme-switch.spec.ts          # Theme toggle tests
├── blog-list.spec.ts             # Blog list page tests
├── blog-post.spec.ts             # Blog post detail tests
├── ai-chat.spec.ts               # AI Q&A tests
├── ai-summary.spec.ts            # AI summary tests
├── tags-page.spec.ts             # Tags page tests
├── admin.spec.ts                 # Admin dashboard tests
├── admin-cover.spec.ts           # Cover image generation tests
├── admin-tags.spec.ts            # Auto tag management tests
├── admin-writing.spec.ts         # Writing assistant tests
├── scroll-top.spec.ts            # Scroll-to-top tests
└── not-found.spec.ts             # 404 page tests
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/summary` | Generate article summary (streaming) |
| POST | `/api/ai/chat` | Article Q&A with conversation history (streaming) |
| POST | `/api/ai/search` | Semantic search via embedding cosine similarity |
| POST | `/api/ai/tags` | Generate tag suggestions for article content |
| POST | `/api/ai/cover/submit` | Submit cover image generation job, returns `jobId` |
| GET | `/api/ai/cover/query?jobId=` | Poll cover image job status |
| POST | `/api/ai/writing` | Polish or continue-write article text (streaming) |
| GET | `/api/admin/articles` | List all MDX articles with frontmatter and content |
| POST | `/api/admin/tags/write` | Write tags to an MDX file's frontmatter |

## Getting Started

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and set the Hunyuan API key:

```bash
cp .env.example .env.local
```

```env
# Required for AI features (text generation, image generation, embeddings)
HUNYUAN_API_KEY=your_api_key_here
```

Get your API key from the [Tencent Cloud Console](https://console.cloud.tencent.com/).

AI features work without configuration — they simply degrade gracefully (return 503).

### 3. Run development server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

### Unit tests (Jest)

```bash
npx jest
```

95 tests covering lib utilities, API routes, and React components.

### E2E tests (Playwright)

```bash
npx playwright install   # first time only
yarn e2e
```

62 tests covering all pages and interactions. AI APIs are mocked via `page.route()` — no real API key needed for E2E tests.

## Build

```bash
yarn build
```

The build process includes:
1. Next.js production build (with Contentlayer)
2. Post-build processing (`scripts/postbuild.mjs`)
3. Embedding index generation (`scripts/generate-embeddings.mjs`) — skips gracefully if `HUNYUAN_API_KEY` is not set

## Documentation

See [docs/plan.md](docs/plan.md) for the full implementation plan.

## License

[MIT](LICENSE)
