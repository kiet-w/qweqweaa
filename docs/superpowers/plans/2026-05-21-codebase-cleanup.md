# Codebase Cleanup and Documentation Organization Implementation Plan (Refined)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up redundant files and organize documentation into thematic subdirectories within `docs/`.

**Architecture:** Use thematic subfolders (`learning`, `guides`, `visuals`, `meta`, `explanations`) for clear categorization.

---

### Task 1: Cleanup (DONE)
- [x] Delete `app.log`, `src_explanation.html`, `.py` scripts.

### Task 2: Granular Documentation Organization

**Files:**
- Move to `docs/learning/`: `docs/LEARN.md`, `docs/ENTERPRISE_BACKEND_ROADMAP.md`, `docs/NESTJS_MENTAL_MODEL.md`, `docs/NESTJS_RESTAURANT_METAPHOR.md`
- Move to `docs/guides/`: `docs/RTK.md`, `docs/PRISMA_EXPLANATION.md`, `docs/REDIS_GUIDE.md`, `docs/SUPABASE_PRISMA_GUIDE.md`
- Move to `docs/visuals/`: `docs/nestjs-restaurant.html`, `docs/nestjs-system-design.html`, `docs/restaurant_flow_illustration.png`
- Move to `docs/meta/`: `docs/CODE_REVIEW_GRAPH.md`

- [ ] **Step 1: Create new directories**

Run: `mkdir -p docs/learning docs/guides docs/visuals docs/meta`

- [ ] **Step 2: Move files into thematic directories**

Run:
```bash
mv docs/LEARN.md docs/learning/
mv docs/ENTERPRISE_BACKEND_ROADMAP.md docs/learning/
mv docs/NESTJS_MENTAL_MODEL.md docs/learning/
mv docs/NESTJS_RESTAURANT_METAPHOR.md docs/learning/
mv docs/RTK.md docs/guides/
mv docs/PRISMA_EXPLANATION.md docs/guides/
mv docs/REDIS_GUIDE.md docs/guides/
mv docs/SUPABASE_PRISMA_GUIDE.md docs/guides/
mv docs/nestjs-restaurant.html docs/visuals/
mv docs/nestjs-system-design.html docs/visuals/
mv docs/restaurant_flow_illustration.png docs/visuals/
mv docs/CODE_REVIEW_GRAPH.md docs/meta/
```

- [ ] **Step 3: Verify structure**

Run: `ls -R docs/`
Expected: Files are in their respective new subfolders.

- [ ] **Step 4: Commit**

Run: `rtk git add docs/ && rtk git commit -m "docs: reorganize documentation into thematic subdirectories"`

---

### Task 3: Comprehensive Reference Update

- [ ] **Step 1: Update GEMINI.md**

Update references to `learn` (now `docs/learning/LEARN.md`).

- [ ] **Step 2: Update AGENTS.md**

Update `@RTK.md` to `@docs/guides/RTK.md`.

- [ ] **Step 3: Update all internal .md links**

Search for links like `[text](file.md)` or `[text](./file.md)` and update them to the new paths. Especially check `README.md` and files inside `docs/superpowers/`.

- [ ] **Step 4: Update Plan/Spec paths**

Check `docs/superpowers/plans/` and `docs/superpowers/specs/` for hardcoded paths to moved files.

- [ ] **Step 5: Commit**

Run: `rtk git add . && rtk git commit -m "docs: update all internal references to reflect refined documentation structure"`
