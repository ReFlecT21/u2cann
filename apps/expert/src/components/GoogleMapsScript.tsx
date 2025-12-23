"use client";

import { useEffect } from "react";
import { useLoadScript } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

export function GoogleMapsScript() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    if (isLoaded) {
      console.log("✅ Google Maps loaded successfully");
    }
    if (loadError) {
      console.error("❌ Error loading Google Maps:", loadError);
    }
  }, [isLoaded, loadError]);

  return null;
}