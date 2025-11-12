@echo off
echo 正在部署网站到Bwhisper GitHub仓库...

REM 切换到当前目录
cd /d "%~dp0"

REM 清空Bwhisper目录中的文件（保留.git目录）
echo 清空Bwhisper目录...
for /d %%i in ("Bwhisper\*") do if /i not "%%~nxi"==".git" rd /s /q "%%i"
del /q "Bwhisper\*" 2>nul

REM 复制所有网站文件到Bwhisper目录
echo 复制网站文件到Bwhisper目录...
xcopy "*.html" "Bwhisper\" /Y
xcopy "*.js" "Bwhisper\" /Y
xcopy "*.css" "Bwhisper\" /Y
xcopy "*.jpg" "Bwhisper\" /Y
xcopy "*.png" "Bwhisper\" /Y
xcopy "images\" "Bwhisper\images\" /E /Y /I
xcopy "Bwhisper\" "Bwhisper\Bwhisper\" /E /Y /I 2>nul

REM 进入Bwhisper目录
cd Bwhisper

REM 添加所有文件到Git
echo 添加文件到Git...
git add .

REM 提交更改
echo 提交更改...
git commit -m "Upload website files"

REM 推送到GitHub
echo 推送到GitHub...
git push -u origin main

echo 部署完成！
pause