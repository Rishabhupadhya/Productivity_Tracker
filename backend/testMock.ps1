# Test with Mock Data - No OAuth Needed!
# Run: .\testMock.ps1

$Email = "uprishabh29@gmail.com"
$Password = "December@29"
$BASE_URL = "http://localhost:5001/api"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🧪 Test January Transactions with Mock Email Data     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

try {
    # Login to get user ID
    Write-Host "🔐 Logging in..." -ForegroundColor Yellow
    
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    # Decode JWT to get user ID
    $tokenParts = $loginResponse.token.Split('.')
    $payload = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($tokenParts[1] + "=="))
    $userId = ($payload | ConvertFrom-Json).id
    
    Write-Host "✅ Logged in!" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Gray
    Write-Host ""
    
    # Run mock test
    Write-Host "🧪 Running test with mock January email data..." -ForegroundColor Yellow
    Write-Host ""
    
    Set-Location -Path "/Users/rishabhupadhyay/Downloads/Projects/Productivity_Tracker/backend"
    npx ts-node src/modules/auth/finance/email/testMockEmails.ts $userId
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    
    Write-Host ""
    exit 1
}
