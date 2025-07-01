#!/bin/bash
set -e

echo "🌱 This script will manually seed the database on the server"
echo "Make sure you're running this on the server where the application is deployed"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if the studio-app container is running
if ! docker ps | grep studio-app &> /dev/null; then
    echo "❌ The studio-app container is not running. Start it first with: cd ~/studio && docker compose up -d"
    exit 1
fi

echo "🚀 Running database seeding script inside Docker container..."
docker exec studio-app node -e "import('./scripts/seed-database.js').then(m => m.seedDatabase()).then(() => console.log('✅ Seeding completed successfully')).catch(err => { console.error('❌ Seeding failed:', err); process.exit(1); })" || docker exec studio-app node -e "import('./.next/server/scripts/seed-database.js').then(m => m.seedDatabase()).then(() => console.log('✅ Seeding completed successfully')).catch(err => { console.error('❌ Seeding failed:', err); process.exit(1); })"

echo "🎉 Database seeding completed. Please refresh your application to see if the issue is resolved."
