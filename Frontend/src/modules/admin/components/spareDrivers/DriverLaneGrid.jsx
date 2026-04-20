import React from 'react';

const DriverLaneGrid = ({ lanes, driverLane, laneCounts, onSelect }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2.5">
        {lanes.map((lane) => {
            const isActiveLane = driverLane === lane.id;
            return (
                <button
                    key={lane.id}
                    onClick={() => onSelect(lane.id)}
                    className={`rounded-[0.8rem] border px-2.5 py-2.5 text-left transition-colors ${isActiveLane ? 'border-black bg-black text-white dark:border-white dark:bg-white/5 dark:text-white shadow-[0_8px_16px_rgba(15,23,42,0.14)]' : 'border-white/10 dark:border-white/15 bg-white/5 dark:bg-slate-900 text-white dark:text-white hover:border-black/20 dark:hover:border-white/35'}`}
                >
                    <p className={`text-[7.5px] font-black uppercase tracking-[0.18em] ${isActiveLane ? 'text-white/65 dark:text-white/60' : 'text-black/35 dark:text-white/45'}`}>{lane.label}</p>
                    <p className="mt-1.5 text-lg font-black">{laneCounts[lane.id] || 0}</p>
                </button>
            );
        })}
    </div>
);

export default DriverLaneGrid;
