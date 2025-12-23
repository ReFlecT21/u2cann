"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@adh/ui/ui/input";
import { Button } from "@adh/ui/ui/button";
import { Search, MapPin } from "lucide-react";
import { toast } from "sonner";

interface AddressAutocompleteSimpleProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (place: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

export function AddressAutocompleteSimple({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter address or postal code",
  disabled = false,
}: AddressAutocompleteSimpleProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
      console.warn("Google Maps not loaded, using manual input only");
      return;
    }

    try {
      const service = new google.maps.places.AutocompleteService();

      service.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: "sg" },
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(
              predictions.map(p => ({
                description: p.description,
                place_id: p.place_id,
              }))
            );
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        }
      );
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  }, []);

  const getPlaceDetails = useCallback(async (placeId: string) => {
    if (typeof google === 'undefined' || !google.maps) {
      return;
    }

    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    );

    service.getDetails(
      {
        placeId,
        fields: ['formatted_address', 'geometry'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const address = place.formatted_address || "";
          setInputValue(address);
          onChange(address);

          if (place.geometry?.location && onPlaceSelect) {
            onPlaceSelect({
              address,
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            });
          }
        }
      }
    );
  }, [onChange, onPlaceSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    fetchSuggestions(newValue);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    setInputValue(suggestion.description);
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    getPlaceDetails(suggestion.place_id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click events to fire
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const geocodeManualAddress = async () => {
    if (!inputValue || typeof google === 'undefined' || !google.maps) {
      toast.error("Please enter an address");
      return;
    }

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
      {
        address: inputValue,
        componentRestrictions: { country: "sg" }
      },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          const address = result.formatted_address;

          setInputValue(address);
          onChange(address);

          if (result.geometry?.location && onPlaceSelect) {
            onPlaceSelect({
              address,
              latitude: result.geometry.location.lat(),
              longitude: result.geometry.location.lng(),
            });
            toast.success("Location found!");
          }
        } else {
          toast.error("Could not find this address in Singapore");
        }
      }
    );
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => inputValue && fetchSuggestions(inputValue)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-8"
          />
          <MapPin className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={geocodeManualAddress}
          disabled={disabled}
          title="Search address"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 text-sm ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                handleSuggestionClick(suggestion);
              }}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{suggestion.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Type an address or postal code. Press Search button to locate.
      </p>
    </div>
  );
}