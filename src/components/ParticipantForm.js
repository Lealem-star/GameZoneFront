import React, { useState, useEffect, useRef } from 'react';
import { getAllParticipants } from '../services/api';

const ParticipantForm = ({ onSubmit, showSuggestions: propShowSuggestions = true }) => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsState, setShowSuggestionsState] = useState(false);
  const [recentParticipants, setRecentParticipants] = useState([]);
  const nameInputRef = useRef(null);

  // Fetch all participants when component mounts
  useEffect(() => {
    // Only fetch participants if suggestions are enabled
    if (propShowSuggestions) {
      // Get all participants for autocomplete suggestions
      getAllParticipants()
        .then(data => {
          // Create a unique list of participant names
          const uniqueNames = [...new Set(data.map(p => p.name))];
          setRecentParticipants(uniqueNames);
        })
        .catch(err => console.error('Error fetching participants for suggestions:', err));
    }
  }, [propShowSuggestions]);

  // Handle name input changes and show suggestions
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    
    if (value.length > 0) {
      // Filter suggestions based on input
      const filtered = recentParticipants.filter(p => 
        p.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestionsState(propShowSuggestions && filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestionsState(false);
    }
  };
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    // Set the name state with the full suggestion
    setName(suggestion);
    // Update the input value directly to ensure it's set correctly
    if (nameInputRef.current) {
      nameInputRef.current.value = suggestion;
    }
    // Hide suggestions immediately
    setShowSuggestionsState(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (!photo) {
      alert('Please select a photo.');
      setSubmitting(false);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onSubmit({ name, photoURL: reader.result });
      setSubmitting(false);
    };
    reader.readAsDataURL(photo);
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold">Collect Participant Information</h3>
      <form className="bg-white p-4 rounded shadow" onSubmit={handleSubmit}>
        <div className="relative mb-2">
          <input 
            type="text" 
            placeholder="Participant Name" 
            value={name} 
            onChange={handleNameChange} 
            onFocus={() => name.length > 0 && propShowSuggestions && setSuggestions(recentParticipants.filter(p => p.toLowerCase().includes(name.toLowerCase())))} 
            onBlur={() => setTimeout(() => setShowSuggestionsState(false), 300)} 
            required 
            className="border p-2 w-full rounded" 
            ref={nameInputRef}
          />
          {propShowSuggestions && showSuggestionsState && suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="p-2 hover:bg-blue-100 cursor-pointer" 
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur event from firing
                    handleSelectSuggestion(suggestion);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} required className="border p-2 mb-2 w-full" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" disabled={submitting}>{submitting ? 'Adding...' : 'Add Participant'}</button>
      </form>
    </div>
  );
};

export default ParticipantForm;
