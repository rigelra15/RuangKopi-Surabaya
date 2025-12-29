import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lat, lon, q, type } = req.query;

  try {
    let url: string;
    
    if (type === 'reverse' && lat && lon) {
      // Reverse geocoding
      url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`;
    } else if (type === 'search' && q) {
      // Forward geocoding
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(String(q))}&format=json&limit=5&addressdetails=1`;
    } else {
      return res.status(400).json({ error: 'Invalid parameters. Use type=reverse with lat/lon or type=search with q' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RuangKopiSurabaya/1.0 (https://ruangkopisby.vercel.app; contact@ruangkopi.id)',
        'Accept-Language': 'id,en',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Nominatim API error' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
