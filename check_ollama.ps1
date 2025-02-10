$maxAttempts = 30
$attempt = 0
$success = $false

Write-Host "Checking if Ollama is running..."

while ($attempt -lt $maxAttempts -and -not $success) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "Ollama is running and responding!"
            $success = $true
        }
    }
    catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Write-Host "Waiting for Ollama to start... (Attempt $attempt of $maxAttempts)"
            Start-Sleep -Seconds 1
        }
    }
}

if (-not $success) {
    Write-Host "Failed to connect to Ollama after $maxAttempts attempts."
    exit 1
}

exit 0