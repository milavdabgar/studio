#!/bin/bash
set -e

echo "🌱 Running database seeding script inside Docker container..."
docker exec studio-app npm run seed:database
echo "✅ Database seeding completed"
