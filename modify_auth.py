import re

with open('docs/html/auth.html', 'r') as f:
    content = f.read()

# Find the SVG block including the h2
svg_pattern = re.compile(r'(\s*<h2 id="system-data-flow">Sơ đồ Luồng Dữ Liệu \(Hệ Thống\)</h2>\s*<svg viewBox="0 0 720 900".*?</svg>)', re.DOTALL)
match = svg_pattern.search(content)
if not match:
    print("SVG not found")
    exit(1)

svg_block = match.group(1)

# Remove the SVG block from the original content
content = content[:match.start()] + content[match.end():]

# Update SVG styling
svg_block = svg_block.replace('style="max-width: 100%; height: auto; display: block; margin: 2em auto;"', 'style="max-width: 600px; height: auto; display: block; margin: 0 auto;"')

# Update script to include scrollIntoView
old_script = """    function showTooltip(evt, title, why, input, output) {
      const svg = evt.currentTarget.closest('svg');
      svg.querySelector('#tt-title').textContent = title;
      svg.querySelector('#tt-why').textContent = why;
      svg.querySelector('#tt-in').textContent = input;
      svg.querySelector('#tt-out').textContent = output;
    }"""
new_script = """    function showTooltip(evt, title, why, input, output) {
      const svg = evt.currentTarget.closest('svg');
      svg.querySelector('#tt-title').textContent = title;
      svg.querySelector('#tt-why').textContent = why;
      svg.querySelector('#tt-in').textContent = input;
      svg.querySelector('#tt-out').textContent = output;
      svg.querySelector('#tooltip-bg').scrollIntoView({behavior: 'smooth', block: 'center'});
    }"""
svg_block = svg_block.replace(old_script, new_script)

# Insert after the introductory paragraph
insert_marker = '<p>Tài liệu này cung cấp một cái nhìn chuyên sâu vào cách thức hoạt động của module Xác thực (Auth). Trọng tâm là sự tương tác giữa Controller và Service, dòng chảy dữ liệu và vai trò của các thư viện bên thứ ba.</p>'
insert_pos = content.find(insert_marker) + len(insert_marker)

new_content = content[:insert_pos] + svg_block + content[insert_pos:]

with open('docs/html/auth.html', 'w') as f:
    f.write(new_content)
print("Done")
