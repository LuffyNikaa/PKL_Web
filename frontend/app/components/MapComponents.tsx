"use client"

import { MapContainer, TileLayer, Marker, Popup, useMapEvent, useMap } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
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
  // Gunakan nilai awal sebagai ref sehingga MapContainer tidak di-reset saat state berubah
  const initialCenter = useRef<[number, number]>(latLng || [-7.250445, 112.768845]);
  const initialZoom = useRef<number>(10);

  const [position, setPosition] = useState<[number, number]>(initialCenter.current);
  const [zoom, setZoom] = useState<number>(initialZoom.current);

  // Hanya update posisi internal jika prop latLng benar-benar berubah
  const prevLatLng = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (!latLng) return;
    const [lat, lng] = latLng;
    const prev = prevLatLng.current;
    if (!prev || prev[0] !== lat || prev[1] !== lng) {
      setPosition(latLng);
      prevLatLng.current = latLng;
    }
  }, [latLng]);

  // Mendengarkan klik di peta dan mengubah posisi
  const LocationMarker = () => {
    const map = useMap(); // Access the map instance

    useEffect(() => {
      if (position) {
        // Pan to the new position to preserve current zoom and avoid full reload
        map.panTo(position);
      }
    }, [position, map]);

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

    // Simpan state peta (center + zoom) setelah interaksi selesai, untuk restore jika peta ter-mount ulang
    useMapEvent('moveend', () => {
      try {
        const c = map.getCenter();
        const z = map.getZoom();
        const state = { center: [c.lat, c.lng], zoom: z };
        sessionStorage.setItem('map_state_dudi', JSON.stringify(state));
      } catch (e) {
        // ignore
      }
    });

    // Saat komponen peta pertama kali di-mount, restore view dari sessionStorage jika ada
    useEffect(() => {
      try {
        const raw = sessionStorage.getItem('map_state_dudi');
        if (raw) {
          const s = JSON.parse(raw);
          if (s && Array.isArray(s.center) && typeof s.zoom === 'number') {
            map.setView(s.center, s.zoom);
          }
        }
      } catch (e) {
        // ignore
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Inline SVG marker untuk menghindari permintaan CDN (tracking prevention)
    const svg = encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='30' height='42' viewBox='0 0 30 42'><path d='M15 0 C9 0 4 5 4 11 C4 23 15 42 15 42 C15 42 26 23 26 11 C26 5 21 0 15 0 Z' fill='%232563EB'/><circle cx='15' cy='11' r='4' fill='white'/></svg>");
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${svg}`;
    const customIcon = new L.Icon({
      iconUrl,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [1, -34],
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
    <MapContainer center={initialCenter.current} zoom={initialZoom.current} style={{ height: '70%', width: '100%' }}>
      <TileLayer 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker />
    </MapContainer>
  );
};

export default MapComponent;