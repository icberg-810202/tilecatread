@echo off
echo 正在初始化Git仓库并推送文件到GitHub...

REM 切换到当前目录
cd /d "%~dp0"

REM 检查是否已存在.git目录
if exist ".git" (
    echo Git仓库已存在
) else (
    echo 初始化Git仓库...
    git init
    git remote add origin https://github.com/icberg-810202/tilecatread.git
)

REM 配置Git用户信息
git config --global user.email "icberg-810202@gmail.com"
git config --global user.name "icberg-810202"

REM 添加所有文件
echo 添加所有文件到Git...
git add .

REM 提交更改
echo 提交更改...
git commit -m "Initial commit: Upload website files"

REM 推送到GitHub
echo 推送到GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo 推送失败，尝试强制推送...
    git push -u origin main --force
)

echo.
echo 部署完成！
echo 请访问 https://github.com/icberg-810202/tilecatread 查看文件是否已上传
pause