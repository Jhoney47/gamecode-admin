import json

try:
    with open('GameCodeBase.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"✅ JSON is valid. Found {len(data.get('games', []))} games.")
except Exception as e:
    print(f"❌ JSON Error: {e}")
