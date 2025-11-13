$port = 8080
$url = "http://localhost:$port"
Write-Host "Starting server at $url" -ForegroundColor Green
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("$url/")
$listener.Start()
Write-Host "Server started! Opening browser..." -ForegroundColor Green
Start-Sleep -Seconds 1
Start-Process "$url/index.html"
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $filePath = $request.Url.LocalPath.TrimStart('/')
    if ($filePath -eq '') { $filePath = 'index.html' }
    $fullPath = Join-Path (Get-Location) $filePath
    if (Test-Path $fullPath -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($fullPath)
        $response.ContentLength64 = $content.Length
        $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
        switch ($ext) {
            '.html' { $response.ContentType = 'text/html; charset=utf-8' }
            '.css'  { $response.ContentType = 'text/css; charset=utf-8' }
            '.js'   { $response.ContentType = 'application/javascript; charset=utf-8' }
            '.jpg'  { $response.ContentType = 'image/jpeg' }
            '.png'  { $response.ContentType = 'image/png' }
            default { $response.ContentType = 'application/octet-stream' }
        }
        $response.StatusCode = 200
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
    }
    $response.Close()
}
