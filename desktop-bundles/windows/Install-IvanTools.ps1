[CmdletBinding()]
param(
    [ValidateSet("all", "daily", "developer", "creative", "browser")]
    [string]$Group = "all",
    [string]$Destination = (Join-Path $env:USERPROFILE "Downloads\IvanTools-Windows")
)

$ErrorActionPreference = "Stop"

# Direct connection only: do not use a configured HTTP proxy.
Add-Type -AssemblyName System.Net.Http
$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.UseProxy = $false
$handler.AllowAutoRedirect = $true
$client = [System.Net.Http.HttpClient]::new($handler)

$packages = @(
    [pscustomobject]@{ Id="BystryjSkrin"; Group="daily"; File="BystryjSkrin.exe"; Url="https://github.com/ivanivorontsov-sudo/bystryj-skrin/releases/download/v1.0.0/BystryjSkrin.exe"; Sha256="625f281ff716b114d5e0f93e3e55bfa589dcfea7895b10c0ca2e07c6fbe855fa" },
    [pscustomobject]@{ Id="PodsvetkaMyshi"; Group="daily"; File="PodsvetkaMyshi.exe"; Url="https://github.com/ivanivorontsov-sudo/podsvetka-myshi/releases/download/v1.0.0/PodsvetkaMyshi.exe"; Sha256="285b669762fa962a13e27e0bc6364df85fd79b3aff7e833d7befb844472709cc" },
    [pscustomobject]@{ Id="Antiraskladka"; Group="daily"; File="Antiraskladka-Setup-1.1.0.exe"; Url="https://github.com/ivanivorontsov-sudo/antiraskladka/releases/download/v1.1.0-typo/Antiraskladka-Setup-1.1.0.exe"; Sha256="72923278057cf108a9c006a25d5e9b04d009771030b80c0ee844432df6b86eb6" },
    [pscustomobject]@{ Id="Tirproc"; Group="daily"; File="Tirproc-Setup-1.3.1.exe"; Url="https://github.com/ivanivorontsov-sudo/tirproc/releases/download/v1.3.1/Tirproc-Setup-1.3.1.exe"; Sha256="e8d1394b02f3622725c5367473acdf2e32a601bdd4eec855b5b6b8a422c6b2d3" },
    [pscustomobject]@{ Id="Ponyatny"; Group="developer"; File="ponyatny.exe"; Url="https://github.com/ivanivorontsov-sudo/ponyatny/releases/download/v2.5.0/ponyatny.exe"; Sha256="dea1ac5dff56b9098c8a73f7e14578bded58b4b3521b9c2dd09a524c4c0a3a08" },
    [pscustomobject]@{ Id="UchitelII"; Group="developer"; File="UchitelII-1.2.0-Windows.zip"; Url="https://github.com/ivanivorontsov-sudo/uchitel-ii/releases/download/v1.2.0/UchitelII-1.2.0-Windows.zip"; Sha256="f4204b00bf338754509b040f0c689c9dfe85d76cd4cf39d3c4954508ad24714e" },
    [pscustomobject]@{ Id="IvanCode"; Group="developer"; File="IvanCode-1.4.0-Windows.zip"; Url="https://github.com/ivanivorontsov-sudo/ivankod/releases/download/v1.4.0/IvanCode-1.4.0-Windows.zip"; Sha256="263702105874fd5ff4e30f72d4089b6e2bf82e4084095a9f5127513067ba21ac" },
    [pscustomobject]@{ Id="Kadr"; Group="creative"; File="Kadr-Setup-1.0.0.exe"; Url="https://github.com/ivanivorontsov-sudo/kadr-studio/releases/download/v1.0.0/Kadr-Setup-1.0.0.exe"; Sha256="5bc7c3786d4cb092fca47706f1fa97abd9fd74ca2105fb9bb75add0161fd1ef7" },
    [pscustomobject]@{ Id="SuperExtPro"; Group="browser"; File="super-ext-pro-v1.1.zip"; Url="https://github.com/ivanivorontsov-sudo/super-ext-pro/releases/download/v1.1/super-ext-pro-v1.1.zip"; Sha256="f0df0943f28f9f8a5294baa5d4d09dc3492ba4b8ecc33e1e9240524e12372bf2" }
)

$selected = if ($Group -eq "all") { $packages } else { @($packages | Where-Object { $_.Group -eq $Group }) }
if ($selected.Count -eq 0) { throw "Для группы '$Group' пакеты не найдены." }

New-Item -ItemType Directory -Force -Path $Destination | Out-Null
Write-Host "Папка загрузки: $Destination" -ForegroundColor Cyan
Write-Host "Группа: $Group. Скачанные программы автоматически запускаться не будут." -ForegroundColor Cyan

try {
    foreach ($package in $selected) {
        $target = Join-Path $Destination $package.File

        if (Test-Path $target) {
            $existing = (Get-FileHash -Algorithm SHA256 -Path $target).Hash.ToLowerInvariant()
            if ($existing -eq $package.Sha256) {
                Write-Host "[OK] Уже есть: $($package.File)" -ForegroundColor Green
                continue
            }
            Remove-Item -Force $target
        }

        $temporary = "$target.part"
        if (Test-Path $temporary) { Remove-Item -Force $temporary }

        Write-Host "Скачиваю: $($package.File)"
        try {
            $response = $client.GetAsync(
                $package.Url,
                [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead
            ).GetAwaiter().GetResult()
            $response.EnsureSuccessStatusCode()
            $inputStream = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
            $outputStream = [System.IO.File]::Create($temporary)
            try {
                $inputStream.CopyTo($outputStream)
            }
            finally {
                $outputStream.Dispose()
                $inputStream.Dispose()
                $response.Dispose()
            }

            $actual = (Get-FileHash -Algorithm SHA256 -Path $temporary).Hash.ToLowerInvariant()
            if ($actual -ne $package.Sha256) {
                throw "SHA-256 не совпал для $($package.File). Файл удалён."
            }
            Move-Item -Force $temporary $target
            Write-Host "[OK] Проверено: $($package.File)" -ForegroundColor Green
        }
        catch {
            if (Test-Path $temporary) { Remove-Item -Force $temporary }
            throw
        }
    }
}
finally {
    $client.Dispose()
    $handler.Dispose()
}

Write-Host ""
Write-Host "Готово. Файлы находятся в: $Destination" -ForegroundColor Green
Write-Host "Ни один скачанный файл не был запущен автоматически."
