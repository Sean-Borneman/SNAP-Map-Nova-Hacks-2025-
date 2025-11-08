#!/usr/bin/env python3
"""
Database Utilities Script
Quick commands for managing the food opportunities database
"""

import sys
import os
from database_manager import DatabaseManager


def print_usage():
    """Print usage information"""
    print("""
Database Utilities - Quick Commands
====================================

Usage: python db_utils.py [command] [options]

Commands:
    stats           Show database statistics
    reset           Reset database (delete all records)
    backup          Create CSV backup of all records
    restore [file]  Restore records from CSV file
    clean           Remove duplicate records (by name)
    quick-reset     Reset without confirmation (use with caution!)
    
Examples:
    python db_utils.py stats
    python db_utils.py reset
    python db_utils.py backup
    python db_utils.py restore backup.csv
    python db_utils.py clean
    """)


def show_stats(db):
    """Display database statistics"""
    stats = db.get_database_stats()
    
    print("\n" + "="*50)
    print("DATABASE STATISTICS")
    print("="*50)
    print(f"\nTotal records: {stats['total_records']}")
    print(f"Records with links: {stats['records_with_links']}")
    print(f"Records without links: {stats['records_without_links']}")
    
    if stats['oldest_record']:
        print(f"\nDate range:")
        print(f"  Oldest: {stats['oldest_record']}")
        print(f"  Newest: {stats['newest_record']}")
    
    if stats['top_locations']:
        print("\nTop locations:")
        for location, count in stats['top_locations']:
            print(f"  • {location}: {count} records")
    
    print("="*50)


def reset_database(db, quick=False):
    """Reset the database"""
    if quick:
        # Quick reset without confirmation but with automatic backup
        stats = db.get_database_stats()
        if stats['total_records'] > 0:
            print(f"Creating automatic backup of {stats['total_records']} records...")
            backup_file = db.export_to_csv()
            if backup_file:
                print(f"✓ Backup saved to: {backup_file}")
        
        db.reset_database(confirm=True, backup=False)
    else:
        # Normal reset with confirmation prompts
        db.reset_database(confirm=False, backup=True)


def backup_database(db):
    """Create a backup of the database"""
    stats = db.get_database_stats()
    
    if stats['total_records'] == 0:
        print("No records to backup.")
        return
    
    print(f"Creating backup of {stats['total_records']} records...")
    backup_file = db.export_to_csv()
    
    if backup_file:
        print(f"\n✅ Backup complete!")
        print(f"   File: {backup_file}")
        print(f"   Records: {stats['total_records']}")
        
        # Get file size
        file_size = os.path.getsize(backup_file)
        if file_size < 1024:
            print(f"   Size: {file_size} bytes")
        elif file_size < 1024 * 1024:
            print(f"   Size: {file_size / 1024:.2f} KB")
        else:
            print(f"   Size: {file_size / (1024 * 1024):.2f} MB")


def restore_database(db, filename):
    """Restore database from a CSV file"""
    if not os.path.exists(filename):
        print(f"❌ Error: File '{filename}' not found!")
        return
    
    print(f"Restoring from: {filename}")
    
    # Check current state
    stats = db.get_database_stats()
    if stats['total_records'] > 0:
        choice = input(f"\n⚠️  Database currently has {stats['total_records']} records. Continue? (y/n): ")
        if choice.lower() != 'y':
            print("Restore cancelled.")
            return
    
    # Import the records
    imported = db.import_from_csv(filename)
    
    if imported > 0:
        print(f"\n✅ Restore complete!")
        print(f"   Imported: {imported} records")
        
        # Show new stats
        new_stats = db.get_database_stats()
        print(f"   Total now: {new_stats['total_records']} records")


def clean_duplicates(db):
    """Remove duplicate records based on name"""
    print("Checking for duplicate records...")
    
    db.connect()
    
    # Find duplicates
    db.cursor.execute('''
        SELECT name, COUNT(*) as count
        FROM records
        GROUP BY name
        HAVING count > 1
        ORDER BY count DESC
    ''')
    
    duplicates = db.cursor.fetchall()
    
    if not duplicates:
        print("✓ No duplicate records found!")
        db.disconnect()
        return
    
    print(f"\n Found {len(duplicates)} sets of duplicates:")
    total_duplicates = 0
    for name, count in duplicates[:10]:  # Show first 10
        print(f"  • '{name[:40]}...': {count} copies")
        total_duplicates += (count - 1)
    
    if len(duplicates) > 10:
        print(f"  ... and {len(duplicates) - 10} more")
    
    print(f"\nTotal duplicate records that would be removed: {total_duplicates}")
    
    choice = input("\nRemove duplicates (keeping the newest of each)? (y/n): ")
    
    if choice.lower() != 'y':
        print("Cleanup cancelled.")
        db.disconnect()
        return
    
    # Remove duplicates, keeping the newest (highest ID)
    removed = 0
    for name, _ in duplicates:
        db.cursor.execute('''
            DELETE FROM records 
            WHERE name = ? 
            AND id NOT IN (
                SELECT MAX(id) 
                FROM records 
                WHERE name = ?
            )
        ''', (name, name))
        removed += db.cursor.rowcount
    
    db.connection.commit()
    db.disconnect()
    
    print(f"✓ Removed {removed} duplicate records!")


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print_usage()
        return
    
    command = sys.argv[1].lower()
    db = DatabaseManager("my_records.db")
    
    if command == "stats":
        show_stats(db)
    
    elif command == "reset":
        reset_database(db, quick=False)
    
    elif command == "quick-reset":
        print("⚠️  Quick reset - creating automatic backup...")
        reset_database(db, quick=True)
    
    elif command == "backup":
        backup_database(db)
    
    elif command == "restore":
        if len(sys.argv) < 3:
            print("❌ Error: Please specify the CSV file to restore from")
            print("   Usage: python db_utils.py restore [filename.csv]")
        else:
            restore_database(db, sys.argv[2])
    
    elif command == "clean":
        clean_duplicates(db)
    
    else:
        print(f"❌ Unknown command: {command}")
        print_usage()


if __name__ == "__main__":
    main()