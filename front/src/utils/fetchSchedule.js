// utils/fetchSchedule.js
export const fetchSchedule = async (agents, availability, areas, selectedWeek = null) => {
    try {
      console.log("Dane dostępności agentów:", availability);
      const availabilityEntries = Object.entries(availability || {});
      const availabilityCount = availabilityEntries.reduce((count, [agentId, slots]) => {
        return count + Object.values(slots).filter(isAvailable => isAvailable).length;
      }, 0);
      console.log(`Liczba dostępnych slotów: ${availabilityCount}`);
      
      if (!areas || areas.length === 0) {
        console.log("Pobieranie obszarów z API...");
        try {
          const areasResponse = await fetch('http://127.0.0.1:8000/api/areas');
          if (areasResponse.ok) {
            areas = await areasResponse.json();
            console.log("Pobrane obszary z API:", areas);
          } else {
            console.error("Nie udało się pobrać obszarów z API");
            areas = [
              { id: 1, name: "Obsługa klienta" },
              { id: 2, name: "Pozyskiwanie klienta" },
              { id: 3, name: "Wsparcie techniczne" }
            ];
          }
        } catch (error) {
          console.error("Błąd podczas pobierania obszarów:", error);
        }
      }
  
      console.log("Pobieranie umiejętności agentów...");
      const skillsResponse = await fetch('http://127.0.0.1:8000/api/skills');
      
      if (!skillsResponse.ok) {
        throw new Error(`Błąd podczas pobierania umiejętności: ${skillsResponse.status}`);
      }
      
      const skills = await skillsResponse.json();
      console.log("Pobrane umiejętności:", skills);
      
      const agentsWithSkills = agents.map(agent => {
        const agentId = parseInt(agent.id, 10);
        
        const agentSkills = skills.filter(skill => parseInt(skill.agentId, 10) === agentId) || [];
        
        return {
          ...agent,
          id: agentId, 
          skills: agentSkills.map(skill => ({
            ...skill,
            agentId: parseInt(skill.agentId, 10),
            areaId: parseInt(skill.areaId, 10),
            efficiency: parseFloat(skill.efficiency)
          }))
        };
      });
      
      const areasWithNumberIds = areas.map((area, index) => {
        const areaId = isNaN(parseInt(area.id, 10)) ? (index + 1) : parseInt(area.id, 10);
        return {
          ...area,
          id: areaId
        };
      });
      
      console.log("Agenci z umiejętnościami:", agentsWithSkills);
      console.log("Obszary z numerycznymi ID:", areasWithNumberIds);
      
      let dateRange = null;
      if (selectedWeek && Array.isArray(selectedWeek) && selectedWeek.length > 0) {
        const startDate = selectedWeek[0].toISOString().split('T')[0]; // Format YYYY-MM-DD
        const endDate = selectedWeek[6].toISOString().split('T')[0];
        dateRange = { startDate, endDate };
        console.log(`Pobieranie harmonogramu dla tygodnia: ${startDate} - ${endDate}`);
      }
      
      const requestData = {
        agents: agentsWithSkills,
        availability: availability || {},
        areas: areasWithNumberIds,
        dateRange: dateRange 
      };
      
      console.log("Wysyłanie danych do generowania grafiku:", requestData);
      
      const response = await fetch('http://127.0.0.1:8000/api/schedule', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Odpowiedź serwera:', errorText);
        throw new Error(`Błąd HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Otrzymany harmonogram:", data);
      
      const filledSlots = countFilledSlots(data);
      console.log(`Wypełnione sloty: ${filledSlots.filled} z ${filledSlots.total} (${(filledSlots.filled / filledSlots.total * 100).toFixed(2)}%)`);
      
    
      
      return data;
    } catch (err) {
      console.error('Błąd podczas pobierania:', err);
      // Zwróć pusty harmonogram
      return generateEmptySchedule();
    }
  };

function countFilledSlots(schedule) {
  let filled = 0;
  let total = 0;
  
  if (!schedule || typeof schedule !== 'object') return { filled: 0, total: 0 };
  
  // Przetwarzanie harmonogramu
  for (let day = 0; day < 7; day++) {
    if (!schedule[day]) continue;
    
    for (let hour = 9; hour <= 16; hour++) {
      if (!schedule[day][hour]) continue;
      
      const areaKeys = Object.keys(schedule[day][hour]);
      for (let i = 0; i < areaKeys.length; i++) {
        const areaId = areaKeys[i];
        total++;
        if (schedule[day][hour][areaId] !== null) {
          filled++;
        }
      }
    }
  }
  
  return { filled, total };
}

function generateEmptySchedule() {
  const schedule = [];
  for (let day = 0; day < 7; day++) {
    schedule[day] = {};
    for (let hour = 9; hour <= 16; hour++) {
      schedule[day][hour] = {};
    }
  }
  return schedule;
}


