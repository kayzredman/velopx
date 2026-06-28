/** Normalize delivery rows for mobile clients expecting nested location objects. */
export function shapeDelivery<T extends Record<string, unknown>>(delivery: T) {
  const d = delivery as {
    driverLat?: number | null
    driverLng?: number | null
    destLat?: number | null
    destLng?: number | null
    destAddress?: string | null
    sourceLat?: number | null
    sourceLng?: number | null
    sourceAddress?: string | null
  }

  return {
    ...delivery,
    driverLocation:
      d.driverLat != null && d.driverLng != null
        ? { lat: d.driverLat, lng: d.driverLng }
        : null,
    destination:
      d.destLat != null && d.destLng != null
        ? { lat: d.destLat, lng: d.destLng, address: d.destAddress ?? null }
        : null,
    source:
      d.sourceLat != null && d.sourceLng != null
        ? { lat: d.sourceLat, lng: d.sourceLng, address: d.sourceAddress ?? null }
        : null,
    estimatedMinutes: null,
    distanceKm: null,
  }
}
