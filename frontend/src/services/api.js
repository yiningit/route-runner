export const fetchRoute = async () => {
  const res = await fetch(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      method: 'POST',
      headers: {
        Authorization: import.meta.env.VITE_ORS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [
          [151.2093, -33.8688],
          [151.215, -33.87],
        ],
      }),
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch route');
  }

  return res.json();
};