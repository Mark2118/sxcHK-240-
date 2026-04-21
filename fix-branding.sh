#!/bin/sh
# 替换 v2 容器中所有外部品牌提及

FILES="/app/.next/server/app/page.js /app/.next/server/app/analyze/page.js /app/.next/server/app/api/correct/route.js /app/.next/server/chunks/970-e4f3a0f80293147a.js"

for f in $FILES; do
  if [ -f "$f" ]; then
    sed -i 's/百度/WinGo/g' "$f"
    sed -i 's/清华/WinGo/g' "$f"
    sed -i 's/OpenMAIC/WinGo/g' "$f"
    sed -i 's/THU-MAIC/WinGo/g' "$f"
    echo "Fixed: $f"
  fi
done

echo "Done. Verifying:"
grep -o '百度\|清华\|OpenMAIC\|THU-MAIC' $FILES 2>/dev/null || echo "No external branding found."
