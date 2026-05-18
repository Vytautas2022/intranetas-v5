Get-ChildItem "./promptai/*.txt" | ForEach-Object {

    Write-Host "==================================="
    Write-Host "RUNNING PROMPT: $($_.Name)"
    Write-Host "==================================="

    $prompt = Get-Content $_.FullName -Raw

   codex exec --full-auto "$prompt"

    Write-Host "BUILD CHECK..."
    npm run build
    if ($LASTEXITCODE -ne 0) { exit }

    Write-Host "LINT CHECK..."
    npm run lint
    if ($LASTEXITCODE -ne 0) { exit }

    git add .

    git commit -m "Completed $($_.Name)"
}

Write-Host "PUSHING TO GITHUB..."
git push origin nightly-ai

Write-Host "ALL PROMPTS COMPLETED."