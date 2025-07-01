#!/bin/bash
set -e

echo "🌱 Running database seeding script inside Docker container..."
docker exec studio-app node -e "import('./scripts/seed-database.js').then(m => m.seedDatabase()).then(() => console.log('Seeding completed successfully')).catch(err => { console.error('Seeding failed:', err); process.exit(1); })" || docker exec studio-app node -e "import('./.next/server/scripts/seed-database.js').then(m => m.seedDatabase()).then(() => console.log('Seeding completed successfully')).catch(err => { console.error('Seeding failed:', err); process.exit(1); })"
echo "✅ Database seeding completed"
