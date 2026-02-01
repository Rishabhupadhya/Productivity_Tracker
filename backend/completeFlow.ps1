# Complete PowerShell script - OAuth and Fetch January
# Run: .\completeFlow.ps1

$Email = "uprishabh29@gmail.com"
$Password = "December@29"
$BASE_URL = "http://localhost:5001/api"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    🚀 Complete OAuth Flow & Fetch January Transactions    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

try {
    # Login
    Write-Host "🔐 Logging in..." -ForegroundColor Yellow
    
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    $token = $loginResponse.token
    Write-Host "✅ Logged in successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Check if Gmail already connected
    Write-Host "📧 Checking Gmail authorization status..." -ForegroundColor Yellow
    
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    # Try to process emails directly first
    Write-Host "   Attempting to process emails..." -ForegroundColor Gray
    
    try {
        $processBody = @{
            provider = "gmail"
            daysBack = 31
        } | ConvertTo-Json
        
        $result = Invoke-RestMethod -Uri "$BASE_URL/finance/email/process" -Method Post -Headers $headers -Body $processBody -ContentType "application/json" -ErrorAction Stop
        
        # Success! Display results
        Write-Host "✅ Gmail already authorized!" -ForegroundColor Green
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
        } elseif ($result.emailsProcessed -eq 0) {
            Write-Host ""
            Write-Host "⚠️  No bank transaction emails found in January." -ForegroundColor Yellow
            Write-Host "   Supported banks: ICICI, HDFC, SBI, Axis" -ForegroundColor Gray
        } elseif ($result.duplicatesSkipped -eq $result.emailsProcessed) {
            Write-Host ""
            Write-Host "✅ All emails already processed!" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "✨ Done!" -ForegroundColor Green
        Write-Host ""
        return
        
    } catch {
        # Need OAuth authorization
        $errorMsg = $_.ErrorDetails.Message
        
        if ($errorMsg -like "*No gmail token*" -or $errorMsg -like "*not connected*" -or $errorMsg -like "*token*") {
            Write-Host "⚠️  Gmail not authorized yet" -ForegroundColor Yellow
            Write-Host ""
            
            # Get OAuth URL
            $authResponse = Invoke-RestMethod -Uri "$BASE_URL/finance/email/oauth/gmail/authorize" -Method Get -Headers $headers -ErrorAction Stop
            
            Write-Host "🔗 Step 1: Authorize Gmail" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Copy and open this URL in your browser:" -ForegroundColor White
            Write-Host ""
            Write-Host $authResponse.authUrl -ForegroundColor Yellow
            Write-Host ""
            Write-Host "📌 What will happen:" -ForegroundColor Cyan
            Write-Host "   1. You'll be asked to login to your Gmail account" -ForegroundColor Gray
            Write-Host "   2. Grant read-only access to emails" -ForegroundColor Gray
            Write-Host "   3. You'll be redirected to: http://localhost:5001/..." -ForegroundColor Gray
            Write-Host "   4. The page should show 'Connected' or redirect to frontend" -ForegroundColor Gray
            Write-Host ""
            Write-Host "⏳ After you see the success page, press Enter to continue..." -ForegroundColor Yellow
            Read-Host
            
            Write-Host ""
            Write-Host "📅 Now fetching January emails..." -ForegroundColor Yellow
            Write-Host ""
            
            # Try processing again
            $result = Invoke-RestMethod -Uri "$BASE_URL/finance/email/process" -Method Post -Headers $headers -Body $processBody -ContentType "application/json" -ErrorAction Stop
            
            # Display results
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
            } elseif ($result.emailsProcessed -eq 0) {
                Write-Host ""
                Write-Host "⚠️  No bank transaction emails found." -ForegroundColor Yellow
            }
            
            Write-Host ""
            Write-Host "✨ Done!" -ForegroundColor Green
            Write-Host ""
            
        } else {
            throw
        }
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    
    Write-Host ""
    exit 1
}
