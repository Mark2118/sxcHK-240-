#!/bin/bash
# YK-04 自动代码审查流水线
# 用法: ./scripts/yk04-review.sh

set -e

echo "=== YK-04 Auto Review Pipeline ==="
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"

# 1. 拉取最新代码
echo -e "\n[1/5] Pulling latest code..."
GIT_SSH_COMMAND="ssh -i /tmp/openclaw/github_deploy_key -o IdentitiesOnly=yes" git pull --rebase origin main 2>&1 | tail -5

# 2. 获取最近提交信息
LATEST_COMMIT=$(git log -1 --format="%H")
LATEST_MSG=$(git log -1 --format="%s")
LATEST_AUTHOR=$(git log -1 --format="%an")
echo -e "\n[2/5] Latest commit: $LATEST_MSG by $LATEST_AUTHOR"

# 3. 扫描问题
echo -e "\n[3/5] Scanning issues..."

REPORT_FILE="docs/reviews/YK04-auto-review-$(date +%Y%m%d-%H%M).md"
mkdir -p docs/reviews

cat > "$REPORT_FILE" << EOF
# YK-04 自动审查报告

> **Commit**: $LATEST_COMMIT
> **Message**: $LATEST_MSG
> **Author**: $LATEST_AUTHOR
> **Review Time**: $(date '+%Y-%m-%d %H:%M:%S')
> **Reviewer**: YK-04 (Auto)

---

## 扫描结果

### 1. MOCK 登录检查
EOF

MOCK_LOGIN=$(grep -rn "mock_wx_code\|mockCode\|mock_login\|MOCK.*code" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
echo "- MOCK 登录残留: $MOCK_LOGIN 处" >> "$REPORT_FILE"

MOCK_PAY=$(grep -rn "MOCK_MODE\|\[MOCK\]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
echo "- MOCK 支付残留: $MOCK_PAY 处" >> "$REPORT_FILE"

ALERT_COUNT=$(grep -rn "alert(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
echo "- alert() 弹窗: $ALERT_COUNT 处" >> "$REPORT_FILE"

CONSOLE_COUNT=$(grep -rn "console\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
echo "- console 残留: $CONSOLE_COUNT 处" >> "$REPORT_FILE"

HARD_CODE=$(grep -rn "'/xsc/\|/xsc/api" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
echo "- 硬编码路径 /xsc/: $HARD_CODE 处" >> "$REPORT_FILE"

AUTH_REPEAT=$(grep -rn "function auth(" src/app/api/ --include="*.ts" 2>/dev/null | wc -l)
echo "- auth() 重复定义: $AUTH_REPEAT 处" >> "$REPORT_FILE"

NO_VALIDATE=$(grep -rn "req\.json()" src/app/api/ --include="*.ts" 2>/dev/null | wc -l)
echo "- 无输入验证路由: $NO_VALIDATE 个" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << EOF

### 2. 新增/修改文件
EOF

git diff HEAD~1 --name-only 2>/dev/null | while read f; do
  if [[ $f == src/* ]]; then
    echo "- \`$f\`" >> "$REPORT_FILE"
  fi
done

cat >> "$REPORT_FILE" << EOF

### 3. 关键判断
EOF

if [ "$MOCK_LOGIN" -gt 0 ] || [ "$MOCK_PAY" -gt 0 ]; then
  echo "- 🔴 **存在 MOCK 代码残留** — 生产环境风险" >> "$REPORT_FILE"
fi

if [ "$AUTH_REPEAT" -gt 1 ]; then
  echo "- 🔴 **auth() 重复定义 $AUTH_REPEAT 处** — 需提取到 lib" >> "$REPORT_FILE"
fi

if [ "$NO_VALIDATE" -gt 0 ]; then
  echo "- 🟡 **$NO_VALIDATE 个路由无输入验证** — 建议加 zod" >> "$REPORT_FILE"
fi

if [ "$ALERT_COUNT" -gt 0 ]; then
  echo "- 🟡 **$ALERT_COUNT 处 alert()** — 建议改 Toast" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

---

*YK-04 自动审查完毕。*
EOF

echo -e "\n[4/5] Report generated: $REPORT_FILE"

# 4. 提交报告
echo -e "\n[5/5] Committing review report..."
git add "$REPORT_FILE"
git commit -m "docs(review): YK-04 自动审查报告 — $LATEST_MSG" || echo "Nothing to commit"

# 5. 推送
GIT_SSH_COMMAND="ssh -i /tmp/openclaw/github_deploy_key -o IdentitiesOnly=yes" git push origin main 2>&1 | tail -3

echo -e "\n=== Review Pipeline Complete ==="
echo "Report: $REPORT_FILE"
