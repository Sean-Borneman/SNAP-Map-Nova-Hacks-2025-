#!/usr/bin/env python3
"""
SQLite Database Manager
Creates and manages a database with records containing: Name, Link, Location, Description
"""

import sqlite3
import os
from datetime import datetime
from typing import List, Tuple, Optional


class DatabaseManager:
    """Manages SQLite database operations for storing records with Name, Link, Location, Description"""
    
    def __init__(self, db_path: str = "my_records.db"):
        """
        Initialize the database manager
        
        Args:
            db_path: Path to the SQLite database file
        """
        self.db_path = db_path
        self.connection = None
        self.cursor = None
        
    def connect(self):
        """Establish connection to the database"""
        
        self.connection = sqlite3.connect(self.db_path)
        self.cursor = self.connection.cursor()
        
    def disconnect(self):
        """Close the database connection"""
        if self.connection:
            self.connection.close()
            
    def create_database(self):
        """Create the database table if it doesn't exist"""
        self.connect()
        
        # Create the main table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                link TEXT,
                location TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create an index on name for faster searches
        self.cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_name ON records(name)
        ''')
        
        self.connection.commit()
        print(f"Database '{self.db_path}' initialized successfully!")
        self.disconnect()
        
    def add_record(self, name: str, link: str = "", location: str = "", description: str = "") -> int:
        """
        Add a new record to the database
        
        Args:
            name: Name of the record (required)
            link: URL or link associated with the record
            location: Physical or virtual location
            description: Description of the record
            
        Returns:
            The ID of the inserted record
        """
        self.connect()
        
        self.cursor.execute('''
            INSERT INTO records (name, link, location, description)
            VALUES (?, ?, ?, ?)
        ''', (name, link, location, description))
        
        record_id = self.cursor.lastrowid
        self.connection.commit()
        self.disconnect()
        
        print(f"Record '{name}' added successfully with ID: {record_id}")
        return record_id
        
    def get_all_records(self) -> List[Tuple]:
        """
        Retrieve all records from the database
        
        Returns:
            List of tuples containing all records
        """
        self.connect()
        
        self.cursor.execute('''
            SELECT id, name, link, location, description, created_at, updated_at
            FROM records
            ORDER BY created_at DESC
        ''')
        
        records = self.cursor.fetchall()
        self.disconnect()
        
        return records
        
    def get_record_by_id(self, record_id: int) -> Optional[Tuple]:
        """
        Get a specific record by its ID
        
        Args:
            record_id: The ID of the record to retrieve
            
        Returns:
            Tuple containing the record data, or None if not found
        """
        self.connect()
        
        self.cursor.execute('''
            SELECT id, name, link, location, description, created_at, updated_at
            FROM records
            WHERE id = ?
        ''', (record_id,))
        
        record = self.cursor.fetchone()
        self.disconnect()
        
        return record
        
    def search_records(self, search_term: str) -> List[Tuple]:
        """
        Search for records by name or description
        
        Args:
            search_term: Term to search for
            
        Returns:
            List of matching records
        """
        self.connect()
        
        search_pattern = f"%{search_term}%"
        self.cursor.execute('''
            SELECT id, name, link, location, description, created_at, updated_at
            FROM records
            WHERE name LIKE ? OR description LIKE ? OR location LIKE ?
            ORDER BY name
        ''', (search_pattern, search_pattern, search_pattern))
        
        records = self.cursor.fetchall()
        self.disconnect()
        
        return records
        
    def update_record(self, record_id: int, name: str = None, link: str = None, 
                     location: str = None, description: str = None) -> bool:
        """
        Update an existing record
        
        Args:
            record_id: ID of the record to update
            name: New name (optional)
            link: New link (optional)
            location: New location (optional)
            description: New description (optional)
            
        Returns:
            True if update was successful, False otherwise
        """
        self.connect()
        
        # Build dynamic update query based on provided fields
        update_fields = []
        update_values = []
        
        if name is not None:
            update_fields.append("name = ?")
            update_values.append(name)
        if link is not None:
            update_fields.append("link = ?")
            update_values.append(link)
        if location is not None:
            update_fields.append("location = ?")
            update_values.append(location)
        if description is not None:
            update_fields.append("description = ?")
            update_values.append(description)
            
        if not update_fields:
            print("No fields to update")
            return False
            
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        update_values.append(record_id)
        
        query = f"UPDATE records SET {', '.join(update_fields)} WHERE id = ?"
        self.cursor.execute(query, update_values)
        
        rows_affected = self.cursor.rowcount
        self.connection.commit()
        self.disconnect()
        
        if rows_affected > 0:
            print(f"Record ID {record_id} updated successfully")
            return True
        else:
            print(f"No record found with ID {record_id}")
            return False
            
    def delete_record(self, record_id: int) -> bool:
        """
        Delete a record from the database
        
        Args:
            record_id: ID of the record to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        self.connect()
        
        self.cursor.execute('DELETE FROM records WHERE id = ?', (record_id,))
        
        rows_affected = self.cursor.rowcount
        self.connection.commit()
        self.disconnect()
        
        if rows_affected > 0:
            print(f"Record ID {record_id} deleted successfully")
            return True
        else:
            print(f"No record found with ID {record_id}")
            return False
            
    def display_records(self, records: List[Tuple]):
        """
        Display records in a formatted table
        
        Args:
            records: List of record tuples to display
        """
        if not records:
            print("No records found.")
            return
            
        print("\n" + "="*100)
        print(f"{'ID':<5} {'Name':<20} {'Link':<30} {'Location':<20} {'Description':<25}")
        print("-"*100)
        
        for record in records:
            id_, name, link, location, desc, created, updated = record
            # Truncate long strings for display
            name = (name[:17] + '...') if len(name) > 20 else name
            link = (link[:27] + '...') if len(link) > 30 else link
            location = (location[:17] + '...') if len(location) > 20 else location
            desc = (desc[:22] + '...') if len(desc) > 25 else desc
            
            print(f"{id_:<5} {name:<20} {link:<30} {location:<20} {desc:<25}")
        print("="*100 + "\n")
    
    def export_to_csv(self, filename: str = None) -> str:
        """
        Export all records to a CSV file
        
        Args:
            filename: Name of the CSV file (if None, auto-generates with timestamp)
            
        Returns:
            Path to the exported CSV file
        """
        import csv
        from datetime import datetime
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"database_backup_{timestamp}.csv"
        
        records = self.get_all_records()
        
        if not records:
            print("No records to export.")
            return None
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Write header
                writer.writerow(['ID', 'Name', 'Link', 'Location', 'Description', 'Created At', 'Updated At'])
                
                # Write records
                for record in records:
                    writer.writerow(record)
            
            print(f" Exported {len(records)} records to {filename}")
            return filename
            
        except Exception as e:
            print(f" Error exporting to CSV: {e}")
            return None
    
    def import_from_csv(self, filename: str) -> int:
        """
        Import records from a CSV file
        
        Args:
            filename: Path to the CSV file to import
            
        Returns:
            Number of records imported
        """
        import csv
        
        try:
            imported_count = 0
            
            with open(filename, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for row in reader:
                    # Skip the ID and timestamps, add only the core data
                    self.add_record(
                        name=row.get('Name', ''),
                        link=row.get('Link', ''),
                        location=row.get('Location', ''),
                        description=row.get('Description', '')
                    )
                    imported_count += 1
            
            print(f"✓ Imported {imported_count} records from {filename}")
            return imported_count
            
        except FileNotFoundError:
            print(f"❌ File not found: {filename}")
            return 0
        except Exception as e:
            print(f"❌ Error importing from CSV: {e}")
            return 0
    
    def reset_database(self, confirm: bool = False, backup: bool = True) -> bool:
        """
        Reset the database by deleting all records
        
        Args:
            confirm: If True, skips the confirmation prompt (useful for scripts)
            backup: If True, creates a backup before resetting
            
        Returns:
            True if reset was successful, False if cancelled or failed
        """
        if not confirm:
            # Get record count first
            self.connect()
            self.cursor.execute('SELECT COUNT(*) FROM records')
            count = self.cursor.fetchone()[0]
            self.disconnect()
            
            if count == 0:
                print("Database is already empty.")
                return True
            
            print(f"\n  WARNING: This will permanently delete ALL {count} records from the database!")
            print("This action cannot be undone.")
            
            if backup and count > 0:
                backup_choice = input("\nWould you like to create a backup first? (y/n): ").strip()
                if backup_choice.lower() == 'y':
                    backup_file = self.export_to_csv()
                    if backup_file:
                        print(f"Backup saved to: {backup_file}")
            
            confirmation = input(f"\nType 'RESET' to confirm deletion of all records: ").strip()
            
            if confirmation != 'RESET':
                print("Reset cancelled.")
                return False
        
        try:
            self.connect()
            
            # Delete all records
            self.cursor.execute('DELETE FROM records')
            
            # Reset the auto-increment counter
            self.cursor.execute('DELETE FROM sqlite_sequence WHERE name="records"')
            
            # Vacuum the database to reclaim space
            self.cursor.execute('VACUUM')
            
            self.connection.commit()
            self.disconnect()
            
            print(" Database reset successfully. All records have been deleted.")
            return True
            
        except Exception as e:
            print(f" Error resetting database: {e}")
            if self.connection:
                self.connection.rollback()
                self.disconnect()
            return False
    
    def get_database_stats(self) -> dict:
        """
        Get statistics about the database
        
        Returns:
            Dictionary containing database statistics
        """
        self.connect()
        
        # Total records
        self.cursor.execute('SELECT COUNT(*) FROM records')
        total_records = self.cursor.fetchone()[0]
        
        # Records by location (top 5)
        self.cursor.execute('''
            SELECT location, COUNT(*) as count 
            FROM records 
            GROUP BY location 
            ORDER BY count DESC 
            LIMIT 5
        ''')
        top_locations = self.cursor.fetchall()
        
        # Records with links vs without
        self.cursor.execute('SELECT COUNT(*) FROM records WHERE link != ""')
        with_links = self.cursor.fetchone()[0]
        
        # Get date range
        self.cursor.execute('''
            SELECT MIN(created_at), MAX(created_at) 
            FROM records
        ''')
        date_range = self.cursor.fetchone()
        
        self.disconnect()
        
        return {
            'total_records': total_records,
            'top_locations': top_locations,
            'records_with_links': with_links,
            'records_without_links': total_records - with_links,
            'oldest_record': date_range[0] if date_range[0] else None,
            'newest_record': date_range[1] if date_range[1] else None
        }


def main():
    """Main function demonstrating database usage"""
    
    # Create database manager instance
    db = DatabaseManager("my_records.db")
    
    # Create the database
    db.create_database()
    
    # Add some sample records
    # print("\n--- Adding Sample Records ---")
    # db.add_record(
    #     name="Python Documentation",
    #     link="https://docs.python.org/",
    #     location="Online",
    #     description="Official Python documentation and tutorials"
    # )
    
    # db.add_record(
    #     name="SQLite Tutorial",
    #     link="https://www.sqlite.org/docs.html",
    #     location="Web Resource",
    #     description="Comprehensive SQLite database documentation"
    # )
    
    # db.add_record(
    #     name="Local Project",
    #     link="file:///home/user/projects/myapp",
    #     location="Local Machine",
    #     description="Personal application development project"
    # )
    
    db.add_record(
        name="Team Meeting Notes",
        link="https://docs.google.com/meeting-notes",
        location="Conference Room A",
        description="Weekly team sync meeting documentation"
    )
    
    # Display all records
    print("\n--- All Records ---")
    all_records = db.get_all_records()
    db.display_records(all_records)
    
    # Search for records
    print("\n--- Search Results for 'Python' ---")
    search_results = db.search_records("Python")
    db.display_records(search_results)
    
    # Update a record
    print("\n--- Updating Record ---")
    db.update_record(1, description="Updated: Complete Python language reference and guides")
    
    # Get specific record
    print("\n--- Getting Record ID 1 ---")
    record = db.get_record_by_id(1)
    if record:
        db.display_records([record])
    
    # Interactive menu
    print("\n--- Interactive Menu ---")
    while True:
        print("\nDatabase Operations:")
        print("1. Add new record")
        print("2. View all records")
        print("3. Search records")
        print("4. Update record")
        print("5. Delete record")
        print("6. Database statistics")
        print("7. Export to CSV")
        print("8. Import from CSV")
        print("9. Reset database (delete all records)")
        print("10. Exit")
        
        choice = input("\nEnter your choice (1-10): ").strip()
        
        if choice == "1":
            name = input("Enter name (required): ").strip()
            if not name:
                print("Name is required!")
                continue
            link = input("Enter link (optional): ").strip()
            location = input("Enter location (optional): ").strip()
            description = input("Enter description (optional): ").strip()
            db.add_record(name, link, location, description)
            
        elif choice == "2":
            records = db.get_all_records()
            db.display_records(records)
            
        elif choice == "3":
            search_term = input("Enter search term: ").strip()
            if search_term:
                results = db.search_records(search_term)
                db.display_records(results)
                
        elif choice == "4":
            try:
                record_id = int(input("Enter record ID to update: "))
                print("Leave fields empty to keep current values")
                name = input("New name: ").strip() or None
                link = input("New link: ").strip() or None
                location = input("New location: ").strip() or None
                description = input("New description: ").strip() or None
                db.update_record(record_id, name, link, location, description)
            except ValueError:
                print("Invalid ID!")
                
        elif choice == "5":
            try:
                record_id = int(input("Enter record ID to delete: "))
                confirm = input(f"Are you sure you want to delete record {record_id}? (y/n): ")
                if confirm.lower() == 'y':
                    db.delete_record(record_id)
            except ValueError:
                print("Invalid ID!")
                
        elif choice == "6":
            stats = db.get_database_stats()
            print("\n--- Database Statistics ---")
            print(f"Total records: {stats['total_records']}")
            print(f"Records with links: {stats['records_with_links']}")
            print(f"Records without links: {stats['records_without_links']}")
            
            if stats['oldest_record']:
                print(f"Date range: {stats['oldest_record']} to {stats['newest_record']}")
            
            if stats['top_locations']:
                print("\nTop locations:")
                for location, count in stats['top_locations']:
                    print(f"  • {location}: {count} records")
            print("-" * 40)
        
        elif choice == "7":
            filename = input("Enter filename for CSV export (or press Enter for auto-name): ").strip()
            filename = filename if filename else None
            db.export_to_csv(filename)
        
        elif choice == "8":
            filename = input("Enter CSV filename to import: ").strip()
            if filename:
                db.import_from_csv(filename)
            else:
                print("Filename required for import!")
                
        elif choice == "9":
            db.reset_database(confirm=False)  # Will ask for confirmation and offer backup
            
        elif choice == "10":
            print("Exiting...")
            break
            
        else:
            print("Invalid choice! Please try again.")


if __name__ == "__main__":
    main()