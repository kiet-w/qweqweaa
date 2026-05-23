import re

with open('docs/html/redis.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CSS
css_old = """/* ── LIFECYCLE ── */
.lifecycle-container {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin: 2em 0;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}
@media (min-width: 992px) {
  .lifecycle-container { flex-direction: row; height: 500px; }
}"""

css_new = """/* ── LIFECYCLE ── */
.lifecycle-container {
  display: block;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin: 0 auto;
  max-width: 600px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}
@media (min-width: 992px) {
  .lifecycle-container { height: auto; }
}"""

if css_old in content:
    content = content.replace(css_old, css_new)
else:
    print("CSS old not found, regexing...")
    content = re.sub(
        r'\.lifecycle-container\s*\{[^}]+\}\s*@media\s*\(min-width:\s*992px\)\s*\{\s*\.lifecycle-container\s*\{[^}]+\}\s*\}',
        css_new,
        content
    )

# 2. Extract and Move HTML
diagram_pattern = re.compile(r'(\s*<h3 id="lifecycle-diagram">Sơ đồ luồng: Cache Aside \(getOrSet\)</h3>\s*<div class="lifecycle-container">.*?</div>\s*</div>\s*</div>\s*)(?=\s*<div class="crud-card">)', re.DOTALL)
match = diagram_pattern.search(content)

if match:
    diagram_html = match.group(1)
    content = content[:match.start()] + content[match.end():]
    
    # insert before <!-- SUMMARY TABLE -->
    target_pattern = r'(\s*<!-- SUMMARY TABLE -->)'
    target_match = re.search(target_pattern, content)
    if target_match:
        content = content[:target_match.start()] + diagram_html + content[target_match.start():]
    else:
        print("Target <!-- SUMMARY TABLE --> not found")
else:
    print("Diagram HTML not found")

# 3. Update JS
js_old = """      panel.querySelectorAll('.lc-flow-card-desc')[1].innerText = node.dataset.whyOut;
    });"""

js_new = """      panel.querySelectorAll('.lc-flow-card-desc')[1].innerText = node.dataset.whyOut;
      
      const detailContainer = document.querySelector('.lc-detail-panel');
      detailContainer.scrollIntoView({behavior: 'smooth', block: 'center'});
    });"""

if js_old in content:
    content = content.replace(js_old, js_new)
else:
    print("JS old not found")

with open('docs/html/redis.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
