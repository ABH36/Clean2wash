const fs = require('fs');
const path = require('path');

const instantWashPath = path.join(__dirname, 'src', 'modules', 'consumer', 'pages', 'InstantWash.jsx');
const studioWashPath = path.join(__dirname, 'src', 'modules', 'consumer', 'pages', 'FullWashBooking.jsx');

try {
    let content = fs.readFileSync(instantWashPath, 'utf8');

    // 1. ADD Vehicle Protocol Selector to InstantWash (if not already added)
    const vehicleSelectorCode = `
                {/* Vehicle Protocol Selector (New) */}
                <div className="px-5 pb-8">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em] mb-4 text-center">Vehicle Protocol</p>
                    <div className="flex items-center gap-3">
                        {['Hatch', 'Sedan', 'SUV'].map((type) => {
                            const isActive = selectedVehicleType === type.toLowerCase();
                            return (
                                <button
                                    key={type}
                                    onClick={() => setSelectedVehicleType(type.toLowerCase())}
                                    className={\`flex-1 group relative \${isActive ? 'scale-105' : 'opacity-40'}\`}
                                >
                                    <div className={\`bg-white rounded-2xl p-5 border transition-all \${isActive ? 'border-brand shadow-xl ring-4 ring-brand/5' : 'border-black/[0.05]'}\`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className={\`text-[11px] font-[1000] uppercase tracking-tight \${isActive ? 'text-black' : 'text-gray-400'}\`}>{type}</h4>
                                            {isActive && (
                                                <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center text-white shadow-sm">
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-4">Protocol</p>
                                        <div className={\`h-[2.5px] w-12 rounded-full transition-all \${isActive ? 'bg-brand' : 'bg-gray-100'}\`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
`;

    // Only add if not there
    if (!content.includes('Vehicle Protocol Selector (New)')) {
        content = content.replace(
            '{/* Dynamic FAQ Section */}',
            vehicleSelectorCode + '\n                    {/* Dynamic FAQ Section */}'
        );
        fs.writeFileSync(instantWashPath, content, 'utf8');
        console.log('✅ Added Vehicle Protocol Selector to InstantWash.jsx');
    } else {
        console.log('⚡ Vehicle Protocol Selector already in InstantWash.jsx');
    }

    // 2. Clone to Studio Wash
    let studioContent = content;

    // Component Rename
    studioContent = studioContent.replace(/const InstantWash = \(\) => {/g, 'const FullWashBooking = () => {');
    studioContent = studioContent.replace(/export default InstantWash;/g, 'export default FullWashBooking;');

    // Header Title
    studioContent = studioContent.replace(/INSTANT CAR\/BIKE WASH/g, 'STUDIO DETAILING');
    studioContent = studioContent.replace(/>INSTANT WASH</g, '>STUDIO WASH<');

    // Data Source Changes
    studioContent = studioContent.replace(/category === 'Express'/g, "category === 'Studio Detailing'");

    // API Request Modification to target VENDOR
    studioContent = studioContent.replace(
        /const bookingObj = \{([\s\S]*?)\};/g, 
        "const bookingObj = {$1,\n                provider_type: 'vendor' // STUDIO WASH SPECIFIC\n            };"
    );
    // Replace the payload for create wash
    studioContent = studioContent.replace(
        /provider: 'captain'/g, "provider: 'vendor'"
    );

    // Update banner tag and text context
    studioContent = studioContent.replace(/INSTANT STUDIO WASH/g, 'PREMIUM STUDIO EXPERT');
    studioContent = studioContent.replace(/INSTANT BUCKET WASH/g, 'STUDIO DEEP CLEAN');

    // Write to FullWashBooking
    fs.writeFileSync(studioWashPath, studioContent, 'utf8');
    console.log('✅ Successfully synced UX to FullWashBooking.jsx');

} catch (err) {
    console.error('Error during UX sync:', err);
}
