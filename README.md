# Let Me Ask Charlie (DH2323)

Course project repo for **DH2323** (KTH) by **Ashmit Deb Roy**.

- **Play (lit)**: ``
- **Play (flat/unlit comparison)**: ``
- **Blog and project log**: ``
- **Repo**: `https://github.com/ashmitroy/Charlie-chat-DH2323`

## Project status
- Rendering pipeline, game loop, and chase pacing are complete.
- Report is complete, including real user study results (n = 8).
- Blog is 15 entries, all published.
- Game and blog are both live on GitHub Pages.

## Folder structure
```
dh2323-charlie-chat/
├─ docs/                 ← GitHub Pages root (blog + published game copy)
│  ├─ index.html         ← project log / blog index
│  ├─ entries/           ← published blog entries (HTML)
│  ├─ media/             ← screenshots and recordings referenced by entries
│  └─ play/              ← published mirror of src/, this is what's actually live
├─ src/                  ← game source of truth
│  ├─ index.html         ← p5.js game entry point
│  ├─ shaders/           ← all GLSL .frag and .vert files
│  ├─ js/                ← game logic, state machine, audio
│  └─ textures/          ← height map used for materials/normals
├─ report/               ← the academic report
│  ├─ report.md           ← Markdown draft
│  ├─ references.md       ← IEEE-style reference list
│  ├─ user-study-form.md  ← consent text and printable rating sheet
│  ├─ user-study-data/    ← raw per-participant response CSVs
│  └─ latex/              ← main.tex + references.bib, IEEE conference format
├─ ai-log.md             ← AI usage log, mirrors each blog entry's own table
└─ README.md
```

`docs/play/` is a mirror of `src/`, copied in at publish time since GitHub Pages only serves `docs/`. `src/` is where the game actually gets edited; `docs/play/` gets re-synced from it on each publish.

## Setup (local dev)
This project is designed to be a static site (no build step required).

### Option A: VS Code
- Open `src/index.html` in Live Server.

### Option B: Python HTTP server
From repo root:

```bash
python3 -m http.server 8000
```

Then open:
- Game: `http://localhost:8000/src/index.html`
- Blog: `http://localhost:8000/docs/`

## Deployment notes
- `docs/` is the **only** directory served by GitHub Pages.
- The game's source of truth is `src/`; after editing it, re-copy into `docs/play/` before pushing, or the live site won't reflect the change.
- Do not edit `docs/play/` directly, it's a generated copy.

## Before pushing to `main`
- Run the game locally and confirm it loads without console errors.
- If `src/` changed, confirm `docs/play/` was re-synced from it.
- Verify the blog still renders from `docs/`.
