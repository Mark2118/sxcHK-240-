# WinGo 万能测试站 - 02号 Windows
# 用法: 右键 → 使用 PowerShell 运行

$base = Split-Path $PSScriptRoot -Parent
$title = "WinGo 万能测试站"

function Show-Menu {
    Clear-Host
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     WinGo 万能测试站 — 02号 Windows     ║" -ForegroundColor Cyan
    Write-Host "╠══════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  1. 启动开发服务器 (npm run dev)        ║" -ForegroundColor White
    Write-Host "║  2. 填充演示数据 (3班10人+2条分析)      ║" -ForegroundColor White
    Write-Host "║  3. 重置数据库 (清空所有数据)           ║" -ForegroundColor White
    Write-Host "║  4. 检查API连通性 (百度+MiniMax)        ║" -ForegroundColor White
    Write-Host "║  5. 查看实时日志 (tail -f)              ║" -ForegroundColor White
    Write-Host "║  6. 一键演示模式 (启动+填充+打开浏览器) ║" -ForegroundColor Green
    Write-Host "║  0. 退出                               ║" -ForegroundColor Gray
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Start-Dev {
    Write-Host "[→] 启动开发服务器..." -ForegroundColor Yellow
    $nodes = Get-Process node -ErrorAction SilentlyContinue
    if ($nodes) {
        $nodes | Stop-Process -Force
        Start-Sleep 1
        Write-Host "[✓] 已杀死旧进程" -ForegroundColor Green
    }
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run","dev" -WorkingDirectory $base
    Write-Host "[✓] 服务器启动中... 访问 http://localhost:3000/xsc/b-admin" -ForegroundColor Green
    Write-Host "    按回车返回菜单"
    Read-Host
}

function Seed-Demo {
    Write-Host "[→] 填充演示数据..." -ForegroundColor Yellow
    & node "$base\scripts\seed-demo.js"
    Write-Host "[✓] 完成" -ForegroundColor Green
    Read-Host "按回车返回"
}

function Reset-Db {
    Write-Host "[!] 警告: 将清空所有数据!" -ForegroundColor Red
    $c = Read-Host "输入 yes 确认"
    if ($c -eq 'yes') {
        & node "$base\scripts\reset-db.js"
        Write-Host "[✓] 数据库已重置" -ForegroundColor Green
    } else {
        Write-Host "[×] 取消" -ForegroundColor Gray
    }
    Read-Host "按回车返回"
}

function Check-Api {
    Write-Host "[→] 检查API连通性..." -ForegroundColor Yellow
    & node "$base\scripts\check-api.js"
    Read-Host "按回车返回"
}

function Show-Logs {
    Write-Host "[→] 实时日志 (Ctrl+C 退出)..." -ForegroundColor Yellow
    & powershell -Command "Get-Content '$base\.next\logs\*' -Tail 20 -Wait -ErrorAction SilentlyContinue"
}

function Start-DemoMode {
    Write-Host "[→] 一键演示模式启动中..." -ForegroundColor Green
    Start-Dev
    Start-Sleep 5
    Seed-Demo
    Write-Host "[✓] 演示模式就绪!" -ForegroundColor Green
    Write-Host "    打开浏览器: http://localhost:3000/xsc/b-admin" -ForegroundColor Cyan
    Write-Host "    点击 [开发演示登录(免密)] 即可进入" -ForegroundColor Cyan
    Start-Process "http://localhost:3000/xsc/b-admin"
}

while ($true) {
    Show-Menu
    $c = Read-Host "选择"
    switch ($c) {
        '1' { Start-Dev }
        '2' { Seed-Demo }
        '3' { Reset-Db }
        '4' { Check-Api }
        '5' { Show-Logs }
        '6' { Start-DemoMode }
        '0' { exit }
        default { Write-Host "无效选择" -ForegroundColor Red; Start-Sleep 1 }
    }
}
