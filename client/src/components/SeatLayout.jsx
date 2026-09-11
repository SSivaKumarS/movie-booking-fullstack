// frontend/src/components/SeatLayout.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getSeatLayout } from '../api/api'; // Assuming API function exists
import './SeatLayout.css'; // Ensure this CSS file exists

// Helper function to sort seats is no longer needed if we don't sort seat numbers
// const sortSeatsInRow = (a, b) => { ... };

const SeatLayout = ({ onSeatsSelected }) => {
    const { screenId, showtimeId } = useParams(); // Get IDs from URL

    // State
    const [allSeats, setAllSeats] = useState([]); // Raw seat data from API { seat_id, seat_number, row, seat_type, price, isBooked }
    const [seatStatusMap, setSeatStatusMap] = useState({}); // Map of seat_id -> 'available'/'selected'/'booked'
    const [selectedSeatIds, setSelectedSeatIds] = useState([]); // Array of selected seat _id strings
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch seat layout data
    useEffect(() => {
        // Validate IDs before fetching
        if (!screenId || !showtimeId) {
            console.error("[SeatLayout] Missing screenId or showtimeId", { screenId, showtimeId });
            setError("Cannot load seats: Missing screen or showtime information.");
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchSeatData = async () => {
            setLoading(true);
            setError(null);
            setAllSeats([]);
            setSeatStatusMap({});
            setSelectedSeatIds([]);

            try {
                console.log("[SeatLayout] Fetching seats for:", { screenId, showtimeId });
                const response = await getSeatLayout(screenId, showtimeId);
                console.log("[SeatLayout] Raw seat data from API:", response);

                if (!isMounted) return;

                // Handle the response data which is an array of seats directly
                const seats = Array.isArray(response) ? response : [];
                if (seats.length === 0) {
                    throw new Error("No seats configured for this screen");
                }

                console.log("[SeatLayout] Processing seats:", seats);
                setAllSeats(seats);

                // Initialize seat status map based on fetched data
                const initialStatus = {};
                seats.forEach(seat => {
                    initialStatus[seat._id] = seat.is_available ? 'available' : 'booked';
                    console.log(`[SeatLayout] Seat ${seat.seat_number} (${seat._id}): is_available=${seat.is_available}, status=${initialStatus[seat._id]}`);
                });
                console.log("[SeatLayout] Initial status map:", initialStatus);
                setSeatStatusMap(initialStatus);
            } catch (e) {
                console.error("[SeatLayout] Error fetching seat layout:", e);
                if (isMounted) {
                    const errorMessage = e.response?.data?.message || e.message || "Failed to load seat layout.";
                    setError(`Error loading seats: ${errorMessage}`);
                    if (e.response) {
                        console.error("[SeatLayout] Response Error:", {
                            status: e.response.status,
                            data: e.response.data,
                            headers: e.response.headers
                        });
                    }
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSeatData();
        return () => { isMounted = false; };
    }, [screenId, showtimeId]);

    // Handle clicking on a seat
    const handleSeatClick = useCallback((seatId) => {
        // Find the seat in allSeats to check its availability
        const seat = allSeats.find(s => s._id === seatId);
        
        // Return early if seat is not found or is not available
        if (!seat || !seat.is_available) {
            console.log(`[SeatLayout] Attempted to select unavailable seat ${seatId}`);
            return;
        }

        // Additional check for booked status
        if (seatStatusMap[seatId] === 'booked') {
            console.log(`[SeatLayout] Attempted to select booked seat ${seatId}`);
            return;
        }

        setSeatStatusMap(prevMap => {
            const currentStatus = prevMap[seatId];
            // Additional check before changing status
            if (currentStatus === 'booked') {
                return prevMap;
            }
            const newStatus = currentStatus === 'selected' ? 'available' : 'selected';
            return { ...prevMap, [seatId]: newStatus };
        });

        setSelectedSeatIds(prevSelected => {
            if (prevSelected.includes(seatId)) {
                return prevSelected.filter(id => id !== seatId);
            } else {
                // Final check before adding to selected
                const seatToAdd = allSeats.find(s => s._id === seatId);
                if (!seatToAdd || !seatToAdd.is_available) {
                    return prevSelected;
                }
                return [...prevSelected, seatId];
            }
        });
    }, [allSeats, seatStatusMap]);

    // Effect to notify parent component when selection changes
    useEffect(() => {
        if (typeof onSeatsSelected === 'function') {
            const selectedFullData = selectedSeatIds.map(id =>
                allSeats.find(seat => seat._id === id)  // Use _id instead of seat_id
            ).filter(seat => seat !== undefined);
            onSeatsSelected(selectedSeatIds, selectedFullData);
        }
    }, [selectedSeatIds, onSeatsSelected, allSeats]);

    // --- Grouping and Rendering Logic ---

    // Memoize grouped seats to avoid recalculation unless allSeats changes
    const groupedSeatsByRow = useMemo(() => {
        if (!allSeats || allSeats.length === 0) return {};

        // Group first by Type, then by Row
        const groups = allSeats.reduce((typeGroups, seat) => {
             const type = seat.seat_type || 'Unknown';
             if (!typeGroups[type]) typeGroups[type] = {};

             const row = seat.row || '??';
             if (!typeGroups[type][row]) typeGroups[type][row] = [];

             typeGroups[type][row].push(seat);
             return typeGroups;
        }, {});

        // Sort seats within each row by their number
        for (const seatType in groups) {
            for (const rowLabel in groups[seatType]) {
                groups[seatType][rowLabel].sort((a, b) => {
                    // Extract numeric part from seat numbers and convert to numbers
                    const numA = parseInt(a.seat_number.split('.')[0].replace(/[^0-9]/g, ''));
                    const numB = parseInt(b.seat_number.split('.')[0].replace(/[^0-9]/g, ''));
                    return numA - numB;
                });
            }
        }

        return groups;
    }, [allSeats]);

    // --- Render Component ---

    if (loading) {
        return <div className="loading seat-layout-loading">Loading Seat Layout...</div>;
    }

    if (error) {
        return <div className="error-message-box seat-error">Error loading seats: {error}</div>;
    }

    if (allSeats.length === 0) {
        return <div className="no-seats">No seats configured for this screen.</div>;
    }

    return (
        <div className="seat-layout-container">
            {/* Iterate through grouped seats (Type -> Row -> Seat) */}
            {/* Keep the order of seat types as returned by Object.entries */}
            {Object.entries(groupedSeatsByRow).map(([seatType, rowsInType]) => (
                <div key={seatType} className={`seat-category-section seat-category-${seatType.toLowerCase().replace(/\s+/g, '-')}`}>
                    <h3 className="seat-category-label">{seatType}</h3>
                    {/* Keep the order of rows as returned by Object.entries */}
                    {Object.entries(rowsInType).map(([rowLabel, seatsInRow]) => (
                        <div key={`${seatType}-${rowLabel}`} className="seat-row">
                            <div className="row-label">{rowLabel}</div>
                            <div className="seats">
                                {/* Render seats in the order they exist in the seatsInRow array (API order) */}
                                {seatsInRow.map(seat => {
                                    if (seat.seat_number.endsWith('.5')) {
                                        return <div key={seat._id} className="seat decimal-space" />;
                                    }
                                    
                                    // Determine the seat status based on both is_available and selection state
                                    const isBooked = !seat.is_available;
                                    const seatStatus = isBooked ? 'booked' : 
                                                     (seatStatusMap[seat._id] === 'selected' ? 'selected' : 'available');
                                    
                                    return (
                                        <div
                                            key={seat._id}
                                            className={`seat ${seatStatus}`}
                                            onClick={isBooked ? undefined : () => handleSeatClick(seat._id)}
                                            role="button"
                                            tabIndex={isBooked ? -1 : 0}
                                            aria-disabled={isBooked}
                                            aria-pressed={seatStatus === 'selected'}
                                            aria-label={`Seat ${seat.seat_number}${isBooked ? ' (Booked)' : ''}`}
                                            style={{
                                                pointerEvents: isBooked ? 'none' : 'auto',
                                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                                userSelect: 'none',
                                                WebkitUserSelect: 'none',
                                                MozUserSelect: 'none',
                                                msUserSelect: 'none'
                                            }}
                                        >
                                            {seat.seat_number.split('.')[0].replace(/[^0-9]/g, '')}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {/* Screen representation */}
            <div className="screen-view">SCREEN</div>

            {/* Legend */}
            <div className="seat-legend">
                <div className="legend-item"><div className="seat available"></div><span>Available</span></div>
                <div className="legend-item"><div className="seat selected"></div><span>Selected</span></div>
                <div className="legend-item"><div className="seat booked"></div><span>Booked</span></div>
            </div>
        </div>
    );
};

export default SeatLayout;