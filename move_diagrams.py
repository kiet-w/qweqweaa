import re

with open('docs/html/common.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CSS
css_old = """.lifecycle-container {
  display: flex; flex-direction: column; background: var(--bg-surface);
  border: 1px solid var(--border); border-radius: 12px; margin: 2em 0;
  overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}
@media (min-width: 992px) { .lifecycle-container { flex-direction: row; height: 520px; } }"""

css_new = """.lifecycle-container {
  display: flex; flex-direction: column; background: var(--bg-surface);
  border: 1px solid var(--border); border-radius: 12px; margin: 2em auto;
  max-width: 600px;
  overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}
@media (min-width: 992px) { .lifecycle-container { flex-direction: column; height: auto; } }"""

content = content.replace(css_old, css_new)

# 2. Update JS (scrollIntoView)
js_old = """          const outCard = body.querySelector('.out-card');
          outCard.querySelector('.lc-flow-card-code').textContent = flowOut;
          outCard.querySelector('.lc-flow-card-desc').textContent = whyOut;
        });"""

js_new = """          const outCard = body.querySelector('.out-card');
          outCard.querySelector('.lc-flow-card-code').textContent = flowOut;
          outCard.querySelector('.lc-flow-card-desc').textContent = whyOut;
          
          detail.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });"""

content = content.replace(js_old, js_new)

# 3. Extract and move blocks
# We'll use regex to extract the two lifecycle containers.
# A lifecycle container goes from <div class="lifecycle-container"> to the matching closing div.
# Since regex for nested divs is hard, I will find them using a simple counting logic.

def extract_block(text, start_str):
    start_idx = text.find(start_str)
    if start_idx == -1: return "", text
    
    open_divs = 0
    i = start_idx
    while i < len(text):
        if text[i:i+4] == '<div':
            open_divs += 1
            i += 4
        elif text[i:i+6] == '</div>':
            open_divs -= 1
            i += 6
            if open_divs == 0:
                block = text[start_idx:i]
                return block, text[:start_idx] + text[i:]
        else:
            i += 1
    return "", text

# Extract script
script_start = text.find('  <script>')
script_match = re.search(r'(  <script>.*?</script>\n)', content, re.DOTALL)
if script_match:
    script_text = script_match.group(1)
    content = content.replace(script_text, '')
else:
    script_text = ""

# Extract the two diagrams
diag1, content = extract_block(content, '<div class="lifecycle-container">\n        <div class="lc-flow-panel">\n          <div class="lifecycle-title">Request Lifecycle — Roles Authorization</div>')
diag2, content = extract_block(content, '<div class="lifecycle-container">\n        <div class="lc-flow-panel">\n          <div class="lifecycle-title">Exception Handling — AllExceptionsFilter</div>')

# Find the insertion point: <div class="summary-table">
insert_str = '      <div class="summary-table">'
insert_idx = content.find(insert_str)

if insert_idx != -1 and diag1 and diag2:
    new_content = (
        content[:insert_idx] +
        diag1 + '\n\n      ' + diag2 + '\n\n' + script_text + '\n' +
        content[insert_idx:]
    )
    with open('docs/html/common.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully moved diagrams and script.")
else:
    print("Could not find insertion point or diagrams.")

