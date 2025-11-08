import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse'; // Import papaparse
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import './App.css';

// --- Data (Constants) ---
const tagStyles = {
    snap: { text: "Accepts SNAP/EBT", style: { backgroundColor: '#E0F2F1', color: '#004D40' } },
    free: { text: "Free Groceries", style: { backgroundColor: '#FFF3E0', color: '#E65100' } },
    free_meal: { text: "Free Hot Meal", style: { backgroundColor: '#FFEBEE', color: '#C62828' } },
};

const availableTags = [
    { key: 'free', label: 'Free Groceries' },
    { key: 'snap', label: 'Accepts SNAP/EBT' },
    { key: 'free_meal', label: 'Free Hot Meal' },
];

const runPythonScript = (city) => {
    axios.post("http://localhost:3002/run-script", { city })
        .then(res => {
            console.log("Python output:", res.data.output);
            alert("Python script ran successfully!");
        })
        .catch(err => {
            console.error("Error running Python script:", err);
        });
};

// --- Helper function to infer tags from CSV data ---
const getTagsFromData = (item) => {
    const tags = [];
    // Ensure item.Description and item.Name are treated as strings even if null/undefined
    const description = (item.Description || '').toLowerCase();
    const name = (item.Name || '').toLowerCase();

    if (description.includes("snap") || name.includes("snap") || description.includes("ebt") || name.includes("just harvest")) {
        tags.push("snap");
    }
    if (description.includes("hot meal") || description.includes("serves meal") || name.includes("soup kitchen") || name.includes("community kitchen")) {
        tags.push("free_meal");
    }
    if (description.includes("food pantry") || name.includes("food bank") || description.includes("produce") || description.includes("groceries")) {
        tags.push("free");
    }
    // Add a default tag if none are found, as most are free resources
    if (tags.length === 0) {
        tags.push("free");
    }
    return [...new Set(tags)]; // Return unique tags
};


// --- Child Components ---

// 4. Header Component
const Header = () => (
    <header style={{
        background: 'linear-gradient(135deg, #2e7d32 0%, #4CAF50 50%, #66BB6A 100%)',
        color: 'white',
        padding: '1.25rem',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(46, 125, 50, 0.4)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
    }}>
        {/* Decorative background pattern */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
        }}></div>
        
        <div style={{ 
            position: 'relative', 
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
        }}>
            <span style={{ 
                fontSize: '2.5rem',
                animation: 'bounce 2s ease-in-out infinite',
                display: 'inline-block'
            }}>🍽️</span>
            
            <h1 style={{ 
                fontSize: '2.75rem', 
                fontWeight: 800,
                margin: 0,
                background: 'linear-gradient(45deg, #ffffff 30%, #e8f5e9 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'glow 2s ease-in-out infinite',
                letterSpacing: '2px',
                fontFamily: "'Poppins', 'Arial Black', sans-serif",
                textTransform: 'uppercase',
            }}>
                Snap Map
            </h1>
            
            <span style={{ 
                fontSize: '2.5rem',
                animation: 'bounce 2s ease-in-out 0.5s infinite',
                display: 'inline-block'
            }}>🗺️</span>
        </div>
        
        <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.95rem',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.95)',
            letterSpacing: '1px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            position: 'relative',
            zIndex: 1,
        }}>
            🌟 Your Path to Food Security 🌟
        </p>
    </header>
);

// 1. & 9. Location Form Component
// This component is now heavily modified to use Google Places Autocomplete
const LocationForm = ({ onLocate }) => {
    // We use a ref to get a direct handle on the input DOM element
    const addressInputRef = useRef(null);
    // State to hold the Autocomplete object
    const [autocomplete, setAutocomplete] = useState(null);
    // State to hold the selected place data
    const [selectedPlace, setSelectedPlace] = useState(null);
    // State for error message
    const [errorMessage, setErrorMessage] = useState("");

    // Helper function to extract city and state from Google's place object
    const getCityStateFromPlace = (place) => {
        let city = '';
        let state = '';
        if (!place.address_components) return { city, state };

        for (const component of place.address_components) {
            const types = component.types;
            if (types.includes('locality')) {
                city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
                state = component.short_name; // 'PA'
            }
        }
        return { city, state };
    };

    // This effect runs once to initialize the Autocomplete input
    useEffect(() => {
        // Check if the Google Maps script has loaded
        if (window.google && window.google.maps && window.google.maps.places) {
            
            // Create the Autocomplete instance
            const ac = new window.google.maps.places.Autocomplete(
                addressInputRef.current,
                {
                    types: ['address'], // We only want addresses, not businesses
                    componentRestrictions: { 'country': 'us' }, // Restrict to the US
                    fields: ['formatted_address', 'geometry.location', 'address_components'] // Ask for address, lat/lng, AND components
                }
            );

            // Add a listener for when the user selects an address
            ac.addListener('place_changed', () => {
                const place = ac.getPlace();
                // Check if the place has geometry (lat/lng)
                if (place.geometry && place.geometry.location) {
                    setSelectedPlace(place);
                    setErrorMessage(""); // Clear error on valid selection
                }
            });

            setAutocomplete(ac);
        }
    }, []); // Empty dependency array so this only runs once

    const handleSubmit = (e) => {
        e.preventDefault();
        // Check if a valid place was selected from the dropdown
        if (selectedPlace && selectedPlace.geometry) {
            
            const { city, state } = getCityStateFromPlace(selectedPlace);

            const locationData = {
                address: selectedPlace.formatted_address,
                lat: selectedPlace.geometry.location.lat(),
                lng: selectedPlace.geometry.location.lng(),
                city: city,
                state: state,
            };

            // Run the teammate's python script
            if (city) {
                runPythonScript(city);
            }

            // Pass the location data up to the App component
            onLocate(locationData); 
        } else {
            // Show an error message instead of alert
            setErrorMessage("Please select a valid address from the list.");
        }
    };
    
    // Common style for form inputs
    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        marginBottom: '1.25rem',
        border: '1px solid #D1D5DB', // border-gray-300
        borderRadius: '0.375rem', // rounded-md
        backgroundColor: 'white',
        fontSize: '1rem',
    };

    return (
        <div style={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '1.25rem',
            background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 50%, #fff9c4 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative circles */}
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'rgba(76, 175, 80, 0.1)',
                top: '-100px',
                left: '-100px',
            }}></div>
            <div style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'rgba(255, 152, 0, 0.1)',
                bottom: '-50px',
                right: '-50px',
            }}></div>
            
            <form onSubmit={handleSubmit} style={{
                backgroundColor: 'white',
                padding: '3rem 2.5rem',
                borderRadius: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                maxWidth: '560px',
                width: '100%',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Big Beautiful Logo */}
                <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                    padding: '2rem',
                    borderRadius: '1rem',
                    boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
                    transform: 'translateY(-10px)',
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🍽️</div>
                    <h1 style={{ 
                        fontSize: '3rem', 
                        fontWeight: 700, 
                        color: 'white',
                        margin: 0,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                        letterSpacing: '1px'
                    }}>Snap Map</h1>
                    <p style={{ 
                        color: 'rgba(255,255,255,0.95)', 
                        fontSize: '1.1rem', 
                        margin: '0.5rem 0 0 0',
                        fontWeight: 500 
                    }}>Find Food. Find Hope. Find Community.</p>
                </div>

                <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 600, 
                    textAlign: 'center', 
                    color: '#2e7d32', 
                    marginBottom: '0.75rem' 
                }}>Where are you located?</h2>
                <p style={{ 
                    textAlign: 'center', 
                    color: '#666', 
                    marginBottom: '2rem',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                }}>Enter your address to discover free food resources, pantries, and SNAP-accepting stores in your area.</p>

                <label htmlFor="road-input" style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 600, 
                    color: '#2e7d32',
                    fontSize: '1rem'
                }}>📍 Your Address</label>
                <input 
                    type="text" 
                    id="road-input" 
                    placeholder="Start typing your street address..." 
                    required 
                    style={{
                        width: '100%',
                        padding: '1rem',
                        marginBottom: '1.25rem',
                        border: '2px solid #E0E0E0',
                        borderRadius: '0.75rem',
                        backgroundColor: 'white',
                        fontSize: '1rem',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                    ref={addressInputRef}
                    onChange={() => {
                        setSelectedPlace(null);
                        setErrorMessage("");
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                    onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                />

                {errorMessage && (
                    <p style={{ 
                        color: '#C62828', 
                        fontSize: '0.875rem', 
                        textAlign: 'center', 
                        marginTop: '-1rem', 
                        marginBottom: '1rem',
                        backgroundColor: '#FFEBEE',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #FFCDD2'
                    }}>
                        {errorMessage}
                    </p>
                )}
                
                <button type="submit" style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: '0.75rem',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}
                onClick={() => runPythonScript(city)}
                onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = '#45a049';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.5)';
                }}
                onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
                }}
                >
                    🔍 Find Food Resources
                </button>
                
                {/* Trust badges */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#F5F5F5',
                    borderRadius: '0.75rem',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                        ✓ 100% Free • ✓ Confidential • ✓ No Judgment
                    </div>
                </div>
            </form>
        </div>
    );
};

// 7. Single Opportunity Card Component
// *** THIS COMPONENT IS UPDATED ***
const OpportunityCard = ({ title, address, details, tags, link }) => {
    // Create the Google Maps search URL.
    // We must URL-encode the address.
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem', // rounded-lg
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // shadow-md
            padding: '1.25rem',
            marginBottom: '1.25rem',
            borderLeft: '4px solid #00796b',
        }}>
            {/* New Header Div for Flexbox */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start', // Align to top
                marginBottom: '0.5rem'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#004D40',
                    margin: 0, // Reset margin
                    marginRight: '1rem', // Add space between title and icon
                }}>
                    {/* Make title a link ONLY if link is provided */}
                    {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                            {title}
                        </a>
                    ) : (
                        <span>{title}</span> // Just show text
                    )}
                </h3>
                {/* Map Icon Link */}
                <a 
                    href={googleMapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title="Open in Google Maps"
                    style={{
                        color: '#00796b',
                        padding: '0.25rem',
                        borderRadius: '9999px',
                        transition: 'background-color 0.2s',
                        flexShrink: 0, // Prevent icon from shrinking
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#E0F2F1'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    {/* Simple Map Pin SVG Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.757.433.62.62 0 00.28.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                    </svg>
                </a>
            </div>
            
            <p style={{ fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>{address}</p>
            <p style={{ color: '#4B5563', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{details}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {tags.map(tagKey => {
                    const tag = tagStyles[tagKey];
                    return tag ? (
                        <span key={tagKey} style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px', // rounded-full
                            ...tag.style,
                        }}>
                            {tag.text}
                        </span>
                    ) : null;
                })}
            </div>
        </div>
    );
};
// *** END OF UPDATED COMPONENT ***

// 2. & 6. Opportunities List Component
// *** THIS COMPONENT IS UPDATED ***
// It no longer defines the section, just the list
const OpportunitiesList = ({ opportunities, isLoading }) => (
    <section style={{
        flexGrow: 1, // Fill available vertical space
        padding: '1.25rem',
        overflowY: 'auto',
        backgroundColor: '#F9FAFB', // bg-gray-50
    }}>
        {/* Show loading message while fetching */}
        {isLoading ? (
            <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#4B5563', paddingTop: '2rem' }}>
                Loading resources...
            </p>
        ) : (
            // Map over the opportunities from props
            opportunities.map(op => (
                <OpportunityCard 
                    key={op.id}
                    title={op.title}
                    address={op.address}
                    details={op.details}
                    tags={op.tags}
                    link={op.link}
                />
            ))
        )}
        {/* Show message if no opportunities are found */}
        {!isLoading && opportunities.length === 0 && (
             <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#4B5563', paddingTop: '2rem' }}>
                No resources found.
            </p>
        )}
    </section>
);
// *** END OF UPDATED COMPONENT ***

// 3. Chatbot Component
const Chatbot = ({ city, state }) => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: `**Hi there! I'm SnapBot.** 👋

I can help you with:

- Finding food banks, pantries, and soup kitchens
- Locating stores that accept SNAP/EBT (including Halal/Kosher options)
- How to apply for SNAP benefits
- SNAP benefit status during government shutdowns

**What would you like to know?**` }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    // Backend API URL
    const API_URL = 'http://localhost:3001';

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Create session when component mounts
    useEffect(() => {
        createSession();
    }, []);

    // Update session when location changes
    useEffect(() => {
        if (sessionId && (city || state)) {
            updateSession();
        }
    }, [city, state, sessionId]);

    const createSession = async () => {
        try {
            const response = await fetch(`${API_URL}/api/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, state })
            });
            const data = await response.json();
            setSessionId(data.sessionId);
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const updateSession = async () => {
        if (!sessionId) return;
        try {
            await fetch(`${API_URL}/api/session/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, state })
            });
        } catch (error) {
            console.error('Failed to update session:', error);
        }
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        const userMessage = input.trim();
        if (userMessage === "" || isLoading) return;

        // Add user's message
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId,
                    city,
                    state
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chatbot');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { sender: 'bot', text: data.response }]);

            if (data.sessionId && !sessionId) {
                setSessionId(data.sessionId);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: 'I apologize, but I\'m having trouble connecting to the server. Please make sure the chatbot server is running on port 3001.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <aside style={{
            width: '30%',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
            borderLeft: '1px solid #E0E0E0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.05)',
        }}>
            {/* Fancy Header */}
            <div style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                borderRadius: '1rem',
                padding: '1.25rem',
                marginBottom: '1rem',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                }}>
                    <div style={{ 
                        fontSize: '2rem', 
                        marginRight: '0.5rem',
                        animation: 'bounce 2s infinite'
                    }}>🤖</div>
                    <h3 style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 700, 
                        color: 'white',
                        margin: 0,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                    }}>SnapBot</h3>
                </div>
                <p style={{
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    margin: 0,
                    fontWeight: 500
                }}>Your Food Assistance Guide</p>
            </div>
            
            {/* Messages Container */}
            <div style={{
                flexGrow: 1,
                backgroundColor: 'white',
                border: '2px solid #E8F5E9',
                borderRadius: '1rem',
                padding: '1rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1rem',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03)',
            }}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            padding: '0.875rem 1rem',
                            borderRadius: '1rem',
                            maxWidth: '85%',
                            fontSize: '0.9rem',
                            lineHeight: '1.4',
                            wordBreak: 'break-word',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                            ...(msg.sender === 'user'
                                ? { 
                                    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                                    color: 'white', 
                                    alignSelf: 'flex-end', 
                                    whiteSpace: 'pre-wrap',
                                    borderBottomRightRadius: '0.25rem'
                                }
                                : { 
                                    backgroundColor: '#F5F5F5', 
                                    color: '#333',
                                    alignSelf: 'flex-start',
                                    border: '1px solid #E0E0E0',
                                    borderBottomLeftRadius: '0.25rem'
                                }
                            )
                        }}
                        className={msg.sender === 'bot' ? 'markdown-content' : ''}
                    >
                        {msg.sender === 'bot' ? (
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        ) : (
                            msg.text
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div style={{
                        padding: '0.875rem 1rem',
                        borderRadius: '1rem',
                        backgroundColor: '#F5F5F5',
                        alignSelf: 'flex-start',
                        fontSize: '0.9rem',
                        border: '1px solid #E0E0E0',
                        display: 'flex',
                        gap: '0.25rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    }}>
                        <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>●</span>
                        <span style={{ animation: 'pulse 1.5s ease-in-out 0.2s infinite' }}>●</span>
                        <span style={{ animation: 'pulse 1.5s ease-in-out 0.4s infinite' }}>●</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleChatSubmit} style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                flexShrink: 0,
                alignItems: 'center'
            }}>
                <div style={{ 
                    flexGrow: 1, 
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: '9999px',
                }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            border: '2px solid #E0E0E0',
                            borderRadius: '9999px',
                            padding: '0.75rem 1.25rem',
                            outline: 'none',
                            fontSize: '0.95rem',
                            transition: 'all 0.3s',
                            backgroundColor: 'white',
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#4CAF50';
                            e.target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#E0E0E0';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>
                <button type="submit" style={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                    color: 'white',
                    borderRadius: '9999px',
                    width: '3rem',
                    height: '3rem',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                }}
                onMouseOver={e => {
                    e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.5)';
                }}
                onMouseOut={e => {
                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
                }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                </button>
            </form>
        </aside>
    );
};

// --- NEW COMPONENT: UploadModal ---
const UploadModal = ({ onClose, onSubmit }) => {
    // State for the form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [url, setUrl] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    
    // Google Autocomplete state
    const addressInputRef = useRef(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);

    // Initialize Google Autocomplete
    useEffect(() => {
        if (window.google && window.google.maps && window.google.maps.places && addressInputRef.current) {
            const ac = new window.google.maps.places.Autocomplete(
                addressInputRef.current,
                {
                    types: ['address'],
                    componentRestrictions: { 'country': 'us' },
                    fields: ['formatted_address']
                }
            );
            ac.addListener('place_changed', () => {
                const place = ac.getPlace();
                if (place.formatted_address) {
                    setSelectedPlace(place);
                    setErrorMessage(""); // Clear error
                }
            });
            setAutocomplete(ac);
        }
    }, [addressInputRef]); // Run when the ref is available

    // Handle tag checkbox changes
    const handleTagChange = (tagKey) => {
        setSelectedTags(prevTags => 
            prevTags.includes(tagKey)
                ? prevTags.filter(t => t !== tagKey) // Remove tag
                : [...prevTags, tagKey] // Add tag
        );
    };

    // Helper function to validate URL
    const isValidUrl = (string) => {
        if (!string) return true; // URL is optional, so empty string is valid
        try {
            const url = new URL(string);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch (_) {
            return false;
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validation
        if (!name) {
            setErrorMessage("Please enter a name.");
            return;
        }
        if (!selectedPlace) {
            setErrorMessage("Please select a valid address from the dropdown.");
            return;
        }
        if (!description) {
            setErrorMessage("Please enter a description.");
            return;
        }
        if (selectedTags.length === 0) {
            setErrorMessage("Please select at least one tag.");
            return;
        }
        if (url && !isValidUrl(url)) {
            setErrorMessage("Please enter a valid URL (e.g., https://example.com) or leave it blank.");
            return;
        }
        
        // Clear error and submit
        setErrorMessage("");
        onSubmit({
            id: Date.now(), // Create a simple unique ID for the demo
            name,
            address: selectedPlace.formatted_address,
            description,
            tags: selectedTags,
            link: url || null, // Use the provided URL or null if empty
        });
    };

    // Common style for form inputs
    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        marginBottom: '1rem',
        border: '1px solid #D1D5DB', // border-gray-300
        borderRadius: '0.375rem', // rounded-md
        backgroundColor: 'white',
        fontSize: '1rem',
    };
    
    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 500,
        color: '#374151'
    };

    return (
        // Modal Overlay
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
        }}
            onClick={onClose} // Close modal on overlay click
        >
            {/* Modal Content */}
            <div
                style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    maxWidth: '512px',
                    width: '100%',
                    maxHeight: '90vh', // Make modal scrollable
                    overflowY: 'auto',
                }}
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: 500, color: '#00796b', margin: 0 }}>
                        Upload an Opportunity
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            color: '#9CA3AF',
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <label htmlFor="opp-name" style={labelStyle}>Name of the opportunity</label>
                    <input
                        type="text"
                        id="opp-name"
                        style={inputStyle}
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />

                    <label htmlFor="opp-address" style={labelStyle}>Address</label>
                    <input
                        type="text"
                        id="opp-address"
                        style={inputStyle}
                        ref={addressInputRef}
                        placeholder="Start typing a valid address..."
                        onChange={() => setSelectedPlace(null)} // Clear place on manual change
                    />

                    <label htmlFor="opp-desc" style={labelStyle}>Description</label>
                    <textarea
                        id="opp-desc"
                        rows="4"
                        style={inputStyle}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />

                    <label htmlFor="opp-url" style={labelStyle}>Website URL (Optional)</label>
                    <input
                        type="text"
                        id="opp-url"
                        style={inputStyle}
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://example.com"
                    />

                    <label style={labelStyle}>Tags</label>
                    <div style={{ marginBottom: '1.5rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', padding: '1rem' }}>
                        {availableTags.map(tag => (
                            <div key={tag.key} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id={`tag-${tag.key}`}
                                    checked={selectedTags.includes(tag.key)}
                                    onChange={() => handleTagChange(tag.key)}
                                    style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }}
                                />
                                <label htmlFor={`tag-${tag.key}`} style={{ fontWeight: 400, color: '#374151' }}>
                                    {tag.label}
                                </label>
                            </div>
                        ))}
                    </div>
                    
                    {errorMessage && (
                        <p style={{ color: '#C62828', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>
                            {errorMessage}
                        </p>
                    )}

                    <button type="submit" style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#00796b',
                        color: 'white',
                        borderRadius: '0.375rem',
                        fontWeight: 500,
                        fontSize: '1.125rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#004D40'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#00796b'}
                    >
                        Add Opportunity
                    </button>
                </form>
            </div>
        </div>
    );
};
// --- END OF NEW COMPONENT ---

// 5. Main Content Component (70/30 split)
// *** THIS COMPONENT IS UPDATED ***
// It now manages the modal and the upload button
const MainContent = ({ city, state }) => {
    const [opportunities, setOpportunities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // State for the new upload modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetch('/food_opportunities_export.csv')
            .then(response => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.text();
            })
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.data) {
                            const formattedData = results.data.map(item => {
                                // Try to extract the city from the CSV row
                                let itemCity = '';
                                if (item.City) {
                                    itemCity = item.City.trim().toLowerCase();
                                } else if (item.Location) {
                                    // Fallback: try to parse city name from address string
                                    const parts = item.Location.split(',');
                                    if (parts.length > 1) itemCity = parts[parts.length - 2].trim().toLowerCase();
                                }

                                return {
                                    id: item.ID,
                                    title: item.Name,
                                    address: item.Location ? item.Location.replace(/"/g, '') : 'N/A',
                                    details: item.Description ? item.Description.replace(/"/g, '') : 'No details provided.',
                                    link: item.Link,
                                    tags: getTagsFromData(item),
                                    city: itemCity
                                };
                            });

                            // Filter by user’s city (case-insensitive)
                            const filteredData = formattedData.filter(op =>
                                op.city && op.city === city.toLowerCase()
                            );

                            setOpportunities(filteredData);
                        } else {
                            setOpportunities([]);
                        }
                        setIsLoading(false);
                    },
                    error: (error) => {
                        console.error("Error parsing CSV:", error);
                        setIsLoading(false);
                    }
                });
            })
            .catch(error => {
                console.error("Error fetching or parsing CSV:", error);
                setIsLoading(false);
            });
    }, []); // The empty array [] means this effect runs once when the component mounts

    // Function to handle the new opportunity submission from the modal
    const handleUpload = (dataFromModal) => {
        const newOpportunity = {
            id: dataFromModal.id,
            title: dataFromModal.name,
            address: dataFromModal.address,
            details: dataFromModal.description,
            tags: dataFromModal.tags,
            link: dataFromModal.link,
        };
        // Add the new opportunity to the TOP of the list
        setOpportunities(prevOpportunities => [newOpportunity, ...prevOpportunities]);
        setIsModalOpen(false); // Close the modal
    };// refetch if city changes

    return (
        <>
            <main style={{
                display: 'flex',
                flexGrow: 1,
                overflow: 'hidden',
                // Calculate height to fill screen minus header
                height: 'calc(100vh - 53px)', // Assuming header is 53px
            }}>
                {/* New 70% wrapper for list + upload button */}
                <div style={{ width: '70%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header bar for the "Upload" button */}
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid #D1D5DB',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                backgroundColor: '#00796b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 1rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#004D40'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#00796b'}
                        >
                            + Upload opportunities
                        </button>
                    </div>
                    
                    {/* Pass the loaded data and loading state to the list */}
                    <OpportunitiesList opportunities={opportunities} isLoading={isLoading} />
                </div>
                
                {/* Pass location to chatbot */}
                <Chatbot city={city} state={state} />
            </main>
            
            {/* Render the modal component conditionally (outside of main) */}
            {isModalOpen && (
                <UploadModal
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleUpload}
                />
            )}
        </>
    );
};


// --- Main App Component ---
export default function App() {
    const [view, setView] = useState('form'); // 'form' or 'results'
    const [userCity, setUserCity] = useState('');
    const [userState, setUserState] = useState('');

    // This function will be passed down to LocationForm
    const handleLocate = (locationData) => {
        console.log("User's location:", locationData);
        setUserCity(locationData.city); // Save the user's city
        setUserState(locationData.state); // Save the user's state
        setView('results'); // Switch to the results view
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
            <Header />

            {view === 'form' ? (
                <LocationForm onLocate={handleLocate} />
            ) : (
                <MainContent city={userCity} state={userState} />
            )}
        </div>
    );
}