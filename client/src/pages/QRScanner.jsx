import React, { useState, useEffect, useContext, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import UserContext from '../context/UserContext';
import api, { getShowtimesByTheaterId } from '../api/api';
import moment from 'moment-timezone';
import './QRScanner.css';

// Define target timezone (consistent with backend)
const TARGET_TIMEZONE = 'Asia/Kolkata';

const QRScanner = () => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [selectedShowtime, setSelectedShowtime] = useState('');
    const [selectedShowtimeDetails, setSelectedShowtimeDetails] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastScannedCode, setLastScannedCode] = useState(null);
    const [scanCooldown, setScanCooldown] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [hasPermission, setHasPermission] = useState(false);
    const html5QrCode = useRef(null);
    const readerRef = useRef(null);

    // Check camera permissions first
    const checkCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasPermission(true);
            // Stop the stream immediately after permission check
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            console.error('Camera permission error:', err);
            setError('Camera access denied. Please grant camera permissions and refresh the page.');
            setHasPermission(false);
            return false;
        }
    };

    // Initialize scanner
    const initializeScanner = async () => {
        try {
            // Check permission first
            const hasPermission = await checkCameraPermission();
            if (!hasPermission) {
                return;
            }

            // Create new scanner instance if it doesn't exist
            if (!html5QrCode.current) {
                html5QrCode.current = new Html5Qrcode("qr-reader", {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false // Disable verbose logging
                });
            }
            
            // Get available cameras
            const devices = await Html5Qrcode.getCameras();
            console.log('Available cameras:', devices);
            
            if (devices && devices.length > 0) {
                setCameras(devices);
                // Try to find a back-facing camera first
                const backCamera = devices.find(camera => 
                    camera.label.toLowerCase().includes('back') ||
                    camera.label.toLowerCase().includes('rear')
                );
                setSelectedCamera(backCamera?.id || devices[0].id);
            } else {
                throw new Error('No cameras found');
            }
        } catch (err) {
            console.error('Scanner initialization error:', err);
            setError('Failed to initialize camera. Please ensure your camera is not being used by another application.');
        }
    };

    const startScanning = async () => {
        if (!html5QrCode.current || !selectedCamera) {
            console.error('Scanner or camera not initialized', { 
                hasScanner: !!html5QrCode.current, 
                selectedCamera 
            });
            setError('Scanner not initialized. Please refresh the page.');
            return;
        }

        try {
            if (html5QrCode.current.isScanning) {
                await stopScanning();
            }

            console.log('Starting scanner with camera:', selectedCamera);
            await html5QrCode.current.start(
                selectedCamera,
                {
                    fps: 5, // Reduced from 10 to 5 to decrease processing load
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                    disableFlip: false,
                    videoConstraints: {
                        facingMode: "environment"
                    }
                },
                (decodedText, decodedResult) => {
                    console.log('QR Code detected:', decodedText);
                    handleScan(decodedText, decodedResult);
                },
                (errorMessage) => {
                    // Only log errors that are not parse errors
                    if (!errorMessage.includes("QR code parse error") && 
                        !errorMessage.includes("No MultiFormat Readers")) {
                        console.error('QR Scanner Error:', errorMessage);
                        setError('Scanner error: ' + errorMessage);
                    }
                }
            );
            setScanning(true);
            setError('');
            console.log('Scanner started successfully');
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError('Failed to start camera. Please try a different camera or refresh the page.');
            setScanning(false);
        }
    };

    const stopScanning = async () => {
        try {
            if (html5QrCode.current?.isScanning) {
                await html5QrCode.current.stop();
                console.log('Scanner stopped');
            }
            setScanning(false);
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    };

    const handleCameraChange = async (e) => {
        const newCameraId = e.target.value;
        setSelectedCamera(newCameraId);
        if (scanning) {
            await stopScanning();
            setTimeout(() => {
                startScanning();
            }, 500);
        }
    };

    const handleShowtimeChange = async (e) => {
        const value = e.target.value;
        console.log('Selected showtime:', value);
        
        setSelectedShowtime(value);
        const showtime = showtimes.find(s => s._id === value);
        setSelectedShowtimeDetails(showtime);
        
        if (value) {
            await startScanning();
        } else {
            await stopScanning();
        }
    };

    const handleScan = async (decodedText, decodedResult) => {
        // If already processing a scan or scanner is stopped, ignore new scans
        if (scanCooldown || !scanning) {
            return;
        }

        try {
            console.log('Processing scan result:', { decodedText, decodedResult });
            
            if (!selectedShowtime) {
                setError('Please select a showtime first');
                return;
            }

            // Check if user is a theater admin and has theater_id
            if (!user || user.role !== 'theater_admin' || !user.theater_id) {
                setError('You must be logged in as a theater admin to verify tickets');
                return;
            }

            // Stop scanning and set cooldown immediately
            await stopScanning();
            setScanCooldown(true);
            setLastScannedCode(decodedText);
            
            console.log('Verifying ticket:', { 
                bookingId: decodedText, 
                showtimeId: selectedShowtime,
                theater_id: user.theater_id 
            });

            try {
                const response = await api.post('/bookings/verify-ticket', 
                    {
                        bookingId: decodedText,
                        showtimeId: selectedShowtime,
                        theater_id: user.theater_id
                    }
                );
                
                console.log('Verification response:', response.data);
                
                if (response.data) {
                    setSuccess('Ticket verified successfully!');
                    setScanResult(response.data);
                    
                    // Show success message and scan next button
                    setTimeout(() => {
                        setSuccess('Scan completed. Click "Scan Next Ticket" to continue.');
                    }, 2000);
                }
            } catch (err) {
                console.error('Verification error:', err.response?.data || err);
                const errorMessage = err.response?.data?.message || 'Failed to verify ticket';
                setError(errorMessage);
                setScanResult(null);
                
                // Reset scanning after error
                setTimeout(() => {
                    setError('');
                    setLastScannedCode(null);
                    setScanCooldown(false);
                    startScanning();
                }, 3000);
            }
        } catch (err) {
            console.error('Scan processing error:', err);
            setError('Failed to process scan. Please try again.');
            setScanResult(null);
            
            // Reset scanning after error
            setTimeout(() => {
                setError('');
                setLastScannedCode(null);
                setScanCooldown(false);
                startScanning();
            }, 3000);
        }
    };

    const handleRestartScanning = () => {
        setSuccess('');
        setScanResult(null);
        setLastScannedCode(null);
        setScanCooldown(false);
        startScanning();
    };

    // Add a new effect to initialize scanner after component mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (document.getElementById('qr-reader')) {
                initializeScanner();
            }
        }, 1000);
        
        return () => {
            clearTimeout(timer);
            if (html5QrCode.current?.isScanning) {
                html5QrCode.current.stop().catch(console.error);
            }
        };
    }, []);

    useEffect(() => {
        if (selectedShowtime && selectedCamera && !scanCooldown && hasPermission) {
            startScanning();
        }
    }, [selectedShowtime, selectedCamera, hasPermission]);

    // Fetch showtimes
    useEffect(() => {
        const fetchShowtimes = async () => {
            try {
                setLoading(true);
                // Get today's date in YYYY-MM-DD format in theater's timezone
                const today = moment().tz(TARGET_TIMEZONE).format('YYYY-MM-DD');
                const response = await getShowtimesByTheaterId(user.theater_id, {
                    date: today
                });

                console.log('Fetched showtimes:', response);

                // Filter out showtimes that have already passed
                const now = moment().tz(TARGET_TIMEZONE);
                const filteredShowtimes = response.filter(showtime => {
                    const showtimeStart = moment(showtime.start_time).tz(TARGET_TIMEZONE);
                    return showtimeStart.isAfter(now);
                });

                console.log('Filtered showtimes:', filteredShowtimes);
                setShowtimes(filteredShowtimes);

                // Auto-select first showtime if none selected
                if (filteredShowtimes.length > 0 && !selectedShowtime) {
                    const firstShowtime = filteredShowtimes[0];
                    console.log('Auto-selecting first showtime:', firstShowtime);
                    setSelectedShowtime(firstShowtime._id);
                    setSelectedShowtimeDetails(firstShowtime);
                }
            } catch (err) {
                console.error('Error fetching showtimes:', err);
                setError('Failed to load showtimes');
            } finally {
                setLoading(false);
            }
        };

        if (user?.theater_id) {
            fetchShowtimes();
            // Refresh showtimes every minute
            const interval = setInterval(fetchShowtimes, 60000);
            return () => clearInterval(interval);
        } else if (!user) {
            navigate('/');
        } else {
            setError('No theater associated with your account');
        }
    }, [user, navigate]);

    // Add a check for authentication in useEffect
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                await api.get('/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (err) {
                console.error('Auth check failed:', err);
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);

    if (loading) {
        return <div className="loading">Loading showtimes...</div>;
    }

    return (
        <div className="qr-scanner-container">
            <h1>Ticket Scanner</h1>
            
            <div className="showtime-selector">
                <label htmlFor="showtime">Select Current Show:</label>
                <select 
                    id="showtime"
                    value={selectedShowtime}
                    onChange={handleShowtimeChange}
                >
                    <option value="">Select a showtime</option>
                    {showtimes.map(showtime => (
                        <option key={showtime._id} value={showtime._id}>
                            {showtime.movie_title} - {moment(showtime.start_time).tz(TARGET_TIMEZONE).format('h:mm A')}
                        </option>
                    ))}
                </select>
            </div>

            {cameras.length > 0 && (
                <div className="camera-selector">
                    <label htmlFor="camera">Select Camera:</label>
                    <select
                        id="camera"
                        value={selectedCamera}
                        onChange={handleCameraChange}
                    >
                        {cameras.map((camera) => (
                            <option key={camera.id} value={camera.id}>
                                {camera.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedShowtimeDetails && (
                <div className="selected-showtime">
                    <h3>Selected Show:</h3>
                    <p>{selectedShowtimeDetails.movie_title}</p>
                    <p>{moment(selectedShowtimeDetails.start_time).tz(TARGET_TIMEZONE).format('h:mm A')}</p>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="scanner-wrapper">
                <div id="qr-reader"></div>
                {scanning && !scanCooldown && !scanResult && (
                    <div className="scanner-status">
                        Ready to scan... Please show a QR code
                    </div>
                )}
                {scanCooldown && !scanResult && (
                    <div className="scanner-cooldown">Processing ticket...</div>
                )}
                {!selectedShowtime && (
                    <div className="scanner-message">Please select a showtime to start scanning</div>
                )}
            </div>

            {scanResult && (
                <div className="scan-result">
                    <h3>Ticket Details</h3>
                    <p><strong>Movie:</strong> {scanResult.movie_title}</p>
                    <p><strong>Showtime:</strong> {moment(scanResult.start_time).tz(TARGET_TIMEZONE).format('h:mm A')}</p>
                    <p><strong>Seats:</strong> {scanResult.seat_numbers?.join(', ') || 'N/A'}</p>
                    <p><strong>Customer:</strong> {scanResult.user_name}</p>
                    <p><strong>Status:</strong> <span className="status-accepted">Accepted</span></p>
                    <button 
                        className="scan-next-button"
                        onClick={handleRestartScanning}
                    >
                        Scan Next Ticket
                    </button>
                </div>
            )}
        </div>
    );
};

export default QRScanner; 