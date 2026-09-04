# AI usage log

This file is a lightweight record of **when** AI was used in the project, **what** it helped with, and **why** it was used (for transparency in process and reporting). Backfilled 2026-08-25 from the per-session "AI usage log" tables already kept in each blog entry (`../../Documents/StockholmJobVault/.../DH2323/blog/`). This file aggregates them, it doesn't replace them.

| Date (ISO) | AI (role/tool) | What | Why |
|---|---|---|---|
| 2026-04-21/22 | Perplexity | Initial tech-stack exploration; generated a full spec draft under the working title "Liminal" | Didn't know what stack the course would accept: needed a starting direction fast, before the voluntary spec deadline |
| 2026-04-23 | Claude Code (Sage) | Formula breakdown (SDF circle, Quilez soft-shadow accumulator), multi-character shadow insight, documentation structure, video research | The math was clicking conceptually but not yet in a form I could write in GLSL: needed it broken down before touching code |
| 2026-04-24 | Perplexity (Claude Sonnet 4.6 Thinking) | Normal-mapping understanding, the flat-characters-vs-normal-mapped-environment design decision, pipeline structure | Had a professor deadline that day and needed the scope decision locked before the help session |
| 2026-04-24 | (not logged) | First shader (UV gradient + mouse-driven point light) built without a recorded AI session | Concepts from earlier sessions were understood well enough to write this one directly |
| 2026-04-27 | Claude Code (Sage) | Diagnosed why `loadShader()` was failing (corrupted `.frag` file, missing `.vert`), fixed the shader files, explained the Sobel math | Stuck on a silent GLSL compile failure with no visible browser error: needed a second pass on the actual root cause |
| 2026-04-28 | Claude Code (Sage) | N·L diffuse formula explanation, Real-Time Rendering citation, attenuation formula | Wanted the Lambertian model grounded in a primary source before writing it into the shader, not just copying a formula |
| 2026-04-28 | Claude Code (Sage) | Framebuffer / multi-pass architecture explanation | Needed to understand why a single shader can't do lighting + shadow + post-processing in one pass before restructuring `draw()` |
| 2026-04-28 | Claude Code (Sage) | SDF formula explanation, `blendMode` diagnosis, debugged an empty `shadow.vert` that had silently corrupted the whole WebGL state | The pipeline broke completely after adding the shadow shader and the failure mode (N·L lighting also stopped responding) pointed nowhere obvious |
| 2026-05-04 | Claude Code (Sage) | Quilez soft-shadow formula explanation, diagnosed a GLSL compile error caused by comment text wrapped across line breaks, fixed `shadow.frag` | Shadow pass silently produced nothing after a copy-paste; needed to find that the failure was a comment syntax error, not a logic bug |
| 2026-05-04 | Claude Code (Sage) | Post-processing architecture (bloom, Reinhard tone mapping, vignette, film grain), all shader code, color-grade design | Wanted the full darkroom-style post pass built and explained together rather than one effect at a time |
| 2026-05-06 | Claude Code (Sage) | Game architecture (UV-space uniformity for player/light), divide-by-zero guard on Charlie's pursuit vector, speed-tuning rationale | Hit a real bug (shader going full white from a NaN) that took 10 minutes to trace to a JS division-by-zero, not the shader |
| 2026-08-07 | Claude Code (Sage) | State machine design (start/playing/gameover), DOM-overlay-over-canvas approach after WEBGL `text()` failed, dead shader file cleanup, terminal start-screen copy and pacing | First session back after a summer break: needed to re-establish architecture fast and fix a game that had no beginning or end state |
| 2026-08-10 | Claude Code (Sage) | Web Audio synthesis, dialogue rewrite | New systems needed building from scratch under deadline pressure |
| 2026-08-17 | Claude Code (Sage) | Furniture SDF shadows, diagnosed and fixed a UV-vs-pixel-space stretching bug, diagnosed and fixed a self-shadowing bug | A screenshot showed furniture shadows badly stretched and self-shadowing |
| 2026-08-27 | Claude Code (Sage) | Read all 14 blog entries against the full codebase | Wanted an honest audit of what the diary claimed against what the code actually did |

---
