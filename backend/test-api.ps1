# Test Registration
Write-Host "Testing User Registration..." -ForegroundColor Green
$registerBody = @{
    name = "John Doe"
    email = "john@example.com"
    password = "mypassword123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Registration Successful!" -ForegroundColor Green
    Write-Host "Token: $($registerResponse.token)" -ForegroundColor Yellow
} catch {
    Write-Host "Registration failed: $_" -ForegroundColor Red
}

# Test Login
Write-Host "`nTesting User Login..." -ForegroundColor Green
$loginBody = @{
    email = "john@example.com"
    password = "mypassword123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "Login Successful!" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.token)" -ForegroundColor Yellow
} catch {
    Write-Host "Login failed: $_" -ForegroundColor Red
}
