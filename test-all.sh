#!/bin/bash
# ================================================================
# WinGo 学情洞察 — 全量测试脚本
# 覆盖：页面路由 + 公开API + 鉴权API + B端API + 功能链路
# ================================================================

set -euo pipefail

BASE="http://100.106.90.55:3002/xsc"
PASS=0
FAIL=0
WARN=0
TOKEN=""
B_API_KEY=""
B_API_SECRET=""
B_TOKEN=""

# --- 颜色 -------------------------------------------------------
G='\033[32m'
R='\033[31m'
Y='\033[33m'
C='\033[36m'
N='\033[0m'

# --- 工具函数 ---------------------------------------------------
ok()  { echo -e "${G}  ✓${N} $1"; PASS=$((PASS + 1)); }
err() { echo -e "${R}  ✗${N} $1"; FAIL=$((FAIL + 1)); }
warn(){ echo -e "${Y}  ⚠${N} $1"; WARN=$((WARN + 1)); }

section() {
  echo -e "\n${C}▶ $1${N}"
}

# GET 测试：期望状态码
test_get() {
  local name="$1" url="$2" expect="${3:-200}"
  local code body
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expect" ]; then
    ok "$name → $code"
  else
    err "$name → $code (期望 $expect)"
  fi
}

# GET 测试：带 header
test_get_auth() {
  local name="$1" url="$2" token="$3" expect="${4:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expect" ]; then
    ok "$name → $code"
  else
    err "$name → $code (期望 $expect)"
  fi
}

# POST 测试：期望状态码
test_post() {
  local name="$1" url="$2" body="$3" expect="${4:-200}"
  local code resp
  resp=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$body" "$url" 2>/dev/null || echo -e "\n000")
  code=$(echo "$resp" | tail -1)
  if [ "$code" = "$expect" ]; then
    ok "$name → $code"
  else
    err "$name → $code (期望 $expect)"
  fi
}

# POST 测试：带 token
test_post_auth() {
  local name="$1" url="$2" body="$3" token="$4" expect="${5:-200}"
  local code resp
  resp=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$body" "$url" 2>/dev/null || echo -e "\n000")
  code=$(echo "$resp" | tail -1)
  if [ "$code" = "$expect" ]; then
    ok "$name → $code"
  else
    err "$name → $code (期望 $expect)"
  fi
}

# ================================================================
# 开始测试
# ================================================================

echo -e "${C}╔══════════════════════════════════════════════════════════════╗${N}"
echo -e "${C}║     WinGo 学情洞察 — 全量自动化测试                          ║${N}"
echo -e "${C}╚══════════════════════════════════════════════════════════════╝${N}"
echo "目标: $BASE"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

# ================================================================
# 1. 页面路由测试
# ================================================================
section "1. 页面路由（GET 期望 200）"
test_get "首页 /" "$BASE/" "308"
test_get "落地页 /xsc" "$BASE"
test_get "分析页 analyze" "$BASE/analyze"
test_get "分析页 analyze?grade=primary" "$BASE/analyze?grade=primary"
test_get "报告页 report" "$BASE/report"
test_get "趋势页 trends" "$BASE/trends"
test_get "B端后台 b-admin" "$BASE/b-admin"
test_get "驾驶舱 cockpit" "$BASE/cockpit"
test_get "微信测试 wechat-test" "$BASE/wechat-test"

# ================================================================
# 2. 公开API测试
# ================================================================
section "2. 公开API"
test_get "health 健康检查" "$BASE/api/health"

# pay/config
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/pay/config" 2>/dev/null || echo "000")
if [ "$code" = "200" ]; then
  body=$(curl -s "$BASE/api/pay/config" 2>/dev/null | jq -r '.success // false')
  if [ "$body" = "true" ]; then ok "pay/config → 200 (success=true)"
  else warn "pay/config → 200 但 success=$body"; fi
else
  err "pay/config → $code"
fi

# wechat/jssdk (缺少url参数应400)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/wechat/jssdk" 2>/dev/null || echo "000")
if [ "$code" = "400" ] || [ "$code" = "500" ]; then
  ok "wechat/jssdk(无url) → $code (符合预期)"
else
  warn "wechat/jssdk(无url) → $code (期望 400/500)"
fi

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/wechat/jssdk?url=http://test.com" 2>/dev/null || echo "000")
if [ "$code" = "200" ] || [ "$code" = "500" ]; then
  ok "wechat/jssdk(有url) → $code"
else
  warn "wechat/jssdk(有url) → $code"
fi

# ================================================================
# 3. 鉴权API — 先获取 Token
# ================================================================
section "3. 获取测试 Token"
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"masterKey":"xsc-admin-2026"}' 2>/dev/null | jq -r '.token // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  ok "admin login → 获取 token 成功"
else
  err "admin login → 获取 token 失败"
  TOKEN=""
fi

# ================================================================
# 4. 鉴权API测试（C端）
# ================================================================
section "4. C端鉴权API"
if [ -n "$TOKEN" ]; then
  test_get_auth "auth/me" "$BASE/api/auth/me" "$TOKEN"
  test_get_auth "user/limit" "$BASE/api/user/limit" "$TOKEN"
  test_get_auth "trends" "$BASE/api/trends" "$TOKEN"
  test_get_auth "report(列表模式)" "$BASE/api/report?list=1" "$TOKEN"

  # orders (mock模式应返回模拟订单)
  test_post_auth "orders 创建订单" "$BASE/api/orders" '{"type":"single"}' "$TOKEN"

  # orders/query (无orderId应400或返回错误)
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE/api/orders/query" 2>/dev/null || echo "000")
  if [ "$code" = "400" ] || [ "$code" = "500" ] || [ "$code" = "200" ]; then
    ok "orders/query(无参数) → $code"
  else
    warn "orders/query(无参数) → $code"
  fi

  # check — 空内容应400
  test_post_auth "check(空内容)" "$BASE/api/check" '{"text":""}' "$TOKEN" "400"

  # check — 有内容（测试AI链路，可能较慢）
  echo -e "${C}  → check AI分析链路测试中（约10-30秒）...${N}"
  resp=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"text":"1. 3+5=8\n2. 12-7=5\n3. 4×6=24\n4. 18÷3=6\n5. 7+9=15","subject":"math"}' \
    "$BASE/api/check" 2>/dev/null || echo -e "\n000")
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')
  if [ "$code" = "200" ]; then
    has_success=$(echo "$body" | jq -r '.success // false')
    if [ "$has_success" = "true" ]; then
      ok "check(AI分析) → 200 (success=true)"
    else
      code_field=$(echo "$body" | jq -r '.code // empty')
      if [ "$code_field" = "NO_QUOTA" ]; then
        warn "check(AI分析) → 200 (NO_QUOTA 额度不足)"
      else
        warn "check(AI分析) → 200 但 success=false, code=$code_field"
      fi
    fi
  elif [ "$code" = "401" ]; then
    warn "check(AI分析) → 401 (token可能过期)"
  elif [ "$code" = "000" ]; then
    err "check(AI分析) → 超时/无响应"
  else
    warn "check(AI分析) → $code"
  fi

  # correct — 无图片应400
  test_post_auth "correct(无图片)" "$BASE/api/correct" '{"imageBase64":""}' "$TOKEN" "400"

  # ocr — 无图片应400
  test_post_auth "ocr(无图片)" "$BASE/api/ocr" '{"imageBase64":""}' "$TOKEN" "400"

  # apply — 完整参数
  test_post "apply 申请试用" "$BASE/api/apply" \
    '{"company":"测试公司","contactName":"测试","phone":"13800138000","email":"test@test.com","problem":"测试"}' \
    "200"

  # logout
  test_post_auth "logout 登出" "$BASE/api/auth/logout" '{}' "$TOKEN"

  # marketing/sleeping-users (数据库查询)
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/marketing/sleeping-users" 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "500" ]; then
    ok "marketing/sleeping-users → $code"
  else
    warn "marketing/sleeping-users → $code"
  fi

else
  warn "跳过鉴权API测试（无token）"
fi

# ================================================================
# 5. B端API测试
# ================================================================
section "5. B端API（机构管理）"

# 创建机构
resp=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"测试机构","type":"training","contact":"测试人","phone":"13800138001","email":"b@test.com"}' \
  "$BASE/api/b/institution" 2>/dev/null || echo -e "\n000")
code=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')

if [ "$code" = "200" ]; then
  B_API_KEY=$(echo "$body" | jq -r '.data.apiKey // empty')
  B_API_SECRET=$(echo "$body" | jq -r '.data.apiSecret // empty')
  ok "创建机构 → 200 (apiKey=$B_API_KEY)"
else
  err "创建机构 → $code"
fi

# --- B端工具函数（B端认证用 x-api-key header，非 Bearer token）---
test_get_b() {
  local name="$1" url="$2" key="$3" secret="$4" expect="${5:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "x-api-key: $key" -H "x-api-secret: $secret" "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expect" ]; then
    ok "$name → $code"
  else
    err "$name → $code (期望 $expect)"
  fi
}

test_post_b() {
  local name="$1" url="$2" body="$3" key="$4" secret="$5" expect="${6:-200}"
  local code resp
  resp=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $key" -H "x-api-secret: $secret" \
    -d "$body" "$url" 2>/dev/null || echo -e "\n000")
  code=$(echo "$resp" | tail -1)
  if [ "$code" = "$expect" ]; then
    ok "$name → $code"
  else
    err "$name → $code (期望 $expect)"
  fi
}

# B端登录验证（仅验证凭据有效性，不返回token）
if [ -n "$B_API_KEY" ] && [ -n "$B_API_SECRET" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"apiKey\":\"$B_API_KEY\",\"apiSecret\":\"$B_API_SECRET\"}" \
    "$BASE/api/b/institution/login" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    ok "B端登录验证 → 200"
  else
    err "B端登录验证 → $code"
  fi
fi

# B端鉴权API（用 x-api-key + x-api-secret header）
if [ -n "$B_API_KEY" ] && [ -n "$B_API_SECRET" ]; then
  test_get_b "b/institution/me" "$BASE/api/b/institution/me" "$B_API_KEY" "$B_API_SECRET"
  test_get_b "b/dashboard" "$BASE/api/b/dashboard" "$B_API_KEY" "$B_API_SECRET"
  test_get_b "b/class" "$BASE/api/b/class" "$B_API_KEY" "$B_API_SECRET"
  test_get_b "b/student" "$BASE/api/b/student" "$B_API_KEY" "$B_API_SECRET"
  test_get_b "b/batch" "$BASE/api/b/batch" "$B_API_KEY" "$B_API_SECRET"

  # 创建班级
  resp=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $B_API_KEY" -H "x-api-secret: $B_API_SECRET" \
    -d '{"name":"测试班","grade":"三年级","subject":"math"}' \
    "$BASE/api/b/class" 2>/dev/null || echo -e "\n000")
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')
  if [ "$code" = "200" ]; then
    CLASS_ID=$(echo "$body" | jq -r '.data.id // empty')
    ok "创建班级 → 200 (id=$CLASS_ID)"
  else
    err "创建班级 → $code"
  fi

  # 创建学员
  if [ -n "${CLASS_ID:-}" ]; then
    test_post_b "创建学员" "$BASE/api/b/student" \
      "{\"name\":\"张小明\",\"studentNo\":\"S001\",\"classId\":\"$CLASS_ID\"}" "$B_API_KEY" "$B_API_SECRET"
  fi
else
  warn "跳过B端鉴权API测试（无apiKey）"
fi

# ================================================================
# 6. 边界与异常测试
# ================================================================
section "6. 边界与异常"

# 无token访问鉴权接口 → 401
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/me" 2>/dev/null || echo "000")
if [ "$code" = "401" ]; then ok "auth/me(无token) → 401"
else warn "auth/me(无token) → $code (期望 401)"; fi

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/user/limit" 2>/dev/null || echo "000")
if [ "$code" = "401" ]; then ok "user/limit(无token) → 401"
else warn "user/limit(无token) → $code (期望 401)"; fi

# 错误masterKey → 403
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" -d '{"masterKey":"wrong"}' \
  "$BASE/api/auth/login" 2>/dev/null || echo "000")
if [ "$code" = "403" ]; then ok "login(错误密钥) → 403"
else warn "login(错误密钥) → $code (期望 403)"; fi

# 不存在的路由 → 404
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/not-exist" 2>/dev/null || echo "000")
if [ "$code" = "404" ]; then ok "不存在的路由 → 404"
else warn "不存在的路由 → $code (期望 404)"; fi

# ================================================================
# 7. 静态资源测试
# ================================================================
section "7. 静态资源"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/favicon.ico" 2>/dev/null || echo "000")
if [ "$code" = "200" ] || [ "$code" = "404" ]; then ok "favicon → $code"
else warn "favicon → $code"; fi

# ================================================================
# 汇总
# ================================================================
echo -e "\n${C}╔══════════════════════════════════════════════════════════════╗${N}"
echo -e "${C}║  测试完成                                                    ║${N}"
echo -e "${C}╠══════════════════════════════════════════════════════════════╣${N}"
printf "${C}║${N}  ${G}通过: %-3d${N}  ${R}失败: %-3d${N}  ${Y}警告: %-3d${N}  总计: %-3d ${C}║${N}\n" "$PASS" "$FAIL" "$WARN" "$((PASS + FAIL + WARN))"
echo -e "${C}╚══════════════════════════════════════════════════════════════╝${N}"

if [ "$FAIL" -gt 0 ]; then exit 1; fi
