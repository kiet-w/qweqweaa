import re

with open('/home/baudui/Downloads/project/docs/html/cart.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_svg = """<svg viewBox="0 0 680 1100" style="max-width: 680px; width: 100%; margin: 2em auto; display: block;" xmlns="http://www.w3.org/2000/svg">
  <style>
    .c-blue { stroke: #569cd6; fill: #1a3a52; stroke-width: 0.5; cursor: pointer; }
    .c-red { stroke: #f44747; fill: #3a1a1a; stroke-width: 0.5; cursor: pointer; }
    .c-amber { stroke: #dcdcaa; fill: #2d2516; stroke-width: 0.5; cursor: pointer; }
    .c-purple { stroke: #c586c0; fill: #2d1e35; stroke-width: 0.5; cursor: pointer; }
    .c-teal { stroke: #4ec9b0; fill: #1a3a28; stroke-width: 0.5; cursor: pointer; }
    .c-pink { stroke: #c586c0; fill: #351e2d; stroke-width: 0.5; cursor: pointer; }
    .c-gray { stroke: #858585; fill: #2d2d30; stroke-width: 0.5; cursor: pointer; }
    .th { font: bold 14px sans-serif; fill: #fff; pointer-events: none; }
    .ts { font: 12px sans-serif; fill: #aaa; pointer-events: none; }
    .arr-lbl { font: 11px sans-serif; fill: #888; }
    .sub { stroke: #858585; fill: none; stroke-dasharray: 5 5; stroke-width: 1; }
    .sub-pink { stroke: #c586c0; fill: none; stroke-dasharray: 5 5; stroke-width: 1; }
    .arr-red { stroke: #f44747; stroke-width: 1.5; }
    .arr-amber { stroke: #dcdcaa; stroke-width: 1.5; }
    .arr-purple { stroke: #c586c0; stroke-width: 1.5; }
    .arr-teal { stroke: #4ec9b0; stroke-width: 1.5; }
    .arr-gray { stroke: #858585; stroke-width: 1.5; }
    .arr-blue { stroke: #569cd6; stroke-width: 1.5; }
  </style>

  <defs>
    <marker id="m-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f44747"/></marker>
    <marker id="m-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#dcdcaa"/></marker>
    <marker id="m-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#c586c0"/></marker>
    <marker id="m-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#4ec9b0"/></marker>
    <marker id="m-gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#858585"/></marker>
    <marker id="m-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#569cd6"/></marker>
  </defs>

  <!-- Regions -->
  <rect x="180" y="85" width="320" height="845" rx="10" class="sub" />
  <text x="190" y="105" class="ts" style="font-weight:bold;">NestJS Backend</text>

  <!-- Nodes -->
  <!-- 1. Client -->
  <g onclick="showTooltip(event, '① Client', 'PATCH /cart/items/5 {qty:2}', 'HTTP 200 {success:true}', 'User updates item quantity in UI')">
    <rect x="230" y="10" width="220" height="60" rx="8" class="c-blue"/>
    <text x="340" y="32" class="th" text-anchor="middle">① Client</text>
    <text x="340" y="50" class="ts" text-anchor="middle">Gửi PATCH /cart/items/:id</text>
  </g>

  <!-- 2. AuthGuard -->
  <g onclick="showTooltip(event, '② AuthGuard', 'JWT Token', 'req.user = payload', 'Verify identity and extract userId')">
    <rect x="230" y="100" width="220" height="60" rx="8" class="c-red"/>
    <text x="340" y="122" class="th" text-anchor="middle">② AuthGuard</text>
    <text x="340" y="140" class="ts" text-anchor="middle">Xác thực &amp; Gắn user</text>
  </g>

  <!-- 3. CartController -->
  <g onclick="showTooltip(event, '③ CartController', 'userId, itemId, DTO', 'Service result', 'Extract params and delegate to service')">
    <rect x="230" y="190" width="220" height="60" rx="8" class="c-amber"/>
    <text x="340" y="212" class="th" text-anchor="middle">③ CartController</text>
    <text x="340" y="230" class="ts" text-anchor="middle">Điều phối request</text>
  </g>

  <!-- 4. Service: Validate -->
  <g onclick="showTooltip(event, '④ Service: Validate', 'userId, itemId, quantity', 'Validated Status', 'Kiểm tra sở hữu và tồn kho (Cross-Module)')">
    <rect x="230" y="280" width="220" height="60" rx="8" class="c-purple"/>
    <text x="340" y="302" class="th" text-anchor="middle">④ Service: Validate</text>
    <text x="340" y="320" class="ts" text-anchor="middle">Kiểm tra sở hữu &amp; Tồn kho</text>
  </g>

  <!-- 5. Prisma DB: Update -->
  <g onclick="showTooltip(event, '⑤ Prisma DB: Update', 'cartItem.update(...)', 'Updated Record', 'Persist changes to PostgreSQL')">
    <rect x="230" y="370" width="220" height="60" rx="8" class="c-teal"/>
    <text x="340" y="392" class="th" text-anchor="middle">⑤ Prisma DB: Update</text>
    <text x="340" y="410" class="ts" text-anchor="middle">Cập nhật Database</text>
  </g>

  <!-- 6. Redis Invalidation -->
  <g onclick="showTooltip(event, '⑥ Redis Invalidation', 'cart:userId', 'OK (Deleted)', 'Force fresh data on next read')">
    <rect x="230" y="460" width="220" height="60" rx="8" class="c-red"/>
    <text x="340" y="482" class="th" text-anchor="middle">⑥ Redis Invalidation</text>
    <text x="340" y="500" class="ts" text-anchor="middle">Xóa cache giỏ hàng (del)</text>
  </g>

  <!-- 7. Prisma DB: Fetch -->
  <g onclick="showTooltip(event, '⑦ Prisma DB: Fetch', 'getCartWithItems(userId)', 'Raw Data (Prisma.Decimal)', 'Lấy dữ liệu mới nhất từ DB để tính toán')">
    <rect x="230" y="550" width="220" height="60" rx="8" class="c-teal"/>
    <text x="340" y="572" class="th" text-anchor="middle">⑦ Prisma DB: Fetch</text>
    <text x="340" y="590" class="ts" text-anchor="middle">Lấy Dữ Liệu Mới Nhất</text>
  </g>

  <!-- 8. Service: Serialize -->
  <g onclick="showTooltip(event, '⑧ Service: Serialize', 'Prisma.Decimal values', 'CartResponseDto (String)', 'Calculates totals &amp; formats for JSON')">
    <rect x="230" y="640" width="220" height="60" rx="8" class="c-purple"/>
    <text x="340" y="662" class="th" text-anchor="middle">⑧ Service: Serialize</text>
    <text x="340" y="680" class="ts" text-anchor="middle">Decimal -&gt; String Conversion</text>
  </g>

  <!-- 9. Redis: Set -->
  <g onclick="showTooltip(event, '⑨ Redis: Set', 'CartResponseDto', 'OK (Cached)', 'Lưu trữ dữ liệu giỏ hàng mới vào Cache')">
    <rect x="230" y="730" width="220" height="60" rx="8" class="c-amber"/>
    <text x="340" y="752" class="th" text-anchor="middle">⑨ Redis: Set</text>
    <text x="340" y="770" class="ts" text-anchor="middle">Lưu trữ Cache mới nhất</text>
  </g>

  <!-- 10. Utils.success -->
  <g onclick="showTooltip(event, '⑩ Utils.success', 'CartResponseDto', 'Standard API Response', 'Wrap data in consistent JSON format')">
    <rect x="230" y="820" width="220" height="60" rx="8" class="c-gray"/>
    <text x="340" y="842" class="th" text-anchor="middle">⑩ Utils.success</text>
    <text x="340" y="860" class="ts" text-anchor="middle">Đóng gói JSON chuẩn</text>
  </g>

  <!-- 11. Response -->
  <g onclick="showTooltip(event, '⑪ HTTP Response', 'JSON Payload', 'Browser receives 200 OK', 'Send response back to client')">
    <rect x="230" y="910" width="220" height="60" rx="8" class="c-blue" style="stroke-dasharray: 4;"/>
    <text x="340" y="932" class="th" text-anchor="middle">⑪ HTTP Response</text>
    <text x="340" y="950" class="ts" text-anchor="middle">Phản hồi Thành công</text>
  </g>

  <!-- Arrows Down (Requests) -->
  <path d="M 340 70 L 340 90" fill="none" class="arr-red" marker-end="url(#m-red)"/>
  <path d="M 340 160 L 340 180" fill="none" class="arr-amber" marker-end="url(#m-amber)"/>
  <path d="M 340 250 L 340 270" fill="none" class="arr-purple" marker-end="url(#m-purple)"/>
  <path d="M 340 340 L 340 360" fill="none" class="arr-teal" marker-end="url(#m-teal)"/>
  <path d="M 340 430 L 340 450" fill="none" class="arr-red" marker-end="url(#m-red)"/>
  <path d="M 340 520 L 340 540" fill="none" class="arr-teal" marker-end="url(#m-teal)"/>
  <path d="M 340 610 L 340 630" fill="none" class="arr-purple" marker-end="url(#m-purple)"/>
  <path d="M 340 700 L 340 720" fill="none" class="arr-amber" marker-end="url(#m-amber)"/>
  <path d="M 340 790 L 340 810" fill="none" class="arr-gray" marker-end="url(#m-gray)"/>
  <path d="M 340 880 L 340 900" fill="none" class="arr-blue" marker-end="url(#m-blue)"/>

  <!-- Arrows Up (Returns) -->
  <path d="M 230 940 L 140 940 L 140 40 L 220 40" fill="none" class="arr-blue" style="stroke-dasharray: 4;" marker-end="url(#m-blue)"/>
  <text x="145" y="490" class="arr-lbl" transform="rotate(-90 145 490)">HTTP 200 OK</text>

  <!-- Tooltip Section -->
  <rect x="20" y="1000" width="640" height="80" rx="8" fill="#1e1e1e" stroke="#404040" id="tooltip-bg"/>
  <foreignObject x="30" y="1010" width="620" height="60">
    <div xmlns="http://www.w3.org/1999/xhtml" class="tooltip-content" style="color: #d4d4d4; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
      <div style="color: #858585; text-align: center; margin-top: 15px;">Di chuột hoặc click vào các bước để xem chi tiết luồng xử lý...</div>
    </div>
  </foreignObject>

  <script>
    function showTooltip(evt, title, input, output, why) {
      const svg = evt.currentTarget.closest('svg');
      const content = svg.querySelector('.tooltip-content');
      content.innerHTML = `
        <div style="font-weight: bold; color: #569cd6; margin-bottom: 4px;">${title}</div>
        <div style="margin-bottom: 8px;">${why}</div>
        <div style="display: flex; gap: 20px; font-family: monospace; font-size: 11px; background: #2d2d30; padding: 6px; border-radius: 4px;">
          <div><span style="color: #4ec9b0">IN:</span> ${input}</div>
          <div><span style="color: #c586c0">OUT:</span> ${output}</div>
        </div>
      `;
    }
  </script>
</svg>"""

new_content = re.sub(r'<svg viewBox="0 0 680 940".*?</svg>', new_svg, content, flags=re.DOTALL)

with open('/home/baudui/Downloads/project/docs/html/cart.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced SVG.")
