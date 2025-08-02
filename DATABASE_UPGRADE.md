# Database System Upgrade

## Overview
The Discord bot's data storage system has been upgraded with advanced features to prevent data loss during bot restarts, updates, or crashes.

## New Features

### 🔒 **Atomic Writes**
- All data writes use temporary files first, then atomic move operations
- Prevents partial writes that could corrupt data
- Data integrity verification after each write

### 💾 **Automatic Backups**
- Automatic backups every 5 minutes
- Keeps up to 10 most recent backups
- Backup files include timestamps for easy identification
- Automatic cleanup of old backups

### ⚡ **In-Memory Cache**
- Frequently accessed data is cached in memory
- Reduces disk I/O and improves performance
- Auto-save every 30 seconds to prevent data loss

### 🛡️ **Data Validation**
- Automatic validation of user data structure
- Fixes corrupted or missing data fields
- Ensures data consistency across all operations

### 🔄 **Graceful Shutdown**
- Automatic data saving when bot shuts down
- Handles SIGINT, SIGTERM, and uncaught exceptions
- Prevents data loss during unexpected shutdowns

### 🔧 **Recovery System**
- Automatic recovery from backups if main data is corrupted
- Migration script for existing data
- Verification tools to check data integrity

## File Structure

```
data/
├── users.json          # Main user data
├── emojis.json         # Emoji configuration
├── shop.json          # Shop items
├── backups/           # Automatic backups
│   ├── users_backup_2024-01-01T12-00-00-000Z.json
│   ├── emojis_backup_2024-01-01T12-00-00-000Z.json
│   └── shop_backup_2024-01-01T12-00-00-000Z.json
└── temp/              # Temporary files for atomic writes
    └── temp_*.json
```

## Configuration

The database system can be configured in `utils/database.js`:

```javascript
const DB_CONFIG = {
  backupInterval: 5 * 60 * 1000,    // 5 minutes
  maxBackups: 10,                    // Keep 10 backups
  autoSaveInterval: 30 * 1000,       // 30 seconds
  dataDir: './data',
  backupDir: './data/backups',
  tempDir: './data/temp'
};
```

## Migration

When the bot starts for the first time with the new system:

1. **Automatic Migration**: Existing data is automatically migrated
2. **Backup Creation**: Original data is backed up before migration
3. **Data Validation**: All data is validated and fixed if needed
4. **System Initialization**: New database system is initialized

## Manual Migration

To manually migrate data, run:

```bash
node utils/migrateData.js
```

This will:
- Create backups of all existing data
- Migrate and validate all data
- Create initial backups
- Verify the migration

## Monitoring

The system provides detailed logging:

- `[DB]` - Database operations
- `[BACKUP]` - Backup operations
- `[AUTO-SAVE]` - Auto-save operations
- `[MIGRATION]` - Migration operations
- `[VERIFICATION]` - Data verification

## Benefits

### ✅ **Data Safety**
- No data loss during bot restarts
- Automatic recovery from backups
- Atomic writes prevent corruption

### ✅ **Performance**
- In-memory caching improves speed
- Reduced disk I/O operations
- Efficient backup management

### ✅ **Reliability**
- Graceful shutdown handling
- Automatic error recovery
- Data validation and repair

### ✅ **Maintainability**
- Clear logging and monitoring
- Easy backup restoration
- Migration tools for updates

## Troubleshooting

### If data appears corrupted:
1. Check the `data/backups/` directory for recent backups
2. Restore from the most recent backup
3. Check logs for any error messages

### If migration fails:
1. Check file permissions
2. Ensure sufficient disk space
3. Verify JSON file integrity

### If auto-save isn't working:
1. Check the `data/temp/` directory for stuck files
2. Restart the bot to clear any locks
3. Verify the database configuration

## Backup Restoration

To restore from a backup:

1. Stop the bot
2. Copy the backup file to the main data directory
3. Rename it to the original filename (e.g., `users.json`)
4. Restart the bot

Example:
```bash
cp data/backups/users_backup_2024-01-01T12-00-00-000Z.json data/users.json
```

## Performance Impact

- **Memory Usage**: ~10-50MB additional (depending on user count)
- **Disk Usage**: ~2-5x original size (due to backups)
- **CPU Impact**: Minimal (background operations)
- **Response Time**: Improved (due to caching)

The new system provides enterprise-level data protection while maintaining excellent performance for the Discord bot. 