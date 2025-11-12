# Test website deployment status
Write-Host "Testing website deployment status..." -ForegroundColor Green

try {
    # Test main page
    Write-Host "Testing main page..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "https://icberg-810202.github.io/tilecatread/" -Method HEAD -TimeoutSec 10
    Write-Host "Main page status code: $($response.StatusCode)" -ForegroundColor Green
    
    # Test LeanCloud connection page
    Write-Host "Testing LeanCloud connection page..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "https://icberg-810202.github.io/tilecatread/test-github-connection.html" -Method HEAD -TimeoutSec 10
    Write-Host "LeanCloud connection page status code: $($response.StatusCode)" -ForegroundColor Green
    
    Write-Host "Website deployment successful!" -ForegroundColor Green
}
catch {
    Write-Host "Website may not be deployed or accessible" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Recommended actions:" -ForegroundColor Cyan
Write-Host "1. Ensure Git is properly installed and added to system PATH" -ForegroundColor Cyan
Write-Host "2. Run setup-and-deploy.bat script to complete deployment" -ForegroundColor Cyan
Write-Host "3. Check GitHub Pages settings are correctly configured" -ForegroundColor Cyan