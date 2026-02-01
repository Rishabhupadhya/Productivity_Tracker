# Complete Email Import Flow Test
# Tests the entire end-to-end flow of email transaction import

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "EMAIL IMPORT FLOW TEST" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n[1] Logging in..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"uprishabh29@gmail.com","password":"December@29"}'

$token = $loginResponse.token
Write-Host "✓ Login successful" -ForegroundColor Green

# Step 2: Check OAuth Status
Write-Host "`n[2] Checking email connection status..." -ForegroundColor Yellow
$oauthStatus = Invoke-RestMethod -Uri "http://localhost:5001/api/finance/email/oauth/status" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}

Write-Host "Connection Status:" -ForegroundColor Cyan
$oauthStatus | ConvertTo-Json -Depth 3

if (-not $oauthStatus.connected) {
  Write-Host "`n⚠️  Gmail not connected. Please connect Gmail first." -ForegroundColor Red
  exit 1
}

Write-Host "✓ Gmail connected: $($oauthStatus.userEmail)" -ForegroundColor Green

# Step 3: Process Emails
Write-Host "`n[3] Processing emails (last 7 days)..." -ForegroundColor Yellow
$processResult = Invoke-RestMethod -Uri "http://localhost:5001/api/finance/email/process?daysBack=7" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body '{"provider":"gmail"}'

Write-Host "`nImport Results:" -ForegroundColor Cyan
Write-Host "  ✓ Emails Processed: $($processResult.emailsProcessed)" -ForegroundColor White
Write-Host "  ✓ Transactions Created: $($processResult.transactionsCreated)" -ForegroundColor Green
Write-Host "  ⚠ Duplicates Skipped: $($processResult.duplicatesSkipped)" -ForegroundColor Yellow
Write-Host "  ✗ Parse Failures: $($processResult.parseFailures)" -ForegroundColor $(if ($processResult.parseFailures -gt 0) { "Red" } else { "White" })
if ($processResult.limitBreachAlerts -gt 0) {
  Write-Host "  🚨 Limit Breach Alerts: $($processResult.limitBreachAlerts)" -ForegroundColor Red
}

# Step 4: Fetch Transactions
Write-Host "`n[4] Fetching imported transactions..." -ForegroundColor Yellow
$endDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

$url = "http://localhost:5001/api/finance/transactions?startDate=$startDate&endDate=$endDate&type=expense&paymentType=credit"
$transactions = Invoke-RestMethod -Uri $url `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}

Write-Host "`nTransactions Retrieved:" -ForegroundColor Cyan
Write-Host "  Count: $($transactions.count)" -ForegroundColor White

if ($transactions.count -gt 0) {
  Write-Host "`n  Recent Transactions:" -ForegroundColor Cyan
  $transactions.transactions | Select-Object -First 5 | ForEach-Object {
    $date = [DateTime]::Parse($_.date).ToString("MMM dd, yyyy HH:mm")
    Write-Host "    • ₹$($_.amount) - $($_.description) ($date)" -ForegroundColor White
  }
  
  $totalAmount = ($transactions.transactions | Measure-Object -Property amount -Sum).Sum
  Write-Host "`n  Total Amount: ₹$($totalAmount.ToString('N2'))" -ForegroundColor Green
}

# Summary
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$allGood = $oauthStatus.connected -and 
           $processResult.success -and 
           $processResult.parseFailures -eq 0 -and
           $transactions.count -gt 0

if ($allGood) {
  Write-Host "✅ All tests passed! Email import working perfectly." -ForegroundColor Green
} else {
  Write-Host "⚠️  Some issues detected:" -ForegroundColor Yellow
  if (-not $oauthStatus.connected) {
    Write-Host "  - Gmail not connected" -ForegroundColor Red
  }
  if (-not $processResult.success) {
    Write-Host "  - Email processing failed" -ForegroundColor Red
  }
  if ($processResult.parseFailures -gt 0) {
    Write-Host "  - $($processResult.parseFailures) parse failures" -ForegroundColor Red
  }
  if ($transactions.count -eq 0) {
    Write-Host "  - No transactions retrieved" -ForegroundColor Red
  }
}

Write-Host ""
