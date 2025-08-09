#!/usr/bin/env python3

# /// script
# dependencies = [
#   "pandas",
#   "openpyxl",
#   "requests"
# ]
# ///

import csv
import requests
import json
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from pathlib import Path
from typing import List, Dict, Optional, Any
import pandas as pd
from pprint import pprint

# --- Constants --- 
# Keep constants for Excel reading
EXCEL_FILE_PATH: str = "/Users/niclasedge/Library/CloudStorage/OneDrive-DATAGROUPSE/Dokumente - DG Reporting HUB/Planung/cal.xlsx"
EXCEL_TABLE_NAME: str = "kalender"
EXCEL_SUBJECT_COL: str = "termin"
EXCEL_START_COL: str = "start"
EXCEL_END_COL: str = "end"
EXCEL_LOCATION_COL: str = "location"

# Internal keys for processed data
KEY_START_DT_OBJ = "start_dt_obj"
KEY_END_DT_OBJ = "end_dt_obj"

# --- FastAPI Configuration ---
FASTAPI_URL = 'http://localhost:8080'  # FastAPI backend URL
TODO_DATE_FORMAT = "%Y-%m-%d"  # Date format for todo scheduled_date

# --- Timezone --- 
LOCAL_TIMEZONE = 'Europe/Berlin'

# ==================================
# FastAPI Todo Creation Functions
# ==================================

def get_existing_todos(base_url: str) -> List[Dict[str, Any]]:
    """Fetches existing todos from FastAPI backend."""
    try:
        response = requests.get(f"{base_url}/api/v1/dashboard")
        response.raise_for_status()
        data = response.json()
        
        if not data.get('success'):
            print(f"API Error: {data.get('error')}")
            return []
            
        dashboard_data = data.get('data', {})
        todos = []
        
        # Get todos from weekly_todos and someday_todos
        for day_data in dashboard_data.get('weekly_todos', []):
            if day_data.get('todos'):
                todos.extend(day_data['todos'])
                
        todos.extend(dashboard_data.get('someday_todos', []))
        
        return todos
        
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch existing todos: {e}")
        return []

def delete_calendar_todos(base_url: str) -> int:
    """Deletes existing todos that were created from calendar events (contain time format HH:MM)."""
    todos = get_existing_todos(base_url)
    deleted_count = 0
    error_count = 0
    
    # Filter todos that look like calendar entries (contain time format)
    calendar_todos = []
    for todo in todos:
        title = todo.get('title', '')
        # Check if title starts with time format like "13:30 "
        if len(title) >= 6 and title[2] == ':' and title[5] == ' ':
            try:
                # Try to parse the time to verify it's valid
                time_part = title[:5]
                datetime.strptime(time_part, '%H:%M')
                calendar_todos.append(todo)
            except ValueError:
                # Not a time format, skip
                continue
    
    print(f"Found {len(calendar_todos)} calendar todos to delete...")
    
    for todo in calendar_todos:
        try:
            response = requests.delete(f"{base_url}/api/v1/todos/{todo['id']}")
            response.raise_for_status()
            deleted_count += 1
            print(f"Deleted todo: {todo['title']}")
        except requests.exceptions.RequestException as e:
            print(f"Failed to delete todo '{todo['title']}': {e}")
            error_count += 1
            
    print(f"Deletion finished. Successfully deleted: {deleted_count}. Errors: {error_count}.")
    return deleted_count

def create_todo(base_url: str, title: str, scheduled_date: str) -> bool:
    """Creates a single todo in the FastAPI backend."""
    payload = {
        "title": title,
        "scheduled_date": scheduled_date
    }
    
    try:
        response = requests.post(f"{base_url}/api/v1/todos", headers={'Content-Type': 'application/json'}, json=payload)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Failed to create todo '{title}': {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Status: {e.response.status_code}")
            try: 
                response_body = e.response.json()
                print(f"  Response: {response_body}")
            except json.JSONDecodeError: 
                print(f"  Response: {e.response.text}")
        return False
    except Exception as e:
         print(f"An unexpected error occurred during todo creation: {e}")
         return False


# ==================================
# Excel Reading Function
# ==================================

def read_and_process_excel(file_path: Path, table_name: str) -> Optional[List[Dict[str, Any]]]:
    """Reads the specified table/sheet from the Excel file, processes, and formats the data."""
    if not file_path.exists():
        print(f"Error: Excel file not found at {file_path}")
        return None

    print(f"Attempting to read table/sheet '{table_name}' from: {file_path}")
    try:
        try:
            # Try reading the specified sheet name first
            df = pd.read_excel(file_path, sheet_name=table_name)
            print(f"Successfully read sheet '{table_name}'.")
        except ValueError: # Sheet name not found
            print(f"Sheet/Table '{table_name}' not found, trying the first sheet.")
            df = pd.read_excel(file_path, sheet_name=0)
            print("Successfully read the first sheet.")
        
        print(f"Read {len(df)} rows initially.")

        # --- Data Cleaning and Preparation ---
        # 1. Rename columns for consistency
        rename_map = {
            EXCEL_SUBJECT_COL: 'termin', # Keep original names if they match internal use
            EXCEL_START_COL: 'start_str', # Read as string initially
            EXCEL_END_COL: 'end_str',     # Read as string initially
            EXCEL_LOCATION_COL: 'location' # Keep original name
        }
        # Only keep columns we need
        required_cols_original = list(rename_map.keys())
        df = df[required_cols_original].copy()
        df.rename(columns=rename_map, inplace=True)
        
        # 2. Convert datetime strings to datetime objects
        # Handle potential errors during conversion
        df[KEY_START_DT_OBJ] = pd.to_datetime(df['start_str'], errors='coerce')
        df[KEY_END_DT_OBJ] = pd.to_datetime(df['end_str'], errors='coerce')

        # 3. Drop rows where datetime conversion failed
        original_count = len(df)
        df.dropna(subset=[KEY_START_DT_OBJ, KEY_END_DT_OBJ], inplace=True)
        dropped_invalid_dt = original_count - len(df)
        if dropped_invalid_dt > 0:
            print(f"Dropped {dropped_invalid_dt} rows due to invalid datetime formats.")

        # 4. Drop duplicates based on subject and the original datetime strings 
        #    (or the converted objects, assuming successful conversion implies uniqueness)
        #    Using subject + datetime objects is likely more robust.
        duplicate_check_cols_internal = ['termin', KEY_START_DT_OBJ, KEY_END_DT_OBJ]
        original_count = len(df)
        df.drop_duplicates(subset=duplicate_check_cols_internal, keep='first', inplace=True)
        dropped_duplicates = original_count - len(df)
        if dropped_duplicates > 0:
           print(f"Removed {dropped_duplicates} duplicate rows based on {duplicate_check_cols_internal}.")

        print(f"{len(df)} unique rows remaining.")

        # 5. Convert DataFrame to list of dictionaries
        # Select only the columns needed for PocketBase sync + the datetime objects
        final_cols = ['termin', KEY_START_DT_OBJ, KEY_END_DT_OBJ, 'location']
        
        # Ensure location column exists, add if not, and handle NaN for JSON compatibility
        if 'location' not in df.columns:
             df['location'] = None 
        else:
            # Replace pandas NaN with Python None before creating the dictionary
            df['location'] = df['location'].astype(object).where(pd.notna(df['location']), None)

        df_final = df[final_cols].copy()
        # Rename 'termin' back to the original excel subject column name if needed by sync_events
        # Currently sync_events uses EXCEL_SUBJECT_COL which maps to 'termin' internally here
        # df_final.rename(columns={'termin': EXCEL_SUBJECT_COL}, inplace=True) 
        
        events_list = df_final.to_dict('records')
        return events_list

    except FileNotFoundError:
        print(f"Error: Excel file not found at {file_path}")
        return None
    except Exception as e:
        print(f"Error reading or processing Excel file: {e}")
        import traceback
        traceback.print_exc()
        return None

# ==================================
# Main Sync Logic
# ==================================

def sync_events(local_events: List[Dict[str, Any]], base_url: str):
    """Creates todos from calendar events in the FastAPI backend."""
    print(f"\nCreating {len(local_events)} todos from Excel calendar events...")
    
    # First, get all existing todos to check for duplicates
    existing_todos = get_existing_todos(base_url)
    existing_todo_signatures = set()
    
    # Create signatures for existing todos (title + date combination)
    for todo in existing_todos:
        if todo.get('scheduled_date') and 'Valid' in str(todo.get('scheduled_date', {})):
            # Handle the NullableString format
            if todo['scheduled_date'].get('Valid') and todo['scheduled_date'].get('String'):
                date_str = todo['scheduled_date']['String']
                signature = f"{todo['title']}|{date_str}"
                existing_todo_signatures.add(signature)
        elif todo.get('scheduled_date') and isinstance(todo.get('scheduled_date'), str):
            # Handle direct string format
            signature = f"{todo['title']}|{todo['scheduled_date']}"
            existing_todo_signatures.add(signature)
    
    print(f"Found {len(existing_todo_signatures)} existing todos to check against duplicates.")
    
    created_count = 0
    skipped_count = 0
    duplicate_count = 0
    error_count = 0
    local_tz = ZoneInfo(LOCAL_TIMEZONE) # E.g., 'Europe/Berlin'

    for event in local_events:
        summary = event.get('termin') # Field name from read_and_process_excel
        start_dt = event.get(KEY_START_DT_OBJ)
        end_dt = event.get(KEY_END_DT_OBJ)
        location = event.get('location', None) # Optional

        if not all([summary, start_dt, end_dt]):
            print(f"Skipping event due to missing data: {event}")
            skipped_count += 1
            continue

        try:
            # Ensure datetime objects are timezone-aware (assuming local time from Excel)
            # Handle cases where datetime might already be aware (though unlikely from pandas)
            start_dt_local = local_tz.localize(start_dt) if getattr(start_dt, 'tzinfo', None) is None else start_dt.astimezone(local_tz)
            end_dt_local = local_tz.localize(end_dt) if getattr(end_dt, 'tzinfo', None) is None else end_dt.astimezone(local_tz)

        except Exception as e:
            print(f"Error processing timezone for event '{summary}': {e}")
            skipped_count += 1
            continue

        # Format the date for the todo (YYYY-MM-DD)
        scheduled_date = start_dt_local.strftime(TODO_DATE_FORMAT)
        
        # Format the time (HH:MM)
        time_str = start_dt_local.strftime('%H:%M')
        
        # Create the todo title with time and event name
        todo_title = f"{time_str} {summary}"
        
        # Add location if available
        if location and location.strip():
            todo_title += f" ({location})"

        # Check for duplicates
        todo_signature = f"{todo_title}|{scheduled_date}"
        
        if todo_signature in existing_todo_signatures:
            print(f"Skipping duplicate todo: '{todo_title}' for {scheduled_date}")
            duplicate_count += 1
            continue

        # Create the todo using the helper function
        if create_todo(base_url, todo_title, scheduled_date):
            print(f"Created todo: '{todo_title}' for {scheduled_date}")
            created_count += 1
            # Add to existing signatures to prevent duplicates within this run
            existing_todo_signatures.add(todo_signature)
        else:
            error_count += 1 # create_todo prints the specific error

    print("\nTodo creation finished.")
    print(f"  Events processed for creation: {len(local_events)}")
    print(f"  Successfully created: {created_count}")
    print(f"  Skipped duplicates: {duplicate_count}")
    print(f"  Skipped (missing data/TZ error): {skipped_count}")
    print(f"  Errors during creation: {error_count}")

# ==================================
# Main Execution
# ==================================
def main():
    """Main function to run the script."""
    print("Starting calendar to todo sync script...\n")

    # 1. Read and process Excel data
    excel_path = Path(EXCEL_FILE_PATH)
    local_events = read_and_process_excel(excel_path, EXCEL_TABLE_NAME)
    if local_events is None:
        print("Exiting due to error reading Excel file.")
        return
    if not local_events:
        print("No events found in the Excel file. Exiting.")
        return
    print(f"Successfully processed {len(local_events)} unique events from Excel.")

    # 2. Test FastAPI connection
    try:
        response = requests.get(f"{FASTAPI_URL}/api/v1/dashboard")
        response.raise_for_status()
        print("FastAPI backend is accessible.")
    except requests.exceptions.RequestException as e:
        print(f"Cannot connect to FastAPI backend at {FASTAPI_URL}: {e}")
        print("Make sure the FastAPI server is running!")
        return

    # 3. Create todos from calendar events (duplicates will be skipped automatically)
    sync_events(local_events, FASTAPI_URL)

    print("\nScript finished.")

if __name__ == "__main__":
    main()