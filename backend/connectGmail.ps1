# Connect Gmail and Fetch January Transactions
# After adding test user in Google Cloud Console

$Email = "uprishabh29@gmail.com"
$Password = "December@29"
$BASE_URL = "http://localhost:5001/api"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        🚀 Connect Gmail & Fetch January Transactions      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

try {
    # Step 1: Login
    Write-Host "🔐 Step 1: Logging in..." -ForegroundColor Yellow
    
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    $token = $loginResponse.token
    $headers = @{ Authorization = "Bearer $token" }
    
    Write-Host "✅ Logged in successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Step 2: Get Gmail OAuth URL
    Write-Host "📧 Step 2: Getting Gmail authorization URL..." -ForegroundColor Yellow
    
    $authResponse = Invoke-RestMethod -Uri "$BASE_URL/finance/email/oauth/gmail/authorize" -Method Get -Headers $headers
    
    Write-Host ""
    Write-Host "🔗 AUTHORIZATION URL:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $authResponse.authUrl -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Instructions:" -ForegroundColor Cyan
    Write-Host "   1. Copy the URL above" -ForegroundColor White
    Write-Host "   2. Open it in your browser" -ForegroundColor White
    Write-Host "   3. Login with: uprishabh29@gmail.com" -ForegroundColor White
    Write-Host "   4. Click 'Continue' (you're now added as test user!)" -ForegroundColor White
    Write-Host "   5. Grant read-only access to Gmail" -ForegroundColor White
    Write-Host "   6. Wait for redirect to: http://localhost:5173/finance/email/connected..." -ForegroundColor White
    Write-Host ""
    Write-Host "⏳ After you see 'connected' or are redirected, press Enter here..." -ForegroundColor Yellow
    
    Read-Host
    
    Write-Host ""
    Write-Host "✅ OAuth completed! Token should be saved." -ForegroundColor Green
    Write-Host ""
    
    # Step 3: Fetch January emails
    Write-Host "📅 Step 3: Fetching January 2026 emails (31 days)..." -ForegroundColor Yellow
    Write-Host "   This may take a minute..." -ForegroundColor Gray
    Write-Host ""
    
    $processBody = @{
        provider = "gmail"
        daysBack = 31
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$BASE_URL/finance/email/process" -Method Post -Headers $headers -Body $processBody -ContentType "application/json"
    
    # Display results
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                     📊 RESULTS                             ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "✅ Success: $($result.success)" -ForegroundColor Green
    Write-Host "📧 Emails processed: $($result.emailsProcessed)" -ForegroundColor Cyan
    Write-Host "💳 Transactions created: $($result.transactionsCreated)" -ForegroundColor Green
    Write-Host "🔄 Duplicates skipped: $($result.duplicatesSkipped)" -ForegroundColor Yellow
    Write-Host "❌ Parse failures: $($result.parseFailures)" -ForegroundColor Red
    Write-Host "⚠️  Limit breach alerts: $($result.limitBreachAlerts)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($result.transactionsCreated -gt 0) {
        Write-Host "🎉 Successfully fetched $($result.transactionsCreated) transactions from January!" -ForegroundColor Green
        Write-Host "   Check your database or app to view them." -ForegroundColor Gray
    } elseif ($result.emailsProcessed -eq 0) {
        Write-Host "ℹ️  No bank transaction emails found in January 2026." -ForegroundColor Yellow
        Write-Host "   Supported banks: ICICI, HDFC, SBI, Axis" -ForegroundColor Gray
        Write-Host "   Make sure transaction alerts are sent to uprishabh29@gmail.com" -ForegroundColor Gray
    } elseif ($result.duplicatesSkipped -eq $result.emailsProcessed) {
        Write-Host "✅ All $($result.emailsProcessed) emails were already processed (no duplicates)." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Processed $($result.emailsProcessed) emails, created $($result.transactionsCreated) transactions." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "✨ Done! You can run this script again anytime to fetch new emails." -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   $($errorDetails.message)" -ForegroundColor Gray
        
        if ($errorDetails.error) {
            Write-Host "   Details: $($errorDetails.error)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    
    if ($_.Exception.Message -like "*not connected*" -or $_.Exception.Message -like "*No gmail token*") {
        Write-Host "💡 The OAuth callback might not have completed properly." -ForegroundColor Yellow
        Write-Host "   Try running this script again and make sure you:" -ForegroundColor Yellow
        Write-Host "   - Wait for the full redirect after granting permission" -ForegroundColor Yellow
        Write-Host "   - See a success message in the browser" -ForegroundColor Yellow
        Write-Host ""
    }
    
    exit 1
}
