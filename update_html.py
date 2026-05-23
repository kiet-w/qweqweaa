import re

with open('docs/html/src_explanation.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the diagram section
diagram_pattern = re.compile(r'(<h2 id="system-flowchart">.*?<\/svg>)', re.DOTALL)
match = diagram_pattern.search(content)

if not match:
    print("Diagram not found")
    exit(1)

diagram = match.group(1)

# Remove the diagram from its original place
content = content.replace(diagram, '')

# Update the diagram attributes and script
diagram = re.sub(
    r'<svg viewBox="0 0 680 1050" style="[^"]*" xmlns="http://www.w3.org/2000/svg">',
    r'<svg viewBox="0 0 680 1050" style="max-width: 550px; width: 100%; margin: 0 auto; display: block;" xmlns="http://www.w3.org/2000/svg">',
    diagram
)

diagram = diagram.replace(
    '<rect x="10" y="945" width="660" height="100" rx="10" fill="#252526" stroke="#404040"/>',
    '<rect id="tooltip-panel" x="10" y="945" width="660" height="100" rx="10" fill="#252526" stroke="#404040"/>'
)

new_script = """  <script>
    function showTooltip(evt, name, input, output, why) {
      const svg = evt.currentTarget.closest('svg');
      svg.querySelector('.tt-title').textContent = name;
      svg.querySelector('.tt-in').textContent = 'IN: ' + input;
      svg.querySelector('.tt-out').textContent = 'OUT: ' + output;
      svg.querySelector('.tt-why').textContent = why;
      
      const tooltip = svg.querySelector('#tooltip-panel') || svg;
      tooltip.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
  </script>"""

diagram = re.sub(r'<script>.*?<\/script>', new_script, diagram, flags=re.DOTALL)

# Insert it at the top
insert_target = r'(<p>Tài liệu này giải thích chi tiết cách hoạt động của mã nguồn trong thư mục <code>src</code>, luồng dữ liệu vào/ra và các điểm nổi bật kỹ thuật của dự án.<\/p>)'

if insert_target not in content:
    # use regex
    content = re.sub(r'(<p>Tài liệu này giải thích.*?<\/p>)', r'\1\n\n' + diagram, content, count=1)
else:
    content = content.replace(insert_target, insert_target + '\n\n' + diagram)

with open('docs/html/src_explanation.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated docs/html/src_explanation.html successfully.")
