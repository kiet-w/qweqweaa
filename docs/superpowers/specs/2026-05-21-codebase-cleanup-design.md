# Design Spec: Codebase Cleanup and Documentation Organization

**Date:** 2026-05-21
**Topic:** Cleanup unnecessary files and organize markdown documentation.

## 1. Overview
The project currently has several temporary scripts, logs, and misplaced documentation files at the root directory. This design aims to clean up redundant assets and consolidate all documentation into the `docs/` folder to improve project maintainability and clarity.

## 2. Goals
- Remove redundant Python scripts and log files.
- Organize root-level `.md` files into appropriate subdirectories within `docs/`.
- Ensure critical learning materials (the `learn` file) are correctly named and located.
- Update internal references (e.g., in `GEMINI.md`) to reflect new paths.

## 3. Implementation Details

### 3.1 File Deletions
The following files are identified as temporary or unnecessary and will be deleted:
- `app.log`: Empty log file.
- `src_explanation.html`: Redundant HTML output (can be re-generated).
- `restore_skill.py`: One-off utility script.
- `simplify_metadata.py`: One-off utility script.
- `update_metadata.py`: One-off utility script.
- `update_metadata_v2.py`: One-off utility script.

### 3.2 File Reorganization (Refined)
Files will be organized into thematic subdirectories within `docs/`:

**`docs/learning/`** (Roadmaps & Mindset):
- `learn` -> `docs/learning/LEARN.md`
- `ENTERPRISE_BACKEND_ROADMAP.md` -> `docs/learning/ENTERPRISE_BACKEND_ROADMAP.md`
- `NESTJS_MENTAL_MODEL.md` -> `docs/learning/NESTJS_MENTAL_MODEL.md`
- `NESTJS_RESTAURANT_METAPHOR.md` -> `docs/learning/NESTJS_RESTAURANT_METAPHOR.md`

**`docs/guides/`** (Technical Guides):
- `RTK.md` -> `docs/guides/RTK.md`
- `PRISMA_EXPLANATION.md` -> `docs/guides/PRISMA_EXPLANATION.md`
- `REDIS_GUIDE.md` -> `docs/guides/REDIS_GUIDE.md`
- `SUPABASE_PRISMA_GUIDE.md` -> `docs/guides/SUPABASE_PRISMA_GUIDE.md`

**`docs/visuals/`** (Visual Assets & HTML):
- `nestjs-restaurant.html` -> `docs/visuals/nestjs-restaurant.html`
- `nestjs-system-design.html` -> `docs/visuals/nestjs-system-design.html`
- `restaurant_flow_illustration.png` -> `docs/visuals/restaurant_flow_illustration.png`

**`docs/meta/`** (Project Metadata):
- `CODE_REVIEW_GRAPH.md` -> `docs/meta/CODE_REVIEW_GRAPH.md`

**`docs/explanations/`** (Source Explanations):
- `src_explanation.md` -> `docs/explanations/src_explanation.md`
- (Existing module-specific explanations remain here)

### 3.3 Reference Updates
- **`GEMINI.md`**: Update reference to the `learn` file.
- **`README.md`**: Verify and update any links to moved files.

## 4. Success Criteria
- Root directory is free of `.py` scripts and temporary logs.
- All documentation files are located under `docs/`.
- `npm run lint` or other project checks (if any) still pass.
- References in core project files point to the new locations.
