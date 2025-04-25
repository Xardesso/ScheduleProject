// Pobieranie dostępności agentów
export const fetchAvailability = async (agentId = null) => {
    try {
      let url = 'http://127.0.0.1:8000/api/availability';
      if (agentId) {
        url += `?agentId=${agentId}`;
      }
      
      console.log("Pobieranie dostępności z:", url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Otrzymane dane dostępności:", data);
      return data;
    } catch (err) {
      console.error('Error fetching availability:', err);
      return [];
    }
  };
  
  // Zapisanie dostępności agenta
  export const saveAvailability = async (agentId, date, hour, isAvailable) => {
    try {
      console.log(`Zapisuję: Agent ${agentId}, data ${date}, godzina ${hour}, dostępny: ${isAvailable}`);
      
      const response = await fetch('http://127.0.0.1:8000/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, date, hour, isAvailable })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error saving availability:', err);
      return null;
    }
  };
  
  // Usunięcie dostępności agenta
  export const deleteAvailability = async (agentId, date, hour) => {
    try {
      console.log(`Usuwam: Agent ${agentId}, data ${date}, godzina ${hour}`);
      
      const response = await fetch('http://127.0.0.1:8000/api/availability/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, date, hour })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error deleting availability:', err);
      throw err;
    }
  };
  