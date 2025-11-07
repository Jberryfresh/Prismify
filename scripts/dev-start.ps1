#!/usr/bin/env pwsh
# Prismify Development Environment Startup Script
# Cross-platform script for Windows PowerShell, Linux, and macOS

Write-Host "🚀 Starting Prismify Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Check if docker/.env exists
if (-not (Test-Path "docker/.env")) {
    Write-Host "⚠️  docker/.env not found. Creating from docker/.env.example..." -ForegroundColor Yellow
    Copy-Item "docker/.env.example" "docker/.env"
    Write-Host "✅ Created docker/.env" -ForegroundColor Green
    Write-Host "⚠️  Please update docker/.env with secure passwords before deploying to production!" -ForegroundColor Yellow
    Write-Host ""
}

# Parse command line arguments
$startProfile = $args[0]

switch ($startProfile) {
    "admin" {
        Write-Host "Starting with admin tools (PgAdmin + Redis Commander)..." -ForegroundColor Cyan
        docker-compose --profile with-admin up -d
    }
    "storage" {
        Write-Host "Starting with storage (MinIO)..." -ForegroundColor Cyan
        docker-compose --profile with-storage up -d
    }
    "full" {
        Write-Host "Starting all services..." -ForegroundColor Cyan
        docker-compose --profile with-storage --profile with-admin up -d
    }
    default {
        Write-Host "Starting core services (PostgreSQL + Redis)..." -ForegroundColor Cyan
        docker-compose up -d
    }
}

Write-Host ""
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check service health
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✅ Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Access Services:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "   Redis: localhost:6379" -ForegroundColor White

if ($startProfile -eq "admin" -or $startProfile -eq "full") {
    Write-Host "   PgAdmin: http://localhost:5050" -ForegroundColor White
    Write-Host "   Redis Commander: http://localhost:8081" -ForegroundColor White
}

if ($startProfile -eq "storage" -or $startProfile -eq "full") {
    Write-Host "   MinIO Console: http://localhost:9001" -ForegroundColor White
    Write-Host "   MinIO API: localhost:9000" -ForegroundColor White
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run migrations: npm run migrate" -ForegroundColor White
Write-Host "   2. Verify database: npm run verify" -ForegroundColor White
Write-Host "   3. Start dev server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop: docker-compose down" -ForegroundColor Yellow
Write-Host "📋 View logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host ""
