"use client"

import { MapContainer, TileLayer, Marker, Popup, useMapEvent, useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Komponen untuk peta, menerima props untuk mengubah longitude dan latitude
const MapComponent = ({
  onLocationSelect,
  latLng,
  isEditing,
  isAddMode
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  latLng: [number, number]; // menambahkan latLng untuk mengontrol lokasi
  isEditing: boolean;
  isAddMode: boolean;
}) => {
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState(10); // Menyimpan zoom level
  
  // Update posisi jika latLng berubah
  useEffect(() => {
    if (latLng) {
      setPosition(latLng); // Set new position based on latLng prop
    }
  }, [latLng]);

  // Mendengarkan klik di peta dan mengubah posisi
  const LocationMarker = () => {
    const map = useMap(); // Access the map instance

    useEffect(() => {
      if (position) {
        map.setView(position, zoom); // Set the map center and zoom level
      }
    }, [position, map, zoom]);

    // Event listener untuk geser peta (dragging)
    useMapEvent('drag', () => {
      if (!isEditing && !isAddMode) return; // Cegah perubahan lokasi jika tidak dalam mode tambah atau edit

      const center = map.getCenter(); // Ambil posisi tengah
      setPosition([center.lat, center.lng]); // Update posisi marker
    });

    useMapEvent('dragend', () => {
      if (!isEditing && !isAddMode) return; // Cegah perubahan lokasi jika tidak dalam mode tambah atau edit

      const marker = map.getCenter(); // Dapatkan posisi baru dari marker
      const lat = marker.lat;
      const lng = marker.lng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng); // Kirim ke parent component
    });

    useMapEvent('click', (e) => {
      if (!isEditing && !isAddMode) return; // Cegah perubahan lokasi jika tidak dalam mode tambah atau edit

      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng); // Kirim ke parent component
    });

    // Menangani perubahan zoom level
    useMapEvent('zoomend', () => {
      setZoom(map.getZoom()); // Simpan zoom level saat zoom diubah
    });

    const customIcon = new L.Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png', // Ganti dengan URL gambar ikon kustom
      iconSize: [25, 41], // Ukuran ikon
      iconAnchor: [12, 41], // Anchor titik ikon (di mana peta berhubungan dengan marker)
      popupAnchor: [1, -34], // Anchor popup jika ada
    });
    
    return position === null ? null : (
      <Marker position={position} icon={customIcon}>
        <Popup>
          Latitude: {position[0]}, Longitude: {position[1]}
        </Popup>
      </Marker>
    );
  };

  return (
    <MapContainer center={position} zoom={zoom} style={{ height: '70%', width: '100%' }}>
      <TileLayer 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker />
    </MapContainer>
  );
};

export default MapComponent;