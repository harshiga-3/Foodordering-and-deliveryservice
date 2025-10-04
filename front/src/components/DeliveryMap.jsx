import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DeliveryMap = ({ restaurantLatLng, deliveryLatLng, courierLatLng, onDistanceEta }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const routeRef = useRef(null);
  const animRef = useRef({ raf: null, from: null, to: null, start: 0, duration: 1000 });

  useEffect(() => {
    // Fix default icon paths under Vite
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2xUrl,
      iconUrl: markerIconUrl,
      shadowUrl: markerShadowUrl
    });

    // Create map once using a dedicated DOM node
    if (!mapRef.current && containerRef.current) {
      const map = L.map(containerRef.current, {
        center: [restaurantLatLng?.lat || 0, restaurantLatLng?.lng || 0],
        zoom: 13,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;

    // Helper to ensure or update marker
    const ensureMarker = (key, latlng, options) => {
      if (!latlng) return;
      if (!markersRef.current[key]) {
        markersRef.current[key] = L.marker([latlng.lat, latlng.lng], options).addTo(map);
      } else {
        markersRef.current[key].setLatLng([latlng.lat, latlng.lng]);
      }
    };

    // Static markers (restaurant, customer)
    ensureMarker('restaurant', restaurantLatLng, { title: 'Restaurant' });
    ensureMarker('customer', deliveryLatLng, { title: 'Customer' });
    if (courierLatLng) ensureMarker('courier', courierLatLng, { title: 'Delivery' });

    // Fit bounds
    const points = [restaurantLatLng, deliveryLatLng, courierLatLng].filter(Boolean).map(p => [p.lat, p.lng]);
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    // Simple ETA based on haversine distance and avg speed 25km/h
    const distanceKm = (a, b) => {
      if (!a || !b) return null;
      const R = 6371;
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLng = (b.lng - a.lng) * Math.PI / 180;
      const lat1 = a.lat * Math.PI / 180;
      const lat2 = b.lat * Math.PI / 180;
      const x = Math.sin(dLat/2) ** 2 + Math.sin(dLng/2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
      const d = 2 * R * Math.asin(Math.sqrt(x));
      return d;
    };

    if (onDistanceEta && courierLatLng && deliveryLatLng) {
      const km = distanceKm(courierLatLng, deliveryLatLng);
      if (km != null) {
        const hours = km / 25;
        const mins = Math.round(hours * 60);
        onDistanceEta({ distanceText: `${km.toFixed(1)} km`, durationText: `${mins} min` });
      }
    }

    // Draw a simple polyline from courier to customer
    if (routeRef.current) {
      routeRef.current.setLatLngs(courierLatLng && deliveryLatLng ? [[courierLatLng.lat, courierLatLng.lng],[deliveryLatLng.lat, deliveryLatLng.lng]] : []);
    } else if (courierLatLng && deliveryLatLng) {
      routeRef.current = L.polyline([[courierLatLng.lat, courierLatLng.lng],[deliveryLatLng.lat, deliveryLatLng.lng]], { color: 'blue' }).addTo(map);
    }

    return () => {
      // On unmount, fully destroy the map to avoid duplicate container errors (StrictMode safe)
      if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = null;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
      routeRef.current = null;
      markersRef.current = {};
    };
  }, [restaurantLatLng, deliveryLatLng, courierLatLng, onDistanceEta]);

  // Smoothly animate courier marker between updates (1s tween)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !courierLatLng) return;

    const marker = markersRef.current['courier'] || L.marker([courierLatLng.lat, courierLatLng.lng], { title: 'Delivery' }).addTo(map);
    markersRef.current['courier'] = marker;

    // Cancel any ongoing animation
    if (animRef.current.raf) {
      cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = null;
    }

    const from = animRef.current.to || { lat: marker.getLatLng().lat, lng: marker.getLatLng().lng };
    const to = { lat: courierLatLng.lat, lng: courierLatLng.lng };
    const start = performance.now();
    const duration = 1000; // ms

    const lerp = (a, b, t) => a + (b - a) * t;
    const step = (now) => {
      const u = Math.min(1, (now - start) / duration);
      const lat = lerp(from.lat, to.lat, u);
      const lng = lerp(from.lng, to.lng, u);
      marker.setLatLng([lat, lng]);

      // Update route line towards destination for visual feedback
      if (deliveryLatLng) {
        if (!routeRef.current) {
          routeRef.current = L.polyline([[lat, lng], [deliveryLatLng.lat, deliveryLatLng.lng]], { color: 'blue' }).addTo(map);
        } else {
          routeRef.current.setLatLngs([[lat, lng], [deliveryLatLng.lat, deliveryLatLng.lng]]);
        }
      }

      if (u < 1) {
        animRef.current.raf = requestAnimationFrame(step);
      } else {
        animRef.current.raf = null;
        animRef.current.from = from;
        animRef.current.to = to;
      }
    };

    animRef.current = { raf: requestAnimationFrame(step), from, to, start, duration };

    return () => {
      if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = null;
    };
  }, [courierLatLng, deliveryLatLng]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: 300, borderRadius: 8, overflow: 'hidden' }} />
  );
}

export default DeliveryMap;