'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons that get broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const sourceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface LatLng { lat: number; lng: number }

interface Props {
  driverLocation: LatLng | null
  destination: LatLng | null
  source: LatLng | null
  deliveryId: string
  driverName: string | null
  buyerName: string | null
}

function Recenter({ center }: { center: LatLng }) {
  const map = useMap()
  useEffect(() => { map.setView([center.lat, center.lng], map.getZoom()) }, [center, map])
  return null
}

export default function DeliveryMap({ driverLocation, destination, source, driverName, buyerName }: Props) {
  // Default center: prefer source > dest > driver > Accra fallback
  const center: LatLng = driverLocation ?? source ?? destination ?? { lat: 5.6037, lng: -0.187 }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {source && (
        <Marker position={[source.lat, source.lng]} icon={sourceIcon}>
          <Popup>📦 Pickup: {driverName ? `${driverName}'s warehouse` : 'Dealer Warehouse'}</Popup>
        </Marker>
      )}
      {driverLocation && (
        <>
          <Recenter center={driverLocation} />
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>🚗 {driverName ?? 'Driver'}</Popup>
          </Marker>
        </>
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
          <Popup>📍 Drop-off: {buyerName ?? 'Buyer'}</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
