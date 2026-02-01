# All-in-One: Get User ID and Test Mock Transactions
# Run: .\allInOne.ps1

$Email = "uprishabh29@gmail.com"
$Password = "December@29"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 Complete Test: Mock January Transactions (No OAuth)  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

try {
    # Get User ID from MongoDB
    Write-Host "📊 Fetching User ID from MongoDB..." -ForegroundColor Yellow
    
    $mongoCommand = "db.users.findOne({email: '$Email'}, {_id: 1})"
    $mongoResult = mongosh productivity_tracker --quiet --eval $mongoCommand 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "MongoDB query failed. Make sure MongoDB is running."
    }
    
    # Extract ObjectId from result
    $userId = if ($mongoResult -match "ObjectId\('([a-f0-9]{24})'\)") {
        $matches[1]
    } else {
        throw "Could not find user in database"
    }
    
    Write-Host "✅ Found user!" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Gray
    Write-Host ""
    
    # Check for credit cards
    Write-Host "📇 Checking credit cards..." -ForegroundColor Yellow
    
    $cardsCommand = "db.creditcards.find({userId: ObjectId('$userId')}).toArray()"
    $cardsResult = mongosh productivity_tracker --quiet --eval $cardsCommand 2>&1
    
    if ($cardsResult -match "cardName") {
        Write-Host "✅ Credit cards found!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No credit cards found!" -ForegroundColor Yellow
        Write-Host "   Mock data includes transactions for cards ending:" -ForegroundColor Gray
        Write-Host "   - 1234 (ICICI)" -ForegroundColor Gray
        Write-Host "   - 5678 (HDFC)" -ForegroundColor Gray
        Write-Host "   - 3456 (SBI)" -ForegroundColor Gray
        Write-Host "   - 2345 (Axis)" -ForegroundColor Gray
        Write-Host ""
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne 'y') {
            exit 0
        }
    }
    
    Write-Host ""
    Write-Host "🧪 Processing mock January emails..." -ForegroundColor Yellow
    Write-Host ""
    
    # Run the test
    Set-Location -Path "/Users/rishabhupadhyay/Downloads/Projects/Productivity_Tracker/backend"
    npx ts-node src/modules/auth/finance/email/testMockEmails.ts $userId
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -like "*mongosh*" -or $_.Exception.Message -like "*MongoDB*") {
        Write-Host "💡 Make sure MongoDB is running and mongosh is installed:" -ForegroundColor Yellow
        Write-Host "   brew install mongosh  # or download from mongodb.com" -ForegroundColor Gray
    }
    
    Write-Host ""
    exit 1
}
