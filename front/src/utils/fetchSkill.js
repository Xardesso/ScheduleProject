  // Pobranie umiejętności (skills)
  export const fetchSkills = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/skills');
      return await response.json();
    } catch (err) {
      console.error('Error fetching skills:', err);
      return [];
    }
  };
  
  // Dodanie nowej umiejętności
  export const addSkill = async (agentId, areaId, efficiency) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, areaId, efficiency })
      });
      return await response.json();
    } catch (err) {
      console.error('Error adding skill:', err);
      return null;
    }
  };
  