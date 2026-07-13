export interface GeocodeResult {
  label: string
  city?: string
  country?: string
  lat: number
  lon: number
}

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  country?: string
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

// Swappable geocoding backend. Nominatim today (no key, ~1 req/sec usage
// policy — fine for this low-volume admin tool); swap the implementation
// for Google Places Autocomplete later without touching callers.
export async function searchLocation(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return []

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '5')
  url.searchParams.set('q', query)

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('Location search failed')

  const results = (await response.json()) as NominatimResult[]
  return results.map((r) => ({
    label: r.display_name,
    city: r.address?.city ?? r.address?.town ?? r.address?.village,
    country: r.address?.country,
    lat: Number(r.lat),
    lon: Number(r.lon),
  }))
}
