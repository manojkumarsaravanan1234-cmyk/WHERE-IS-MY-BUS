import axios from 'axios';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export const searchPlace = async (query) => {
    try {
        // Appending "Tamil Nadu" to bias results further if not already present
        const searchTerms = query.toLowerCase().includes('tamil nadu') ? query : `${query}, Tamil Nadu`;

        const response = await axios.get(NOMINATIM_URL, {
            params: {
                q: searchTerms,
                format: 'json',
                addressdetails: 1,
                limit: 5,
                countrycodes: 'in',
                viewbox: '76.2,13.5,80.4,8.0', // Tamil Nadu bounding box
                bounded: 0 // Prioritize but don't strictly exclude
            }
        });
        return response.data;
    } catch (error) {
        console.error("Geocoding error", error);
        return [];
    }
};

export const getRoutePolyline = async (start, end) => {
    // start, end are [lng, lat]
    try {
        const url = `${OSRM_URL}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
        const response = await axios.get(url);
        if (response.data.routes && response.data.routes.length > 0) {
            return response.data.routes[0]; // Returns { geometry: ..., distance: ..., duration: ... }
        }
        return null;
    } catch (error) {
        console.error("Routing error", error);
        return null;
    }
};
