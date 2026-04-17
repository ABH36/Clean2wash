import os

path = r"C:\Users\FTT\Documents\GitHub\Clean-2-Wash\Frontend\src\modules\consumer\pages\FullWashBooking.jsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The broken part identified from view_file
target = """                    <h1 className="text-[13px] font-[1000] text-black tracking-tight uppercase">
                        Studio Detailing Experience
                        onClick={() => navigate('/wallet')}
                        className="w-9 h-9 bg-gray-50/80 rounded-xl flex items-center justify-center border border-black/[0.02] active:scale-95 transition-transform"
                    >
                        <Wallet size={16} className="text-black/60" />
                    </button>"""

replacement = """                    <h1 className="text-[13px] font-[1000] text-black tracking-tight uppercase">
                        Studio Detailing Experience
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/wallet')}
                        className="w-9 h-9 bg-gray-50/80 rounded-xl flex items-center justify-center border border-black/[0.02] active:scale-95 transition-transform"
                    >
                        <Wallet size={16} className="text-black/60" />
                    </button>"""

if target in content:
    new_content = content.replace(target, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: Content replaced.")
else:
    print("FAILURE: Target string not found exactly.")
    # Try with potentially different line endings or whitespace
    # But for now let's hope it works.
