#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║          OneLPM Database Reset & Seed                  ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⚠️  WARNING: This will DELETE ALL DATA in your database!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${BLUE}Step 1/3:${NC} Generating Prisma Client..."
npm run db:generate

echo ""
echo -e "${BLUE}Step 2/3:${NC} Running database seed..."
npm run db:seed

echo ""
echo -e "${GREEN}✅ Database has been reset and seeded successfully!${NC}"
echo ""
echo -e "${GREEN}📊 Sample Data Created:${NC}"
echo "   • 2 Clients"
echo "   • 4 Users (Admin, Data Manager, 2 LPs)"
echo "   • 3 Funds with complete history"
echo "   • 6 Distributions across funds"
echo "   • 16 Fund Documents (no PDF links)"
echo "   • 4 Direct Investments"
echo "   • 5 Direct Investment Documents (no PDF links)"
echo ""
echo -e "${GREEN}🔐 Login Credentials:${NC}"
echo "   Admin:        admin@onelpm.com / password123"
echo "   Data Manager: datamanager@onelpm.com / password123"
echo "   LP 1:         lp@acmecapital.com / password123"
echo "   LP 2:         lp@globalinvest.com / password123"
echo ""
echo -e "${GREEN}🚀 You can now start your development server:${NC}"
echo "   npm run dev"
echo ""

