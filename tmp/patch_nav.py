import sys

file_path = r'c:\Users\FTT\Documents\GitHub\Clean-2-Wash\Frontend\src\modules\admin\pages\AdminApartmentWash.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "useEffect(() => {" in line and "fetchConsole();" in lines[lines.index(line)+1]:
        # We found the block
        new_lines.append(line)
        new_lines.append(lines[lines.index(line)+1])
        new_lines.append(lines[lines.index(line)+2])
        new_lines.append("\n")
        new_lines.append("    useEffect(() => {\n")
        new_lines.append("        const querySection = searchParams.get('section');\n")
        new_lines.append("        if (querySection && querySection !== activeSection) {\n")
        new_lines.append("            setActiveSection(querySection);\n")
        new_lines.append("        }\n")
        new_lines.append("    }, [searchParams]);\n")
        new_lines.append("\n")
        new_lines.append("    const handleSectionChange = (sectionId) => {\n")
        new_lines.append("        const params = new URLSearchParams(searchParams);\n")
        new_lines.append("        params.set('section', sectionId);\n")
        new_lines.append("        setSearchParams(params);\n")
        new_lines.append("        setActiveSection(sectionId);\n")
        new_lines.append("    };\n")
    else:
        # Avoid duplicate append if already processed or not the target
        # Actually this simple script might duplicate if it doesn't skip
        pass

# Improved script logic to avoid mess
def patch():
    target_block = """    useEffect(() => {
        fetchConsole();
    }, []);"""
    
    replacement = """    useEffect(() => {
        fetchConsole();
    }, []);

    useEffect(() => {
        const querySection = searchParams.get('section');
        if (querySection && querySection !== activeSection) {
            setActiveSection(querySection);
        }
    }, [searchParams]);

    const handleSectionChange = (sectionId) => {
        const params = new URLSearchParams(searchParams);
        params.set('section', sectionId);
        setSearchParams(params);
        setActiveSection(sectionId);
    };"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try normalizing spaces to find the block
    if target_block in content:
        new_content = content.replace(target_block, replacement, 1)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully patched.")
    else:
        print("Target block not found precisely.")

if __name__ == "__main__":
    patch()
