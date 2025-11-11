@echo off
echo 正在准备部署到GitHub...

REM 创建备份文件夹
if not exist "backup" mkdir "backup"

REM 备份重要文件
copy "index.html" "backup\index.html.backup"
copy "script.js" "backup\script.js.backup"
copy "leancloud-config.js" "backup\leancloud-config.js.backup"

echo 文件备份完成

REM 创建部署说明
echo 部署说明 > deploy-instructions.txt
echo ========== >> deploy-instructions.txt
echo 1. 请确保已安装Git >> deploy-instructions.txt
echo 2. 在GitHub上创建一个新的仓库 >> deploy-instructions.txt
echo 3. 使用以下命令初始化Git仓库并推送到GitHub: >> deploy-instructions.txt
echo. >> deploy-instructions.txt
echo    git init >> deploy-instructions.txt
echo    git add . >> deploy-instructions.txt
echo    git commit -m "Initial commit" >> deploy-instructions.txt
echo    git branch -M main >> deploy-instructions.txt
echo    git remote add origin [你的GitHub仓库URL] >> deploy-instructions.txt
echo    git push -u origin main >> deploy-instructions.txt
echo. >> deploy-instructions.txt
echo 部署完成！请按照以上说明操作。

echo. >> deploy-instructions.txt
echo LeanCloud连接问题解决方案：>> deploy-instructions.txt
echo 请查看 leancloud-troubleshooting.txt 文件了解如何解决LeanCloud连接问题 >> deploy-instructions.txt
echo. >> deploy-instructions.txt
echo GitHub Pages连接测试：>> deploy-instructions.txt
echo 部署后请访问以下URL测试LeanCloud连接：>> deploy-instructions.txt
echo https://icberg-810202.github.io/tilecatread/test-github-connection.html >> deploy-instructions.txt
echo. >> deploy-instructions.txt

echo 部署脚本已创建，请查看 deploy-instructions.txt 文件了解如何部署到GitHub
echo 请查看 leancloud-troubleshooting.txt 文件了解如何解决LeanCloud连接问题
echo 部署后请查看 deployment-guide.txt 了解完整部署指南
echo 部署后请访问 test-github-connection.html 测试LeanCloud连接
pause