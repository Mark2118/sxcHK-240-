#!/usr/bin/env python3
"""
自动推送守护进程
每 10 分钟检查一次，有未提交/未推送的改动就自动处理
"""

import subprocess
import time
import os
import datetime

REPO_DIR = r"D:\02工作空间"
INTERVAL = 600  # 10 分钟

def run(cmd, cwd=REPO_DIR):
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr

def auto_push():
    # 检查是否有未提交的改动
    code, out, err = run("git status --porcelain")
    
    if out.strip():
        # 有改动，自动提交
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        run("git add -A")
        run(f'git commit -m "auto: {timestamp}"')
        print(f"[{timestamp}] 自动提交 {len(out.strip().split(chr(10)))} 个文件")
    
    # 检查是否有未推送的提交
    code, out, err = run("git log origin/main..main --oneline")
    
    if out.strip():
        code, push_out, push_err = run("git push origin main")
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if code == 0:
            print(f"[{timestamp}] 自动推送成功")
        else:
            print(f"[{timestamp}] 推送失败: {push_err}")

if __name__ == "__main__":
    print(f"自动推送守护进程启动，间隔 {INTERVAL} 秒")
    while True:
        try:
            auto_push()
        except Exception as e:
            print(f"错误: {e}")
        time.sleep(INTERVAL)
