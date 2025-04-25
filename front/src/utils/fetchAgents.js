// Pobieranie agentów
export const fetchAgents = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/agents');
      return await response.json();
    } catch (err) {
      console.error('Error fetching agents:', err);
      return [];
    }
  };
  