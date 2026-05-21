# NestJS Learning Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone dark-mode `index.html` that turns the local `docs/LEARN.md` roadmap into a structured NestJS learning dashboard with priorities, tasks, backend flow, production checklist, and debugging playbooks.

**Architecture:** The page is a single static document with embedded CSS and JavaScript. Course content is represented as a JavaScript data array, rendered into reusable HTML sections, with progress stored in `localStorage`.

**Tech Stack:** HTML5, CSS custom properties, vanilla JavaScript, browser `localStorage`.

---

## File Structure

- Create: `index.html`
  - Owns all markup, styles, course data, rendering logic, filters, tabs, progress persistence, and reset behavior.
- Existing input: `docs/LEARN.md`
  - Used as the source material for section topics and production concepts.
- Existing spec: `docs/superpowers/specs/2026-05-12-nestjs-learning-dashboard-design.md`
  - Defines accepted scope and visual requirements.

## Task 1: Create Standalone Page Skeleton

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create the HTML document shell**

Create `index.html` with:

```html
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lộ trình NestJS Enterprise</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

- [ ] **Step 2: Add semantic page regions**

Add static containers inside `body`:

```html
<div class="shell">
  <aside class="sidebar" aria-label="Điều hướng khóa học"></aside>
  <main class="main" id="main-content">
    <section class="hero" id="top"></section>
    <section class="toolbar" aria-label="Bộ lọc học tập"></section>
    <section class="timeline" id="timeline"></section>
    <section class="flow" id="backend-flow"></section>
    <section class="course" id="course"></section>
    <section class="checklist" id="production-checklist"></section>
  </main>
</div>
```

- [ ] **Step 3: Verify required regions exist**

Run:

```bash
grep -n "id=\"backend-flow\"\\|id=\"course\"\\|id=\"production-checklist\"" index.html
```

Expected: three matching lines.

## Task 2: Add Dark Design System

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add CSS variables and base styles**

Add a `<style>` block in `head` with tokens for background, panels, text, borders, priority colors, spacing, radius, and shadow.

- [ ] **Step 2: Add layout CSS**

Implement:

```css
.shell { min-height: 100vh; display: grid; grid-template-columns: 300px minmax(0, 1fr); }
.sidebar { position: sticky; top: 0; height: 100vh; overflow: auto; }
.main { min-width: 0; padding: clamp(20px, 4vw, 56px); }
@media (max-width: 920px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { position: relative; height: auto; }
}
```

- [ ] **Step 3: Add component CSS**

Style cards, badges, tabs, progress bars, buttons, flow nodes, checklist rows, debug blocks, and code snippets.

- [ ] **Step 4: Verify CSS tokens exist**

Run:

```bash
grep -n -- "--bg:\\|--panel:\\|--accent:\\|--danger:" index.html
```

Expected: CSS custom property matches.

## Task 3: Add Course Data and Priority Model

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add course data script**

Add a `<script>` block before `</body>` with:

```js
const courseSections = [
  {
    id: "part-0",
    nav: "Phần 0",
    title: "Trước khi bắt đầu: Mindset đúng",
    weeks: "Chuẩn bị",
    priority: "P0",
    dependsOn: "Không có",
    teaches: "NestJS là công cụ để tổ chức backend chịu tải thực tế, không chỉ là framework.",
    matters: "Mindset đúng giúp học theo luồng production: request, database, overload, security, logs, deploy.",
    tasks: [
      "Viết lại bằng lời của bạn: Controller, Service, Module giải quyết vấn đề gì khi team lớn.",
      "Vẽ luồng request đơn giản: client gọi API, controller nhận request, service xử lý, database trả dữ liệu.",
      "Ghi 5 câu hỏi production phải trả lời: quá tải, database chết, security bug, log, deploy rollback."
    ],
    bugs: [
      {
        symptom: "Học lan man, nhảy sang microservices khi chưa biết module/service.",
        causes: ["Không có thứ tự phụ thuộc", "Chưa gắn kiến thức với project thực hành"],
        inspect: "Roadmap tuần học và task đã tick.",
        debug: ["Quay lại P0/P1 chưa xong", "Chỉ học topic mới khi task thực hành của topic trước chạy được"],
        fix: "Khóa thứ tự học theo priority và dependency.",
        prevent: "Mỗi phần phải có artifact: code, config, log, hoặc checklist."
      }
    ],
    outcome: "Biết học NestJS theo tư duy hệ thống thay vì học API rời rạc."
  }
];
```

- [ ] **Step 2: Expand data to all required sections**

Add entries for Part 1 through Part 10 with titles, week ranges, priority, dependencies, teaching summary, tasks, bugs, and outcomes.

- [ ] **Step 3: Verify all sections exist**

Run:

```bash
grep -o "id: \"part-[0-9][0-9]*\"" index.html | wc -l
```

Expected: `11`.

## Task 4: Render Navigation, Timeline, and Course Cards

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add render helper functions**

Implement `priorityLabel(priority)`, `taskId(sectionId, index)`, `isDone(id)`, `setDone(id, checked)`, and `escapeHtml(value)`.

- [ ] **Step 2: Render sidebar navigation**

Implement `renderSidebar()` from `courseSections`, including progress summary and links to each section.

- [ ] **Step 3: Render timeline**

Implement `renderTimeline()` with week blocks and recommended order.

- [ ] **Step 4: Render course sections**

Implement `renderCourse()` so each section includes:

```html
<article class="section-card" data-priority="P0">
  <header>title, weeks, priority</header>
  <div class="section-grid">learn/practice/debug panels</div>
</article>
```

- [ ] **Step 5: Verify rendered targets are wired**

Run:

```bash
grep -n "function renderSidebar\\|function renderTimeline\\|function renderCourse" index.html
```

Expected: three matching function definitions.

## Task 5: Add Backend Flow and Debug Handbook

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add backend flow HTML renderer**

Implement `renderBackendFlow()` with nodes:

```text
Client -> Nginx/LB -> Rate Limit -> Guard/Auth -> Controller -> Service -> Cache -> DB -> Queue -> Logs/Metrics -> Response
```

- [ ] **Step 2: Add incident debugging summary**

Add a "Debug khi hệ thống lỗi" section with symptom-first cards covering startup failure, DI failure, DB pool exhaustion, JWT/RBAC errors, Redis stampede, stuck queues, Docker health check failures, missing logs, and WebSocket scaling.

- [ ] **Step 3: Verify flow nodes exist**

Run:

```bash
grep -n "Nginx/LB\\|Rate Limit\\|Logs/Metrics\\|WebSocket scaling" index.html
```

Expected: matching lines for flow and debug content.

## Task 6: Add Production Checklist and Interactions

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add production checklist data**

Represent checklist groups for security, database, performance, reliability, scalability, and deployment.

- [ ] **Step 2: Render checklist with persistent checkboxes**

Implement `renderChecklist()` and use `localStorage` keys prefixed with `nestjs-roadmap:`.

- [ ] **Step 3: Add filters and reset**

Implement priority filter buttons for `All`, `P0`, `P1`, `P2` and a reset button that clears `nestjs-roadmap:` keys.

- [ ] **Step 4: Verify localStorage and filters exist**

Run:

```bash
grep -n "localStorage\\|data-filter\\|resetProgress" index.html
```

Expected: matches for persistence, filters, and reset.

## Task 7: Final Static Verification

**Files:**
- Verify: `index.html`

- [ ] **Step 1: Check file exists and has expected title**

Run:

```bash
test -f index.html && grep -n "Lộ trình NestJS Enterprise" index.html
```

Expected: command exits successfully and prints at least one matching line.

- [ ] **Step 2: Check required content coverage**

Run:

```bash
grep -n "PHẦN 10\\|CQRS\\|Read Replica\\|WebSocket\\|CHECKLIST PRODUCTION\\|Debug khi hệ thống lỗi" index.html
```

Expected: all major final topics are present.

- [ ] **Step 3: Check standalone constraints**

Run:

```bash
grep -n "https://\\|http://\\|<script src=\\|<link rel=\"stylesheet\"" index.html
```

Expected: no output, because the file is standalone and has no external dependencies.

- [ ] **Step 4: Commit**

Skip commit because `/home/baudui/Downloads/project` is not a valid Git repository in this environment.

## Task 8: Add Code Guide to Every Learning Section

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `Code` view filter**

Add a toolbar button with `data-view="code"` so learners can focus only on folder structure and code snippets.

- [ ] **Step 2: Add code guide data**

Create a `codeGuides` object keyed by section id. Each entry must include:

```js
{
  folders: ["src/main.ts", "src/app.module.ts"],
  snippets: [{ title: "main.ts", code: "..." }],
  explain: ["main.ts bootstraps the app and configures global pipes."]
}
```

- [ ] **Step 3: Render code guide panel**

In each section card, render a `view-code` panel containing folder tree, code suggestions, and explanation bullets.

- [ ] **Step 4: Verify coverage**

Run:

```bash
grep -n "Code Guide\\|const codeGuides\\|data-view=\"code\"\\|view-code" index.html
```

Expected: matches for toolbar, data, renderer, and panel class.

## Task 9: Replace Dashboard With Task-First Beginner Roadmap

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace section-first data with task-first data**

Create a `roadmap` array where each phase contains small `tasks`. Each task must include `id`, `title`, `duration`, `priority`, `goal`, `commands`, `files`, `code`, `explain`, `flow`, `bugs`, and `checklist`.

- [ ] **Step 2: Render task cards**

Each task card must show:

```html
<article class="task-card">
  <header>Task id, title, priority, duration</header>
  <section>Mục tiêu</section>
  <section>Command</section>
  <section>File / folder</section>
  <section>Code</section>
  <section>Giải thích</section>
  <section>Flow backend</section>
  <section>Bug thường gặp</section>
  <section>Checklist</section>
</article>
```

- [ ] **Step 3: Add task-level flow diagrams**

Render each task's `flow` as HTML/CSS nodes connected with arrows.

- [ ] **Step 4: Preserve progress tracking**

Use `localStorage` keys based on task id and checklist index.

- [ ] **Step 5: Verify replacement**

Run:

```bash
grep -n "const roadmap\\|Task 0.1\\|Flow backend\\|data-view=\"flow\"\\|localStorage" index.html
grep -o "task-card" index.html | wc -l
grep -n "PHẦN 10\\|WebSocket\\|CQRS\\|CHECKLIST PRODUCTION" index.html
```

Expected: roadmap data, task cards, per-task flow, progress persistence, and advanced coverage exist.
