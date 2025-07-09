const fs = require('fs');
const path = require('path');

// Path to the routes directory
const routesDir = path.join(__dirname, '..', 'app', 'api');

// Function to update route handler files
async function updateRouteHandlers(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      await updateRouteHandlers(fullPath);
    } else if (file.name === 'route.ts' || file.name === 'route.js') {
      await updateRouteFile(fullPath);
    }
  }
}

// Function to update a single route file
async function updateRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Check if it's a route handler file
  const hasRouteHandler = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(/i.test(content) ||
    /export\s+const\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*=/i.test(content);

  if (!hasRouteHandler) {
    return;
  }

  // Add import for NextRequest and NextResponse if not present
  if (!content.includes("from 'next/server'")) {
    content = content.replace(
      /^(import\s+.*?['"]\s*;?\s*\n)/m,
      `$1import { NextRequest, NextResponse } from 'next/server';\n`
    );
    updated = true;
  }

  // Add proper type imports if not present
  if (!content.includes("from '@/types/routes'")) {
    content = content.replace(
      /^(import\s+.*?['"]\s*;?\s*\n)/m,
      `$1import type { RouteHandler } from '@/types/routes';\n`
    );
    updated = true;
  }

  // Update the route handler function
  content = content.replace(
    /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(\s*req\s*:\s*NextRequest\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{[^}]*\}\s*\}\s*\)/g,
    'export const $2: RouteHandler = async (req, { params })'
  );

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// Run the updater
updateRouteHandlers(routesDir)
  .then(() => console.log('Route handlers updated successfully!'))
  .catch(console.error);
