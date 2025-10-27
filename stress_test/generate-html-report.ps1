<#
.SYNOPSIS
    Auto-generate JMeter HTML Dashboard Report from latest test results
.DESCRIPTION
    Automatically finds the most recent .jtl file and generates HTML dashboard
.EXAMPLE
    .\generate-html-report.ps1
#>

param(
    [string]$TestFile,
    [string]$OutputDir
)

# Configuration
$PROJECT_ROOT = "C:\Users\donwo\Documents\GitHub\cs4218-2510-ecom-project-team002"
$JMETER_BIN = "C:\Users\donwo\Downloads\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin"
$RESULTS_DIR = Join-Path $PROJECT_ROOT "stress_test\results"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "       JMeter HTML Dashboard Report Generator              " -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""

# Validate directories
if (-not (Test-Path $JMETER_BIN)) {
    Write-Host "[ERROR] JMeter not found at: $JMETER_BIN" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $RESULTS_DIR)) {
    Write-Host "[ERROR] Results directory not found: $RESULTS_DIR" -ForegroundColor Red
    exit 1
}

# Find .jtl file
if ($TestFile) {
    $jtlPath = Join-Path $RESULTS_DIR $TestFile
    if (-not (Test-Path $jtlPath)) {
        Write-Host "[ERROR] Test file not found: $jtlPath" -ForegroundColor Red
        exit 1
    }
    Write-Host "[INFO] Using specified test file: $TestFile" -ForegroundColor Cyan
} else {
    Write-Host "[INFO] Searching for most recent test results..." -ForegroundColor Cyan
    $jtlFiles = Get-ChildItem -Path $RESULTS_DIR -Filter "results*.jtl" | Sort-Object LastWriteTime -Descending
    
    if ($jtlFiles.Count -eq 0) {
        Write-Host "[ERROR] No .jtl result files found in $RESULTS_DIR" -ForegroundColor Red
        exit 1
    }
    
    $jtlPath = $jtlFiles[0].FullName
    Write-Host "[OK] Found most recent test: $($jtlFiles[0].Name)" -ForegroundColor Green
    Write-Host "     Created: $($jtlFiles[0].LastWriteTime)" -ForegroundColor Gray
    Write-Host "     Size: $([math]::Round($jtlFiles[0].Length / 1KB, 2)) KB" -ForegroundColor Gray
}

# Extract timestamp
if ($jtlPath -match "(\d{4}-\d{2}-\d{2}-\d{6})") {
    $timestamp = $matches[1]
} else {
    $timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
}

# Output directory
if ($OutputDir) {
    $htmlReportDir = Join-Path $RESULTS_DIR $OutputDir
} else {
    $htmlReportDir = Join-Path $RESULTS_DIR "html-report-$timestamp"
}

# Check if exists
if (Test-Path $htmlReportDir) {
    Write-Host "[WARN] Output directory already exists: $htmlReportDir" -ForegroundColor Yellow
    $response = Read-Host "Delete and recreate? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item -Path $htmlReportDir -Recurse -Force
        Write-Host "[OK] Deleted existing report" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Cancelled" -ForegroundColor Red
        exit 1
    }
}

# Generate report
Write-Host ""
Write-Host "[GENERATING] HTML Dashboard Report..." -ForegroundColor Cyan
Write-Host "[INFO] Input:  $jtlPath" -ForegroundColor Cyan
Write-Host "[INFO] Output: $htmlReportDir" -ForegroundColor Cyan
Write-Host ""

Push-Location $JMETER_BIN
$jmeterCmd = ".\jmeter.bat -g `"$jtlPath`" -o `"$htmlReportDir`""
Invoke-Expression $jmeterCmd
$exitCode = $LASTEXITCODE
Pop-Location

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "[OK] HTML report generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[LOCATION] Report: $htmlReportDir" -ForegroundColor Cyan
    
    $indexPath = Join-Path $htmlReportDir "index.html"
    if (Test-Path $indexPath) {
        $reportFiles = Get-ChildItem -Path $htmlReportDir -Recurse -File
        Write-Host "[INFO] Total files: $($reportFiles.Count)" -ForegroundColor Cyan
        Write-Host ""
        
        $response = Read-Host "Open report in browser? (Y/n)"
        if ($response -ne 'n' -and $response -ne 'N') {
            Start-Process $indexPath
            Write-Host "[OK] Report opened!" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "                  REPORT GENERATED                          " -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Open: $indexPath" -ForegroundColor White
    Write-Host "  2. Analyze: Error rates, response times, throughput" -ForegroundColor White
    Write-Host "  3. Identify: Breaking points and failure patterns" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "[ERROR] Failed to generate HTML report (Exit Code: $exitCode)" -ForegroundColor Red
    exit 1
}

# List reports
Write-Host "[REPORTS] Available HTML Reports:" -ForegroundColor Cyan
$htmlReports = Get-ChildItem -Path $RESULTS_DIR -Directory -Filter "html-report-*" | Sort-Object LastWriteTime -Descending
if ($htmlReports.Count -gt 0) {
    foreach ($report in $htmlReports) {
        $isNew = $report.FullName -eq $htmlReportDir
        $marker = if ($isNew) { ">>" } else { "  " }
        $color = if ($isNew) { "Green" } else { "Gray" }
        Write-Host "  $marker $($report.Name) ($(Get-Date $report.LastWriteTime -Format 'yyyy-MM-dd HH:mm:ss'))" -ForegroundColor $color
    }
}

Write-Host ""
Write-Host "[OK] Done!" -ForegroundColor Green
