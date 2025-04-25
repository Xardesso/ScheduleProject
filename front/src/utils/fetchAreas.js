export const fetchAreas = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/areas');
      return await response.json();
    } catch (err) {
      console.error('Error fetching areas:', err);
      return [];
    }
  };
  