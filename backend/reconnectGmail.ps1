# Gmail Reconnect Script
# This will help you get a fresh OAuth token

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Gmail OAuth Reconnection Helper            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Login
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"email":"uprishabh29@gmail.com","password":"December@29"}'
    
    $token = $loginResponse.token
    Write-Host "✅ Logged in successfully!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed. Is the backend running?" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get OAuth URL
Write-Host "Step 2: Getting Gmail OAuth URL..." -ForegroundColor Yellow
try {
    $oauthResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/finance/email/oauth/gmail/authorize" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $token"}
    
    $authUrl = $oauthResponse.authUrl
    Write-Host "✅ OAuth URL retrieved!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get OAuth URL" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Display instructions
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Step 3: Authorize Gmail Access" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "A browser window will open. Please:" -ForegroundColor White
Write-Host "  1. Select your Gmail account (uprishabh29@gmail.com)" -ForegroundColor White
Write-Host "  2. Click 'Continue' or 'Allow'" -ForegroundColor White
Write-Host "  3. Grant read-only access to Gmail" -ForegroundColor White
Write-Host "  4. Wait for the success page" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Open browser
Start-Process $authUrl

Write-Host ""
Write-Host "✅ Browser opened!" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Waiting for you to authorize... (Press Enter after authorizing)" -ForegroundColor Yellow
Read-Host

# Step 4: Verify connection
Write-Host "`nStep 4: Verifying Gmail connection..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $statusResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/finance/email/status" `
        -Method GET `
        -Headers @{"Authorization"="Bearer $token"}
    
    if ($statusResponse.gmail -and $statusResponse.gmail.connected) {
        Write-Host "✅ Gmail connected successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Account: $($statusResponse.gmail.userEmail)" -ForegroundColor Cyan
        Write-Host "Connected at: $($statusResponse.gmail.connectedAt)" -ForegroundColor Cyan
        
        # Step 5: Test fetching emails
        Write-Host "`nStep 5: Testing email fetch (last 7 days)..." -ForegroundColor Yellow
        
        $testResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/finance/email/process?daysBack=7" `
            -Method POST `
            -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
            -Body '{"provider":"gmail"}'
        
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "🎉 SUCCESS! Email Processing Results:" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "  Emails Processed    : $($testResponse.emailsProcessed)" -ForegroundColor Cyan
        Write-Host "  Transactions Created: $($testResponse.transactionsCreated)" -ForegroundColor Green
        Write-Host "  Parse Failures      : $($testResponse.parseFailures)" -ForegroundColor Yellow
        Write-Host "  Duplicates          : $($testResponse.duplicatesSkipped)" -ForegroundColor Gray
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host ""
        
        if ($testResponse.transactionsCreated -gt 0) {
            Write-Host "✅ $($testResponse.transactionsCreated) credit card transactions imported!" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  No new transactions found in last 7 days" -ForegroundColor Yellow
            Write-Host "   Try fetching more days:" -ForegroundColor Yellow
            Write-Host "   Invoke-RestMethod -Uri 'http://localhost:5001/api/finance/email/process?daysBack=30' ..." -ForegroundColor Gray
        }
        
    } else {
        Write-Host "⚠️  Connection status unclear. Check manually:" -ForegroundColor Yellow
        Write-Host "   http://localhost:5001/api/finance/email/status" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Could not verify connection" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try manually:" -ForegroundColor Yellow
    Write-Host "  1. Check status: http://localhost:5001/api/finance/email/status" -ForegroundColor Gray
    Write-Host "  2. Process emails: http://localhost:5001/api/finance/email/process" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done! Gmail is now connected to your account." -ForegroundColor Green
Write-Host ""
