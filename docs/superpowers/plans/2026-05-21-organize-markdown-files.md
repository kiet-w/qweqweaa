# Organize Markdown Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move and rename root markdown files to the `docs` directory to clean up the project root.

**Architecture:** File system operations followed by a git commit.

**Tech Stack:** Bash, Git.

---

### Task 1: Move and Rename Files

**Files:**
- Move: `learn` -> `docs/LEARN.md`
- Move: `src_explanation.md` -> `docs/explanations/src_explanation.md`
- Move: `RTK.md` -> `docs/RTK.md`
- Move: `SUPABASE_PRISMA_GUIDE.md` -> `docs/SUPABASE_PRISMA_GUIDE.md`
- Move: `CODE_REVIEW_GRAPH.md` -> `docs/CODE_REVIEW_GRAPH.md`

- [ ] **Step 1: Move and rename the files**

Run:
```bash
rtk mv learn docs/LEARN.md
rtk mv src_explanation.md docs/explanations/src_explanation.md
rtk mv RTK.md docs/RTK.md
rtk mv SUPABASE_PRISMA_GUIDE.md docs/SUPABASE_PRISMA_GUIDE.md
rtk mv CODE_REVIEW_GRAPH.md docs/CODE_REVIEW_GRAPH.md
```

- [ ] **Step 2: Verify files exist at new locations**

Run:
```bash
ls -l docs/LEARN.md docs/explanations/src_explanation.md docs/RTK.md docs/SUPABASE_PRISMA_GUIDE.md docs/CODE_REVIEW_GRAPH.md
```

- [ ] **Step 3: Verify files are removed from root**

Run:
```bash
ls learn src_explanation.md RTK.md SUPABASE_PRISMA_GUIDE.md CODE_REVIEW_GRAPH.md
```
Expected: "No such file or directory" for each.

- [ ] **Step 4: Commit the changes**

Run:
```bash
rtk git add .
rtk git commit -m "docs: organize root markdown files into docs folder"
```
