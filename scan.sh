#!/bin/bash

cd /root/.openclaw/workspace/yk04-wingedu

echo "=========================================="
echo "YK-04 代码审查报告"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# 1. 检查MOCK登录/支付
echo "🔍 扫描 MOCK登录/支付 代码..."
echo "------------------------------------------"
grep -rn "mock_wx_code\|mock.*code\|MOCK\|mock.*login\|mock.*pay" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ || echo "未找到MOCK登录代码"
echo ""

# 2. 检查alert弹窗
echo "🔍 扫描 alert() 弹窗..."
echo "------------------------------------------"
grep -rn "alert(" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ || echo "未找到alert弹窗"
echo ""

# 3. 检查console残留
echo "🔍 扫描 console.log 残留..."
echo "------------------------------------------"
grep -rn "console\.log\|console\.warn\|console\.error\|console\.debug" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ | head -50 || echo "未找到console残留"
echo ""

# 4. 检查auth重复
echo "🔍 扫描 auth() 重复定义/调用..."
echo "------------------------------------------"
echo "--- auth函数定义 ---"
grep -rn "export.*function.*auth\|function auth\|const auth\|let auth" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ || echo "未找到auth函数定义"
echo ""
echo "--- auth调用统计 ---"
grep -rn "auth(" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ | wc -l
echo "总调用次数"
echo ""

# 5. 检查输入验证
echo "🔍 扫描输入验证..."
echo "------------------------------------------"
echo "--- 缺少验证的API路由 ---"
find src/app/api -name "route.ts" -o -name "route.js" | while read f; do
    if ! grep -q "zod\|joi\|yup\|validation\|validate\|sanitize" "$f" 2>/dev/null; then
        echo "⚠️ 可能缺少输入验证: $f"
    fi
done
echo ""

# 6. 检查硬编码密钥/敏感信息
echo "🔍 扫描硬编码密钥..."
echo "------------------------------------------"
grep -rn "sk-.*[a-zA-Z0-9]\|api[_-]key\|secret\|password.*=" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.env*" src/ | grep -v "\.env\.example\|process\.env\." | head -20 || echo "未发现明显硬编码密钥"
echo ""

# 7. 检查SQL注入风险
echo "🔍 扫描SQL注入风险..."
echo "------------------------------------------"
grep -rn "\.query\|\.raw\|exec\|execute" --include="*.ts" --include="*.tsx" src/lib/ src/app/api/ | grep -v "prepared\|parameterized" | head -20 || echo "未发现明显SQL注入风险"
echo ""

# 8. 检查XSS风险
echo "🔍 扫描XSS风险..."
echo "------------------------------------------"
grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ || echo "未发现XSS风险代码"
echo ""

echo "=========================================="
echo "扫描完成"
echo "=========================================="
