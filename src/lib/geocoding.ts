import api from '@/lib/api'

// Location search, from Google through itin (which holds the key). Picking
// a suggestion looks up its city, country and pin; passing the same session
// to both makes Google bill the typing and the pick as one search.

export interface LocationSuggestion {
  placeId: string
  label: string
}

export interface GeocodeResult {
  label: string
  city?: string
  country?: string
  lat: number
  lon: number
}

interface PlaceSuggestion {
  place_id: string
  name: string
  area: string | null
}

interface PlaceLocation {
  place_id: string
  latitude: number
  longitude: number
  address: string | null
  city: string | null
  country: string | null
}

export const newLocationSession = () => crypto.randomUUID()

export async function searchLocation(query: string, session: string): Promise<LocationSuggestion[]> {
  // itin needs three letters before it asks Google.
  if (query.trim().length < 3) return []
  const { data } = await api.get<PlaceSuggestion[]>('/admin/geo/places/autocomplete', {
    params: { q: query.trim(), session },
  })
  return data.map((p) => ({ placeId: p.place_id, label: p.area ? `${p.name}, ${p.area}` : p.name }))
}

export async function placeDetails(suggestion: LocationSuggestion, session: string): Promise<GeocodeResult> {
  const { data } = await api.get<PlaceLocation>(`/admin/geo/places/${encodeURIComponent(suggestion.placeId)}`, {
    params: { session },
  })
  return {
    label: suggestion.label,
    city: data.city ?? undefined,
    country: data.country ?? undefined,
    lat: data.latitude,
    lon: data.longitude,
  }
}
