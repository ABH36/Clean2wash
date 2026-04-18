import os

root_dir = r"C:\Users\FTT\Documents\GitHub\Clean-2-Wash"
frontend_src = os.path.join(root_dir, "Frontend", "src")

# Words to replace
replacements = {
    "Clean2Wash": "Spare Driver",
    "Clean-2-Wash": "Spare Driver"
}

def rebrand(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.jsx', '.js', '.html', '.json', '.css')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    for old, new in replacements.items():
                        content = content.replace(old, new)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Rebranded: {file_path}")
                except Exception as e:
                    print(f"Skipped {file_path}: {e}")

rebrand(frontend_src)
