Param(
    [int]
    $Port = 8000
)

Write-Host "Starting simple static server on port $Port... (Ctrl+C to stop)" -ForegroundColor Cyan

try {
    $listener = New-Object System.Net.HttpListener
    $prefix = "http://+:$Port/"
    $listener.Prefixes.Add($prefix)
    $listener.Start()
} catch {
    Write-Error "Failed to start HTTP listener. Try running PowerShell as Administrator or choose another port."
    exit 1
}

function Get-MimeType($path){
    switch ([System.IO.Path]::GetExtension($path).ToLower()){
        '.html' { 'text/html' }
        '.htm'  { 'text/html' }
        '.css'  { 'text/css' }
        '.js'   { 'application/javascript' }
        '.json' { 'application/json' }
        '.png'  { 'image/png' }
        '.jpg'  { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.svg'  { 'image/svg+xml' }
        '.webp' { 'image/webp' }
        default { 'application/octet-stream' }
    }
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        $rawPath = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($rawPath)) { $rawPath = 'index.html' }

        $filePath = Join-Path -Path (Get-Location) -ChildPath $rawPath

        if (-not (Test-Path $filePath)) {
            $res.StatusCode = 404
            $msg = "404 - Not Found"
            $buf = [System.Text.Encoding]::UTF8.GetBytes($msg)
            $res.ContentType = 'text/plain'
            $res.ContentLength64 = $buf.Length
            $res.OutputStream.Write($buf, 0, $buf.Length)
            $res.OutputStream.Close()
            continue
        }

        $mime = Get-MimeType $filePath
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentType = $mime
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.OutputStream.Close()
    }
} finally {
    if ($listener -and $listener.IsListening) { $listener.Stop(); $listener.Close() }
    Write-Host "Server stopped." -ForegroundColor Yellow
}
