"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@adh/ui/ui/input";
import { useLoadScript } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

// Add styles to fix z-index issues with the autocomplete dropdown
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    .pac-container {
      z-index: 9999 !important;
    }
  `;
  document.head.appendChild(style);
}

interface AddressAutocompleteProps {
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

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter address",
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled) return;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        fields: ["formatted_address", "geometry", "name"],
        componentRestrictions: { country: "sg" }, // Restrict to Singapore
      }
    );

    // Prevent clicks on the autocomplete dropdown from bubbling up
    const preventDialogClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.pac-container')) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    // Add event listener to capture clicks before they reach the dialog
    document.addEventListener('mousedown', preventDialogClose, true);
    document.addEventListener('click', preventDialogClose, true);

    // Add place changed listener
    const listener = autocompleteRef.current.addListener(
      "place_changed",
      () => {
        console.log("🔥 Place changed event fired!");
        const place = autocompleteRef.current?.getPlace();
        console.log("📍 Place data:", place);

        if (place) {
          const address = place.formatted_address || place.name || "";
          console.log("📬 Address extracted:", address);

          if (address) {
            console.log("✅ Setting input value to:", address);
            setInputValue(address);
            onChange(address);

            if (place.geometry?.location && onPlaceSelect) {
              const latitude = place.geometry.location.lat();
              const longitude = place.geometry.location.lng();
              console.log("🌍 Coordinates found:", { latitude, longitude });

              onPlaceSelect({
                address,
                latitude,
                longitude,
              });
            } else if (onPlaceSelect && address) {
              console.log("⚠️ No coordinates, but setting address");
              // Even without coordinates, update the address
              onPlaceSelect({
                address,
                latitude: 0,
                longitude: 0,
              });
            }
          } else {
            console.log("❌ No address found in place data");
          }
        } else {
          console.log("❌ No place data received");
        }
      }
    );

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
      document.removeEventListener('mousedown', preventDialogClose, true);
      document.removeEventListener('click', preventDialogClose, true);
    };
  }, [isLoaded, onChange, onPlaceSelect, disabled]);

  if (loadError) {
    return (
      <Input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }

  if (!isLoaded) {
    return <Input placeholder="Loading..." disabled />;
  }

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
