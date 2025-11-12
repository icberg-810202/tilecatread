# Clean directory script
Write-Host "Cleaning tilecatread-main directory..." -ForegroundColor Green

# Get current directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Yellow

# Delete test and backup files
Write-Host "Deleting test and backup files..." -ForegroundColor Yellow
Remove-Item -Path "$currentDir\index.html.backup" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\test_python.py" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\simple-test.html" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\leancloud-test.html" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\test-leancloud.html" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\test-countdown.html" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\test-github-connection.html" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\deploy-instructions.txt" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\fixed-index.html" -Force -ErrorAction SilentlyContinue

# Delete deployment scripts (except necessary ones)
Write-Host "Deleting deployment scripts..." -ForegroundColor Yellow
Remove-Item -Path "$currentDir\deploy-to-github.bat" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\deploy-with-git.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\simple-deploy.bat" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\copy-files-to-bwhisper.bat" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\copy-files-to-bwhisper.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\setup-bwhisper-repo.bat" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\start-server.ps1" -Force -ErrorAction SilentlyContinue

# Delete documentation files (except main ones)
Write-Host "Deleting documentation files..." -ForegroundColor Yellow
Remove-Item -Path "$currentDir\README_COZE.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\DESIGN_UPDATE.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\GITHUB_DEPLOY.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\NETLIFY_FIXES.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\PLAYBACK_MODE_GUIDE.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\QUICKSTART_DESIGN.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\UI提示文本更新.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\密码要求修改说明.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\推送到GitHub说明.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\播放模式更新说明.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\文件上传检查报告.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\测试-模式切换.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$currentDir\顺序播放测试步骤.md" -Force -ErrorAction SilentlyContinue

# Delete backup directory
Write-Host "Deleting backup directory..." -ForegroundColor Yellow
Remove-Item -Path "$currentDir\backup" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Directory cleaning completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Files kept:" -ForegroundColor Cyan
Write-Host "- index.html (main page)" -ForegroundColor Cyan
Write-Host "- script.js (core JavaScript)" -ForegroundColor Cyan
Write-Host "- script-leancloud.js (LeanCloud integration)" -ForegroundColor Cyan
Write-Host "- leancloud-config.js (LeanCloud configuration)" -ForegroundColor Cyan
Write-Host "- style.css (stylesheet)" -ForegroundColor Cyan
Write-Host "- background.jpg (background image)" -ForegroundColor Cyan
Write-Host "- images/ (image directory)" -ForegroundColor Cyan
Write-Host "- Bwhisper/ (Bwhisper repository directory)" -ForegroundColor Cyan
Write-Host "- README.md (project documentation)" -ForegroundColor Cyan
Write-Host "- LEANCLOUD_MIGRATION_COMPLETE.md (LeanCloud migration guide)" -ForegroundColor Cyan
Write-Host "- VERSION_SWITCH.md (version switching guide)" -ForegroundColor Cyan
Write-Host "- PHONE_VERIFICATION_GUIDE.md (phone verification guide)" -ForegroundColor Cyan
Write-Host "- deployment-guide.txt (deployment guide)" -ForegroundColor Cyan
Write-Host "- leancloud-troubleshooting.txt (troubleshooting)" -ForegroundColor Cyan
Write-Host "- manual-deployment-guide.txt (manual deployment guide)" -ForegroundColor Cyan
Write-Host "- final-deployment-steps.txt (final deployment steps)" -ForegroundColor Cyan
Write-Host "- open-github-repo.bat (open GitHub repository)" -ForegroundColor Cyan
Write-Host "- deploy-to-bwhisper.bat (deploy to Bwhisper repository)" -ForegroundColor Cyan
Write-Host "- clean-directory.ps1 (current cleanup script)" -ForegroundColor Cyan