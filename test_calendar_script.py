#!/usr/bin/env python3
"""
Test script to demonstrate the calendar script functionality.
This creates some sample calendar events and converts them to todos.
"""

import requests
import json
from datetime import datetime, timedelta

# FastAPI endpoint
FASTAPI_URL = 'http://localhost:8080'

def create_sample_todo(title: str, scheduled_date: str) -> bool:
    """Creates a sample todo to demonstrate the calendar script output format."""
    payload = {
        "title": title,
        "scheduled_date": scheduled_date
    }
    
    try:
        response = requests.post(f"{FASTAPI_URL}/api/v1/todos", 
                               headers={'Content-Type': 'application/json'}, 
                               json=payload)
        response.raise_for_status()
        print(f"Created todo: '{title}' for {scheduled_date}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Failed to create todo '{title}': {e}")
        return False

def main():
    print("Creating sample calendar todos to demonstrate the kalender_script.py format...\n")
    
    # Test FastAPI connection
    try:
        response = requests.get(f"{FASTAPI_URL}/api/v1/dashboard")
        response.raise_for_status()
        print("FastAPI backend is accessible.\n")
    except requests.exceptions.RequestException as e:
        print(f"Cannot connect to FastAPI backend: {e}")
        print("Make sure the FastAPI server is running!")
        return

    # Create sample calendar todos with the format the script would generate
    today = datetime.now().date()
    
    sample_todos = [
        (f"09:00 Team Meeting", str(today)),
        (f"13:30 Lunch with Client (Restaurant ABC)", str(today)),
        (f"15:00 Project Review", str(today)),
        (f"10:00 Doctor Appointment", str(today + timedelta(days=1))),
        (f"14:30 Conference Call (Online)", str(today + timedelta(days=1))),
        (f"16:00 Weekly Planning", str(today + timedelta(days=2)))
    ]
    
    created_count = 0
    for title, date in sample_todos:
        if create_sample_todo(title, date):
            created_count += 1
    
    print(f"\nCreated {created_count}/{len(sample_todos)} sample calendar todos.")
    print("\nThese todos demonstrate the format that kalender_script.py would create:")
    print("- Format: HH:MM EventName")
    print("- Optional location in parentheses")
    print("- Scheduled for specific dates")
    print("\nTo use the real script, run: python kalender_script.py")
    print("(Make sure the Excel file path is correct in the script)")

if __name__ == "__main__":
    main()