# PowerShell script to fetch January transactions
# Run: .\fetchJanuary.ps1 -Email "your@email.com" -Password "yourpassword"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$BASE_URL = "http://localhost:5001/api"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   📧 Fetch January Credit Card Transactions from Emails   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

try {
    # Step 1: Login
    Write-Host "🔐 Step 1: Logging in..." -ForegroundColor Yellow
    
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    $token = $loginResponse.token
    $userId = $loginResponse.user.id
    
    Write-Host "✅ Logged in successfully!" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Gray
    Write-Host ""
    
    # Step 2: Check Gmail connection
    Write-Host "📧 Step 2: Checking Gmail connection..." -ForegroundColor Yellow
    
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    try {
        $authResponse = Invoke-RestMethod -Uri "$BASE_URL/finance/email/oauth/gmail/authorize" -Method Get -Headers $headers -ErrorAction Stop
        
        if ($authResponse.authUrl) {
            Write-Host ""
            Write-Host "⚠️  Gmail not connected yet!" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "🔗 Please open this URL in your browser to authorize:" -ForegroundColor Cyan
            Write-Host ""
            Write-Host $authResponse.authUrl -ForegroundColor White
            Write-Host ""
            Write-Host "📌 Instructions:" -ForegroundColor Cyan
            Write-Host "   1. Copy the URL above" -ForegroundColor Gray
            Write-Host "   2. Open it in your browser" -ForegroundColor Gray
            Write-Host "   3. Login with your Gmail account" -ForegroundColor Gray
            Write-Host "   4. Grant read-only permission" -ForegroundColor Gray
            Write-Host "   5. You'll be redirected back (token saved automatically)" -ForegroundColor Gray
            Write-Host ""
            Write-Host "⏳ After authorizing, run this script again!" -ForegroundColor Yellow
            Write-Host ""
            return
        }
    } catch {
        Write-Host "❌ Error checking Gmail connection: $_" -ForegroundColor Red
        Write-Host "   Token might be stored already, continuing..." -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Host "✅ Gmail connected!" -ForegroundColor Green
    Write-Host ""
    
    # Step 3: Fetch January emails
    Write-Host "📅 Step 3: Fetching January 2026 emails..." -ForegroundColor Yellow
    Write-Host "   Processing 31 days of emails..." -ForegroundColor Gray
    Write-Host ""
    
    $processBody = @{
        provider = "gmail"
        daysBack = 31
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$BASE_URL/finance/email/process" -Method Post -Headers $headers -Body $processBody -ContentType "application/json" -ErrorAction Stop
    
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
    
    if ($result.transactionsCreated -gt 0) {
        Write-Host ""
        Write-Host "🎉 Successfully fetched January transactions!" -ForegroundColor Green
        Write-Host "   Check your transactions in the app or database." -ForegroundColor Gray
    } elseif ($result.emailsProcessed -eq 0) {
        Write-Host ""
        Write-Host "⚠️  No bank transaction emails found in January." -ForegroundColor Yellow
        Write-Host "   Make sure your bank sends alerts to this Gmail account." -ForegroundColor Gray
    } elseif ($result.duplicatesSkipped -eq $result.emailsProcessed) {
        Write-Host ""
        Write-Host "✅ All emails already processed (no duplicates)." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Some emails could not be parsed." -ForegroundColor Yellow
        Write-Host "   Check server logs for details." -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "✨ Done!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    
    Write-Host ""
    exit 1
}
