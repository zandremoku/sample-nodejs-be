# Database Migration Guide

## Overview
The `migrate.js` script is used to safely apply database schema changes to your production database before deploying to Vercel.

## Why Do We Need This?

In production (Vercel), the automatic schema synchronization (`alter: true`) is disabled during cold starts to prevent timeout errors. This means:
- ✅ Models sync works normally (`alter: false`)
- ❌ Schema changes won't be applied automatically

**Solution**: Run migrations locally before deploying!

## When to Run Migrations

Run `npm run migrate:prod` **before deploying to Vercel** if you've made any of these changes:
- ✏️ Added new fields to a model
- ✏️ Modified field types
- ✏️ Added new relationships
- ✏️ Changed field constraints (NOT NULL, UNIQUE, etc.)
- ✏️ Created new models

## How to Use

### Step 1: Make Your Code Changes
```bash
cd /Users/andreazorzi/tests/sample-nodejs-be
# Edit your models in api/model/*.js
```

### Step 2: Run Local Migration
```bash
npm run migrate:prod
```

**Expected Output:**
```
🔄 Starting database migration...
📍 Environment: production
🗄️  Database: your_db_name

🔐 Authenticating database connection...
✅ Connection established successfully.

🔨 Syncing models and applying schema changes...
✅ All models synchronized successfully!

📊 Models synced (2):
   ✓ User
   ✓ TravelExperience

✨ Migration completed successfully!
You can now safely deploy to Vercel.

🔌 Database connection closed.
```

### Step 3: Commit & Deploy
```bash
git add .
git commit -m "Database schema updates"
git push
# Vercel will auto-deploy
```

## Example: Adding a New Field

### 1. Update Model
```javascript
// api/model/TravelExperience.js
const newField = {
  favoriteDestination: {
    type: DataTypes.STRING,
    allowNull: true,
  }
};
```

### 2. Run Migration
```bash
npm run migrate:prod
```

### 3. Deploy
```bash
git push
```

## Troubleshooting

### Connection Failed
**Error**: `Unable to connect to the database`

**Solution**: 
- Verify `DATABASE_URL` is set in your `.env` file
- Check your database is accessible from your network

### Query Timeout
**Error**: `Query read timeout`

**Solution**:
- Check your database for locks with long-running queries
- Try again in a few moments
- Contact your database provider if persists

### Model Sync Failed
**Error**: `Error synchronizing models`

**Solution**:
- Review the SQL error in the log
- Check for conflicting field definitions
- Ensure all required fields have proper types

## Advanced: Vercel Deployment

### Option 1: Manual Pre-Deployment (Recommended)
```bash
# Before git push
npm run migrate:prod
git push
```

### Option 2: Automated (Uses buildCommand)
Add to `vercel.json`:
```json
{
  "buildCommand": "npm run migrate:prod && npm install"
}
```

⚠️ **Note**: This might fail if your query times out. Manual migration is safer.

## Tips

- 💡 Always test schema changes locally first
- 💾 Keep backup of production database before major changes
- 📋 Document complex migrations in git commits
- 🔒 Never modify production data during migrations
- ⏱️ Run migrations during low-traffic periods for safety

## Questions?

Check the logs in [api/helpers/dbConnection.js](api/helpers/dbConnection.js) for detailed connection configuration.
