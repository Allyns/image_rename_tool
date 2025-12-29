#!/bin/bash

# 获取脚本所在目录
cd "$(dirname "$0")"

# 设置 Go 环境
export PATH="$PATH:/usr/local/go/bin:/opt/homebrew/bin:$HOME/go/bin"

# 检查 wails 是否安装
if ! command -v wails &> /dev/null; then
    echo "正在安装 wails..."
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
fi

# 启动应用
echo "正在启动图片重命名工具..."
wails dev

