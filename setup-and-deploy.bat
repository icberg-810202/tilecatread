@echo off
echo 正在设置Git环境并部署网站...

REM 设置Git路径
set PATH=%PATH%;D:\Program Files\Git\bin;D:\Program Files\Git\cmd

REM 切换到Bwhisper目录
cd /d "%~dp0Bwhisper"

REM 检查Git是否可用
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Git未正确安装或配置
    echo 请确保Git已安装并添加到系统PATH环境变量中
    pause
    exit /b 1
)

echo Git版本: 
git --version

REM 更新远程仓库URL
echo 更新远程仓库URL...
git remote set-url origin https://github.com/icberg-810202/tilecatread.git

REM 添加所有文件
echo 添加所有文件...
git add .

REM 提交更改
echo 提交更改...
git commit -m "Update website files"

REM 推送到GitHub
echo 推送到GitHub...
git push -u origin main

echo 部署完成！
pause