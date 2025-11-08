#!/usr/bin/env python3
"""
Food Opportunities Finder
Queries Claude API for food opportunities in a given city and populates the SQL database
"""

import json
import sys
import os
from typing import List, Dict, Optional
import re

# Import the database manager from the previous script
from database_manager import DatabaseManager

# For Claude API - we'll use the Anthropic SDK
try:
    from anthropic import Anthropic
except ImportError:
    print("Please install the Anthropic SDK: pip install anthropic")
    sys.exit(1)


class FoodOpportunitiesFinder:
    """Finds food opportunities in a city using Claude API and stores them in database"""
    
    def __init__(self, api_key: str = None):
        """
        Initialize the finder with API key and database connection
        
        Args:
            api_key: Anthropic API key (if None, will look for environment variable)
        """
        # Initialize Claude API client
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY") or "YOUR_API_KEY_HERE"
        
        if self.api_key == "YOUR_API_KEY_HERE":
            print("\n  WARNING: Please set your Anthropic API key!")
            print("   Either:")
            print("   1. Replace 'YOUR_API_KEY_HERE' in the code")
            print("   2. Set ANTHROPIC_API_KEY environment variable")
            print("   3. Pass it when creating FoodOpportunitiesFinder instance\n")
        
        self.client = Anthropic(api_key=self.api_key)
        
        # Initialize database manager
        self.db = DatabaseManager("my_records.db")
        self.db.create_database()
        
    def query_claude_for_food_opportunities(self, city: str, num_opportunities: int = 10) -> str:
        """
        Query Claude API for food opportunities in a given city
        
        Args:
            city: Name of the city to search for food opportunities
            num_opportunities: Number of opportunities to request
            
        Returns:
            Claude's response as a string
        """
        prompt = f"""Please Find {num_opportunities} opportunies in {city} for poor people who rely on SNAP benefits. 
        These should be food kitchens, food banks, drives, and anywhere were someone who can't afford food can go to get a meal or groceries.
        The goal is to help people in need find food resources in {city}.
        
        For each opportunity, please provide the information in this exact JSON format:
        {{
            "opportunities": [
                {{
                    "name": "Name of the place or event",
                    "link": "Website URL if available, otherwise empty string",
                    "location": "Specific address or area in {city}",
                    "description": "Brief description of what makes this place special, the type of cuisine, or experience offered"
                }}
            ]
        }}
        
        Please ensure your response is valid JSON that can be parsed directly. Include a mix of different 
        types of food experiences - from casual to fine dining, local specialties, markets, and unique culinary experiences.
        Focus on real, actual places and events in {city}."""
        
        try:
            message = self.client.messages.create(
                model="claude-opus-4-1-20250805",  # Using Claude Opus 4.1
                max_tokens=2000,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            return message.content[0].text
            
        except Exception as e:
            print(f"Error querying Claude API: {e}")
            return None
    
    def parse_opportunities_from_response(self, response: str) -> List[Dict]:
        """
        Parse the JSON response from Claude to extract food opportunities
        
        Args:
            response: Claude's response string
            
        Returns:
            List of dictionaries containing opportunity information
        """
        if not response:
            return []
        
        try:
            # Try to extract JSON from the response
            # Sometimes Claude might include explanation text around the JSON
            json_match = re.search(r'\{.*"opportunities".*\}', response, re.DOTALL)
            
            if json_match:
                json_str = json_match.group(0)
                data = json.loads(json_str)
                return data.get("opportunities", [])
            else:
                # Try to parse the entire response as JSON
                data = json.loads(response)
                return data.get("opportunities", [])
                
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            print("Attempting to extract information manually...")
            
            # Fallback: try to extract information manually if JSON parsing fails
            opportunities = []
            
            # This is a basic fallback parser - you might need to adjust based on actual responses
            lines = response.split('\n')
            current_opportunity = {}
            
            for line in lines:
                if '"name"' in line:
                    match = re.search(r'"name":\s*"([^"]+)"', line)
                    if match:
                        current_opportunity['name'] = match.group(1)
                elif '"link"' in line:
                    match = re.search(r'"link":\s*"([^"]*)"', line)
                    if match:
                        current_opportunity['link'] = match.group(1)
                elif '"location"' in line:
                    match = re.search(r'"location":\s*"([^"]+)"', line)
                    if match:
                        current_opportunity['location'] = match.group(1)
                elif '"description"' in line:
                    match = re.search(r'"description":\s*"([^"]+)"', line)
                    if match:
                        current_opportunity['description'] = match.group(1)
                        
                        # If we have all fields, add to opportunities
                        if all(key in current_opportunity for key in ['name', 'location', 'description']):
                            if 'link' not in current_opportunity:
                                current_opportunity['link'] = ""
                            opportunities.append(current_opportunity)
                            current_opportunity = {}
            
            return opportunities
    
    def save_opportunities_to_database(self, opportunities: List[Dict], city: str) -> int:
        """
        Save the parsed opportunities to the database
        
        Args:
            opportunities: List of opportunity dictionaries
            city: Name of the city (used as fallback location)
            
        Returns:
            Number of successfully saved records
        """
        saved_count = 0
        
        for opp in opportunities:
            try:
                # Extract fields with defaults
                name = opp.get('name', 'Unknown Food Opportunity')
                link = opp.get('link', '')
                location = opp.get('location', city)  # Use city as fallback location
                description = opp.get('description', 'No description available')
                
                # Add to database
                self.db.add_record(
                    name=name,
                    link=link,
                    location=location,
                    description=description
                )
                saved_count += 1
                print(f"✓ Added: {name}")
                
            except Exception as e:
                print(f"✗ Error saving '{opp.get('name', 'Unknown')}': {e}")
        
        return saved_count
    
    def find_and_save_food_opportunities(self, city: str, num_opportunities: int = 10) -> bool:
        """
        Main method to find and save food opportunities for a city
        
        Args:
            city: Name of the city to search
            num_opportunities: Number of opportunities to find
            
        Returns:
            True if successful, False otherwise
        """
        print(f"\n🔍 Searching for food opportunities in {city}...")
        print(f"   Requesting {num_opportunities} opportunities from Claude API...")
        
        # Query Claude API
        response = self.query_claude_for_food_opportunities(city, num_opportunities)
        
        if not response:
            print("❌ Failed to get response from Claude API")
            return False
        
        print("✓ Received response from Claude API")
        
        # Parse the response
        opportunities = self.parse_opportunities_from_response(response)
        
        if not opportunities:
            print("❌ No opportunities could be parsed from the response")
            return False
        
        print(f"✓ Parsed {len(opportunities)} food opportunities")
        
        # Save to database
        print("\n📝 Saving to database...")
        saved = self.save_opportunities_to_database(opportunities, city)
        
        print(f"\n✅ Successfully saved {saved} food opportunities to the database!")
        
        # Display the saved records
        print("\n📊 Recently added food opportunities:")
        search_results = self.db.search_records(city)
        self.db.display_records(search_results[-saved:] if len(search_results) > saved else search_results)
        
        return True


def main():
    """Main function to run the food opportunities finder"""
    
    # You can hardcode your API key here
    # IMPORTANT: Replace this with your actual Anthropic API key
    API_KEY = "SORRY_NOT_ALLOWED_TO_SHARE"  # <-- REPLACE THIS!
    
    # Or set it as an environment variable:
    # export ANTHROPIC_API_KEY="your-key-here"
    
    # Create finder instance
    finder = FoodOpportunitiesFinder(api_key=API_KEY)
    
    # Check if city was provided as command line argument
    if len(sys.argv) > 1:
        city = ' '.join(sys.argv[1:])
        print(f"Finding food opportunities in: {city}")
        finder.find_and_save_food_opportunities(city)
    else:
        # Interactive mode
        print("\n" + "="*60)
        print("🍴 FOOD OPPORTUNITIES FINDER 🍴")
        print("="*60)
        print("\nThis tool finds interesting food opportunities in any city")
        print("and saves them to your local database.")
        print("\nExamples: Pittsburgh, New York, Paris, Tokyo, etc.")
        
        while True:
            print("\n" + "-"*40)
            city = input("\nEnter a city name (or 'quit' to exit): ").strip()
            
            if city.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Goodbye!")
                break
            
            if not city:
                print("Please enter a valid city name!")
                continue
            
            # Ask for number of opportunities
            num_str = input(f"How many food opportunities to find? (default: 10): ").strip()
            
            try:
                num_opportunities = int(num_str) if num_str else 10
                if num_opportunities < 1 or num_opportunities > 50:
                    print("Number should be between 1 and 50. Using 10.")
                    num_opportunities = 10
            except ValueError:
                print("Invalid number. Using default of 10.")
                num_opportunities = 10
            
            # Find and save opportunities
            success = finder.find_and_save_food_opportunities(city, num_opportunities)
            
            if success:
                view_all = input("\nWould you like to view all records in the database? (y/n): ").strip()
                if view_all.lower() == 'y':
                    all_records = finder.db.get_all_records()
                    finder.db.display_records(all_records)
            
            another = input("\nSearch for another city? (y/n): ").strip()
            if another.lower() != 'y':
                print("\n👋 Thanks for using Food Opportunities Finder!")
                break


if __name__ == "__main__":
    main()