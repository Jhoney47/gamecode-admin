import json
import os

# Configuration
JSON_FILE = 'GameCodeBase.json'

def fix_duplicates():
    if not os.path.exists(JSON_FILE):
        print(f"❌ File not found: {JSON_FILE}")
        return

    print(f"📂 Reading {JSON_FILE}...")
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return

    total_removed = 0
    
    if 'games' in data:
        for game in data['games']:
            game_name = game.get('gameName', 'Unknown')
            codes = game.get('codes', [])
            
            seen_codes = set()
            unique_codes = []
            removed_count = 0
            
            for code_entry in codes:
                code_str = code_entry.get('code')
                
                if code_str and code_str in seen_codes:
                    removed_count += 1
                else:
                    if code_str:
                        seen_codes.add(code_str)
                    unique_codes.append(code_entry)
            
            # Update the game's codes
            game['codes'] = unique_codes
            game['codeCount'] = len(unique_codes)
            
            if removed_count > 0:
                print(f"  - [{game_name}]: Removed {removed_count} duplicates.")
                total_removed += removed_count
    
    # Update stats
    if hasattr(data, 'totalCodes'):
         data['totalCodes'] = sum(len(g.get('codes', [])) for g in data.get('games', []))

    if total_removed > 0:
        print(f"🧹 Writing cleaned data back to file...")
        try:
            with open(JSON_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✅ Successfully removed {total_removed} duplicate entries!")
        except Exception as e:
            print(f"❌ Error writing file: {e}")
    else:
        print("✨ No duplicates found. Data is clean.")

if __name__ == "__main__":
    fix_duplicates()
