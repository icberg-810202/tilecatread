# 初始化本地仓库并推送文件到GitHub的PowerShell脚本
Write-Host "正在初始化本地仓库并推送文件到GitHub..." -ForegroundColor Green

# 设置工作目录
Set-Location -Path "E:\我的应用\tilecatread-main"

# 检查Git是否可用
try {
    $gitVersion = & "D:\Program Files\Git\bin\git.exe" --version
    Write-Host "Git版本: $gitVersion" -ForegroundColor Yellow
}
catch {
    Write-Host "错误: 无法找到或运行Git" -ForegroundColor Red
    Write-Host "请确保Git已安装在 D:\Program Files\Git\" -ForegroundColor Red
    pause
    exit 1
}

# 初始化Git仓库
Write-Host "初始化Git仓库..." -ForegroundColor Yellow
& "D:\Program Files\Git\bin\git.exe" init

# 设置远程仓库URL
Write-Host "设置远程仓库URL..." -ForegroundColor Yellow
& "D:\Program Files\Git\bin\git.exe" remote add origin https://github.com/icberg-810202/tilecatread.git

# 配置Git用户信息
Write-Host "配置Git用户信息..." -ForegroundColor Yellow
& "D:\Program Files\Git\bin\git.exe" config --global user.email "icberg-810202@gmail.com"
& "D:\Program Files\Git\bin\git.exe" config --global user.name "icberg-810202"

# 添加所有文件
Write-Host "添加所有文件到Git..." -ForegroundColor Yellow
& "D:\Program Files\Git\bin\git.exe" add .

# 提交更改
Write-Host "提交更改..." -ForegroundColor Yellow
& "D:\Program Files\Git\bin\git.exe" commit -m "Initial commit: Upload website files"

# 推送到GitHub
Write-Host "推送到GitHub..." -ForegroundColor Yellow
& "D:\Program Files\Git\bin\git.exe" push -u origin main

# 检查推送是否成功
if ($LASTEXITCODE -ne 0) {
    Write-Host "推送失败，尝试强制推送..." -ForegroundColor Yellow
    & "D:\Program Files\Git\bin\git.exe" push -u origin main --force
}

Write-Host "部署完成！" -ForegroundColor Green
Write-Host "请访问 https://github.com/icberg-810202/tilecatread 查看文件是否已上传" -ForegroundColor Cyan

Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")