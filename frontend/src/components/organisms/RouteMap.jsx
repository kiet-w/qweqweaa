'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import polyline from '@mapbox/polyline';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function RouteMap({ warehouse, stops = [], geometry }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // fits the app dark theme perfectly
      center: warehouse && warehouse.lng && warehouse.lat ? [warehouse.lng, warehouse.lat] : [105.8342, 21.0278], // default Hanoi
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMapData = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Clear existing route layer & source
    if (map.getLayer('route')) map.removeLayer('route');
    if (map.getSource('route')) map.removeSource('route');

    const coordinates = [];

    // Add warehouse marker
    if (warehouse && warehouse.lat && warehouse.lng) {
      const el = document.createElement('div');
      el.className = 'map-marker-warehouse';
      el.style.backgroundColor = '#8b5cf6';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid #fff';
      el.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.8)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="color: #0f1117; padding: 4px; font-family: sans-serif;">
          <strong style="font-size: 14px; color: #1e293b;">Kho: ${warehouse.name}</strong>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${warehouse.address}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([warehouse.lng, warehouse.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      coordinates.push([warehouse.lng, warehouse.lat]);
    }

    // Sort stops by sequenceOrder if available, otherwise just use index
    const sortedStops = [...stops].sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

    // Add stop markers
    sortedStops.forEach((stop, index) => {
      const order = stop.order;
      if (!order || !order.lat || !order.lng) return;

      const el = document.createElement('div');
      el.className = 'map-marker-stop';
      el.style.backgroundColor = '#6366f1';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid #fff';
      el.style.color = '#fff';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '11px';
      el.style.fontWeight = 'bold';
      el.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.8)';
      el.style.cursor = 'pointer';
      el.innerText = stop.sequenceOrder !== undefined ? stop.sequenceOrder : (index + 1).toString();

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="color: #0f1117; padding: 6px; max-width: 220px; font-family: sans-serif; line-height: 1.4;">
          <span style="background: rgba(99, 102, 241, 0.15); color: #6366f1; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">Điểm #${stop.sequenceOrder ?? (index + 1)}</span>
          <h4 style="margin: 6px 0 4px 0; font-size: 13px; color: #1e293b;">${order.recipientName || 'Người nhận'}</h4>
          <p style="margin: 0; font-size: 11px; color: #64748b;">${order.address}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([order.lng, order.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      coordinates.push([order.lng, order.lat]);
    });

    // Handle Route line drawing
    let routeCoords;

    if (geometry) {
      try {
        const decoded = polyline.decode(geometry);
        routeCoords = decoded.map(([lat, lng]) => [lng, lat]);
      } catch (err) {
        console.error('Failed to decode polyline:', err);
        routeCoords = coordinates;
      }
    } else {
      routeCoords = coordinates;
    }

    if (routeCoords && routeCoords.length > 1) {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoords,
          },
        },
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#6366f1',
          'line-width': 4,
          'line-opacity': 0.85,
        },
      });

      const bounds = new mapboxgl.LngLatBounds();
      routeCoords.forEach(coord => bounds.extend(coord));
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    } else if (coordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord));
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, [warehouse, stops, geometry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onStyleLoad = () => {
      updateMapData();
    };

    if (map.isStyleLoaded()) {
      updateMapData();
    } else {
      map.once('style.load', onStyleLoad);
    }

    return () => {
      map.off('style.load', onStyleLoad);
    };
  }, [updateMapData]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '350px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', minHeight: '350px', borderRadius: 'var(--radius-lg)' }} />
    </div>
  );
}
