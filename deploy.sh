#!/bin/bash
# Meta Assets 官网部署脚本
# 用法: bash deploy.sh

set -e

# ===== 配置 =====
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="main"
WEB_DIR="/var/www/metaassetschain-org"

echo "======================================"
echo "  Meta Assets 官网部署"
echo "======================================"
echo "项目目录: $PROJECT_DIR"
echo "目标目录: $WEB_DIR"
echo "分支:     $BRANCH"
echo ""

# 1. 拉取最新代码
echo "[1/4] 拉取最新代码..."
cd "$PROJECT_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
echo "✓ 代码已更新"
echo ""

# 2. 安装依赖
echo "[2/4] 检查依赖..."
if git diff HEAD@{1} HEAD -- package.json package-lock.json | grep -q . 2>/dev/null; then
    echo "检测到 package.json 变更，重新安装依赖..."
    npm install
else
    echo "package.json 无变更，跳过依赖安装"
fi
echo "✓ 依赖就绪"
echo ""

# 3. 构建
echo "[3/4] 构建生产包..."
npm run build
echo "✓ 构建完成"
echo ""

# 4. 部署到站点目录
echo "[4/4] 部署到 $WEB_DIR ..."
mkdir -p "$WEB_DIR"
# 用 rsync 同步，--delete 删除旧文件，排除不需要的
if command -v rsync &> /dev/null; then
    rsync -av --delete "$PROJECT_DIR/dist/" "$WEB_DIR/"
else
    rm -rf "$WEB_DIR"/*
    cp -r "$PROJECT_DIR/dist/"* "$WEB_DIR/"
fi
echo "✓ 部署完成"
echo ""

echo "======================================"
echo "  部署成功！"
echo "======================================"
