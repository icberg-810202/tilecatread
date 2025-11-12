@echo off
echo 正在使用直接Git路径部署网站...

REM 切换到当前目录
cd /d "%~dp0"

REM 检查Git是否可用
"D:\Program Files\Git\bin\git.exe" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 无法找到或运行Git
    echo 请确保Git已安装在 "D:\Program Files\Git\"
    pause
    exit /b 1
)

echo Git版本: 
"D:\Program Files\Git\bin\git.exe" --version

REM 检查是否已存在.git目录
if exist ".git" (
    echo Git仓库已存在
) else (
    echo 初始化Git仓库...
    "D:\Program Files\Git\bin\git.exe" init
    "D:\Program Files\Git\bin\git.exe" remote add origin https://github.com/icberg-810202/tilecatread.git
)

REM 配置Git用户信息（如果尚未配置）
echo 配置Git用户信息...
"D:\Program Files\Git\bin\git.exe" config --global user.email "icberg-810202@gmail.com"
"D:\Program Files\Git\bin\git.exe" config --global user.name "icberg-810202"

REM 添加所有文件
echo 添加所有文件到Git...
"D:\Program Files\Git\bin\git.exe" add .

REM 检查是否有文件需要提交
"D:\Program Files\Git\bin\git.exe" diff --cached --quiet
if %errorlevel% neq 0 (
    REM 提交更改
    echo 提交更改...
    "D:\Program Files\Git\bin\git.exe" commit -m "Upload website files"
) else (
    echo 没有文件需要提交
)

REM 推送到GitHub
echo 推送到GitHub...
"D:\Program Files\Git\bin\git.exe" push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo 推送失败，尝试强制推送...
    "D:\Program Files\Git\bin\git.exe" push -u origin main --force
)

echo.
echo 部署完成！
echo 请访问 https://github.com/icberg-810202/tilecatread 查看文件是否已上传
pause