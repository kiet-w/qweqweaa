# Granular Documentation Organization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Organize documentation files into thematic subdirectories within `docs/`.

**Architecture:** Create new subdirectories (`learning`, `guides`, `visuals`, `meta`) and move existing documentation files into them to improve discoverability and structure.

**Tech Stack:** Shell commands (mkdir, mv, git).

---

### Task 1: Create Subdirectories

**Files:**
- Create: `docs/learning/`
- Create: `docs/guides/`
- Create: `docs/visuals/`
- Create: `docs/meta/`

- [ ] **Step 1: Create the directories**

Run: `mkdir -p docs/learning docs/guides docs/visuals docs/meta`

- [ ] **Step 2: Verify directories exist**

Run: `ls -d docs/learning docs/guides docs/visuals docs/meta`
Expected: Directories listed.

- [ ] **Step 3: Commit empty directories (optional/placeholder)**
Note: Git doesn't track empty directories, but we'll proceed to moving files.

---

### Task 2: Move Learning Documentation

**Files:**
- Move: `docs/LEARN.md` -> `docs/learning/LEARN.md`
- Move: `docs/ENTERPRISE_BACKEND_ROADMAP.md` -> `docs/learning/ENTERPRISE_BACKEND_ROADMAP.md`
- Move: `docs/NESTJS_MENTAL_MODEL.md` -> `docs/learning/NESTJS_MENTAL_MODEL.md`
- Move: `docs/NESTJS_RESTAURANT_METAPHOR.md` -> `docs/learning/NESTJS_RESTAURANT_METAPHOR.md`

- [ ] **Step 1: Move the files**

Run: `mv docs/LEARN.md docs/ENTERPRISE_BACKEND_ROADMAP.md docs/NESTJS_MENTAL_MODEL.md docs/NESTJS_RESTAURANT_METAPHOR.md docs/learning/`

- [ ] **Step 2: Verify movement**

Run: `ls docs/learning/`
Expected: Files listed in `docs/learning/`.

---

### Task 3: Move Guides Documentation

**Files:**
- Move: `docs/RTK.md` -> `docs/guides/RTK.md`
- Move: `docs/PRISMA_EXPLANATION.md` -> `docs/guides/PRISMA_EXPLANATION.md`
- Move: `docs/REDIS_GUIDE.md` -> `docs/guides/REDIS_GUIDE.md`
- Move: `docs/SUPABASE_PRISMA_GUIDE.md` -> `docs/guides/SUPABASE_PRISMA_GUIDE.md`

- [ ] **Step 1: Move the files**

Run: `mv docs/RTK.md docs/PRISMA_EXPLANATION.md docs/REDIS_GUIDE.md docs/SUPABASE_PRISMA_GUIDE.md docs/guides/`

- [ ] **Step 2: Verify movement**

Run: `ls docs/guides/`
Expected: Files listed in `docs/guides/`.

---

### Task 4: Move Visual Assets

**Files:**
- Move: `docs/nestjs-restaurant.html` -> `docs/visuals/nestjs-restaurant.html`
- Move: `docs/nestjs-system-design.html` -> `docs/visuals/nestjs-system-design.html`
- Move: `docs/restaurant_flow_illustration.png` -> `docs/visuals/restaurant_flow_illustration.png`

- [ ] **Step 1: Move the files**

Run: `mv docs/nestjs-restaurant.html docs/nestjs-system-design.html docs/restaurant_flow_illustration.png docs/visuals/`

- [ ] **Step 2: Verify movement**

Run: `ls docs/visuals/`
Expected: Files listed in `docs/visuals/`.

---

### Task 5: Move Meta Documentation

**Files:**
- Move: `docs/CODE_REVIEW_GRAPH.md` -> `docs/meta/CODE_REVIEW_GRAPH.md`

- [ ] **Step 1: Move the files**

Run: `mv docs/CODE_REVIEW_GRAPH.md docs/meta/`

- [ ] **Step 2: Verify movement**

Run: `ls docs/meta/`
Expected: File listed in `docs/meta/`.

---

### Task 6: Commit Changes

- [ ] **Step 1: Stage and commit**

Run: `rtk git add docs/ && rtk git commit -m "docs: reorganize documentation into thematic subdirectories"`
