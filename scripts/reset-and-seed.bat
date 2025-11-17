@echo off
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║          OneLPM Database Reset ^& Seed                  ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo WARNING: This will DELETE ALL DATA in your database!
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo Aborted.
    exit /b 0
)

echo.
echo Step 1/3: Generating Prisma Client...
call npm run db:generate

echo.
echo Step 2/3: Running database seed...
call npm run db:seed

echo.
echo ✅ Database has been reset and seeded successfully!
echo.
echo 📊 Sample Data Created:
echo    • 2 Clients
echo    • 4 Users (Admin, Data Manager, 2 LPs)
echo    • 3 Funds with complete history
echo    • 6 Distributions across funds
echo    • 16 Fund Documents (no PDF links)
echo    • 4 Direct Investments
echo    • 5 Direct Investment Documents (no PDF links)
echo.
echo 🔐 Login Credentials:
echo    Admin:        admin@onelpm.com / password123
echo    Data Manager: datamanager@onelpm.com / password123
echo    LP 1:         lp@acmecapital.com / password123
echo    LP 2:         lp@globalinvest.com / password123
echo.
echo 🚀 You can now start your development server:
echo    npm run dev
echo.
pause

