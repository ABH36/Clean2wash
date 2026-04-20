import React from 'react';
import { CarFront, IndianRupee, MapPin } from 'lucide-react';

const OperationsSection = ({
    opsFilter,
    setOpsFilter,
    opsSearch,
    setOpsSearch,
    bookingsLoading,
    filteredLiveBookings,
    bookingStatusConfig,
    getAssignedDriver,
    getOpenIssueCount,
    getBookedDurationLabel,
    getBookingAddress,
    getBookingAmount,
    getBookingSchedule,
    openBookingDesk
}) => (
    <div className="bg-white/5 dark:bg-slate-900 border border-black/[0.05] dark:border-white/10 rounded-[1rem] overflow-hidden shadow-[0_14px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
        <div className="px-4 py-3.5 border-b border-white/5 dark:border-white/10 flex items-center justify-between gap-3 flex-wrap">
            <div>
                <p className="text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest mb-1">Live chauffeur ops</p>
                <h3 className="text-[14px] font-black text-white dark:text-white uppercase">Active Trips (Essential View)</h3>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
                <span className="h-9 px-3 inline-flex items-center rounded-lg bg-white/[0.05] dark:bg-white/10 text-[10px] font-black text-white/60 dark:text-white/70 uppercase">
                    {filteredLiveBookings.length} Live
                </span>
                <select
                    value={opsFilter}
                    onChange={(event) => setOpsFilter(event.target.value)}
                    className="h-9 border border-white/10 dark:border-white/15 bg-white/5 dark:bg-slate-800 rounded-lg px-3 text-[11px] font-black text-white dark:text-white uppercase outline-none"
                >
                    <option value="all">All trips</option>
                    <option value="attention">Needs attention</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="pending">Awaiting driver</option>
                    <option value="en_route">Driver en route</option>
                    <option value="arrived">Driver arrived</option>
                    <option value="active">Trip active</option>
                </select>
                <input
                    type="text"
                    value={opsSearch}
                    onChange={(event) => setOpsSearch(event.target.value)}
                    placeholder="Search booking, customer, driver"
                    className="h-9 w-64 max-w-full border border-white/10 dark:border-white/15 bg-white/5 dark:bg-slate-800 rounded-lg px-3 text-[11px] font-bold text-white dark:text-white outline-none focus:border-black dark:focus:border-white/50"
                />
            </div>
        </div>

        {bookingsLoading ? (
            <div className="py-16 flex items-center justify-center">
                <div className="w-5 h-5 border-white/5 border-brand/30 border-t-brand rounded-full animate-spin" />
            </div>
        ) : filteredLiveBookings.length === 0 ? (
            <div className="py-16 text-center">
                <CarFront size={32} className="mx-auto text-black/10 dark:text-white/20 mb-3" />
                <p className="text-[10px] font-black text-white/20 dark:text-white/35 uppercase tracking-widest">No chauffeur trips match this filter</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/10">
                {filteredLiveBookings.map((booking) => {
                    const bookingStatus = bookingStatusConfig[booking.status] || bookingStatusConfig.pending;
                    const assignedDriver = getAssignedDriver(booking);
                    const issueCount = getOpenIssueCount(booking);
                    const bookedDuration = getBookedDurationLabel(booking);

                    return (
                        <div key={booking._id} className="px-4 py-4 grid grid-cols-1 xl:grid-cols-[1.35fr_1fr_auto] gap-3 items-center">
                            <div className="space-y-2 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-[11px] font-black text-white dark:text-white uppercase">
                                        {booking.serviceName || 'Chauffeur Service'} - {booking.bookingId || booking._id?.slice(-6)}
                                    </p>
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${bookingStatus.color}`}>
                                        {bookingStatus.label}
                                    </span>
                                    {issueCount > 0 && (
                                        <span className="px-2 py-1 rounded text-[8px] font-black uppercase bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                                            {issueCount} issue{issueCount > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] font-black text-black/55 dark:text-white/60 uppercase truncate">
                                    {booking.consumer?.name || 'Customer pending'} - {booking.consumer?.phone || 'No phone'}
                                </p>
                                <div className="flex items-start gap-2 text-[10px] font-bold text-black/55 dark:text-white/60 min-w-0">
                                    <MapPin size={13} className="mt-0.5 shrink-0 text-[#F29F05]" />
                                    <div className="space-y-1 min-w-0">
                                        <p className="truncate">{getBookingAddress(booking)}</p>
                                        <p className="text-[9px] text-black/35 dark:text-white/45 uppercase">
                                            {assignedDriver?.name ? `Driver: ${assignedDriver.name}` : 'Driver: Waiting for assignment'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 xl:justify-self-end">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-black/50 dark:text-white/60">
                                    <IndianRupee size={13} className="text-green-600" />
                                    <span>{getBookingAmount(booking)}</span>
                                </div>
                                <p className="text-[10px] font-bold text-black/45 dark:text-white/55">
                                    Schedule: {getBookingSchedule(booking)}
                                </p>
                                {bookedDuration && (
                                    <p className="text-[10px] font-bold text-black/35 dark:text-white/45">Window: {bookedDuration}</p>
                                )}
                            </div>

                            <div className="xl:justify-self-end">
                                <button
                                    onClick={() => openBookingDesk(booking)}
                                    className="h-9 px-4 bg-black dark:bg-white/5 text-white dark:text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand hover:text-white transition-colors"
                                >
                                    Manage trip
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

export default OperationsSection;
