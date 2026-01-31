'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'

interface Place {
  placeId: string
  name: string
  address: string
  city: string
  postalCode: string
  country: string
  coordinates: { lat: number; lng: number }
}

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: Place) => void
  placeholder?: string
  restaurantName?: string
}

declare global {
  interface Window {
    google?: typeof google
  }
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search for your restaurant...',
  restaurantName
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(true)

  // Memoize the callback to prevent infinite loops
  const handlePlaceSelect = useCallback((place: Place) => {
    onPlaceSelect(place)
  }, [onPlaceSelect])

  // Load Google Places script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      console.log('[PlacesAutocomplete] No Google Places API key configured')
      setHasApiKey(false)
      return
    }

    if (window.google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    setIsLoading(true)
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = () => {
      setIsLoaded(true)
      setIsLoading(false)
    }
    script.onerror = () => {
      console.error('[PlacesAutocomplete] Failed to load Google Maps script')
      setIsLoading(false)
      setHasApiKey(false)
    }
    document.head.appendChild(script)

    return () => {
      // Don't remove script on cleanup - it might be used by other components
    }
  }, [])

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) return

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'],
      componentRestrictions: { country: ['nl', 'be', 'de'] }, // NL, Belgium, Germany
      fields: ['place_id', 'name', 'formatted_address', 'address_components', 'geometry'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.place_id) return

      // Extract address components
      const addressComponents = place.address_components || []
      let city = ''
      let postalCode = ''
      let country = ''

      addressComponents.forEach((component) => {
        if (component.types.includes('locality')) {
          city = component.long_name
        }
        if (component.types.includes('postal_code')) {
          postalCode = component.long_name
        }
        if (component.types.includes('country')) {
          country = component.long_name
        }
      })

      handlePlaceSelect({
        placeId: place.place_id,
        name: place.name || '',
        address: place.formatted_address || '',
        city,
        postalCode,
        country,
        coordinates: {
          lat: place.geometry?.location?.lat() || 0,
          lng: place.geometry?.location?.lng() || 0,
        },
      })
    })

    autocompleteRef.current = autocomplete
  }, [isLoaded, handlePlaceSelect])

  // Auto-search when restaurant name is provided
  useEffect(() => {
    if (restaurantName && isLoaded && inputRef.current && !value) {
      const searchValue = restaurantName + ' restaurant'
      inputRef.current.value = searchValue
      onChange(searchValue)
    }
  }, [restaurantName, isLoaded, onChange, value])

  // If no API key, show manual entry message
  if (!hasApiKey) {
    return (
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1a1a]/40" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your address manually"
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition"
          />
        </div>
        <p className="mt-2 text-xs text-[#1a1a1a]/40">
          Address autocomplete unavailable. Please enter manually.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1a1a]/40" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition"
        />
        {isLoading ? (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1a1a]/40 animate-spin" />
        ) : (
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1a1a]/40" />
        )}
      </div>

      {!isLoaded && isLoading && (
        <p className="mt-2 text-xs text-[#1a1a1a]/40">
          Loading location services...
        </p>
      )}
    </div>
  )
}
