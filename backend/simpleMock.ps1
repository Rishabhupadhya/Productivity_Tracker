# Simple Mock Test - No OAuth Required!
# Run: .\simpleMock.ps1

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🧪 Test January Transactions with Mock Email Data     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Just need the user ID from MongoDB
$userId = Read-Host "Enter your MongoDB User ID (24 character hex, starts with 697ef...)"

if ($userId.Length -ne 24) {
    Write-Host ""
    Write-Host "❌ Invalid User ID format!" -ForegroundColor Red
    Write-Host "   Expected: 24 character hex string like '697ef0eec1913554255fba8f'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 To get your User ID, run this in MongoDB:" -ForegroundColor Yellow
    Write-Host "   use productivity_tracker" -ForegroundColor Gray
    Write-Host "   db.users.findOne({email: 'uprishabh29@gmail.com'})" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "🧪 Running test with mock January emails..." -ForegroundColor Yellow
Write-Host ""

Set-Location -Path "/Users/rishabhupadhyay/Downloads/Projects/Productivity_Tracker/backend"
npx ts-node src/modules/auth/finance/email/testMockEmails.ts $userId
