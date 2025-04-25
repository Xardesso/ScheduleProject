// utils/fetchSchedule.js
export const fetchSchedule = async (agents, availability, areas, selectedWeek = null) => {
    try {
      // Dodaj informacje o dostępności agentów
      console.log("Dane dostępności agentów:", availability);
      const availabilityEntries = Object.entries(availability || {});
      const availabilityCount = availabilityEntries.reduce((count, [agentId, slots]) => {
        return count + Object.values(slots).filter(isAvailable => isAvailable).length;
      }, 0);
      console.log(`Liczba dostępnych slotów: ${availabilityCount}`);
      
      // Pobierz obszary z backendu, jeśli nie są dostarczone
      if (!areas || areas.length === 0) {
        console.log("Pobieranie obszarów z API...");
        try {
          const areasResponse = await fetch('http://127.0.0.1:8000/api/areas');
          if (areasResponse.ok) {
            areas = await areasResponse.json();
            console.log("Pobrane obszary z API:", areas);
          } else {
            console.error("Nie udało się pobrać obszarów z API");
            // Zdefiniuj domyślne obszary na podstawie tabeli z bazy danych
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
  
      // Pobierz umiejętności dla każdego agenta
      console.log("Pobieranie umiejętności agentów...");
      const skillsResponse = await fetch('http://127.0.0.1:8000/api/skills');
      
      if (!skillsResponse.ok) {
        throw new Error(`Błąd podczas pobierania umiejętności: ${skillsResponse.status}`);
      }
      
      const skills = await skillsResponse.json();
      console.log("Pobrane umiejętności:", skills);
      
      // Przygotuj agentów z umiejętnościami i upewnij się, że ID są liczbami
      const agentsWithSkills = agents.map(agent => {
        // Upewnij się, że ID agenta jest liczbą
        const agentId = parseInt(agent.id, 10);
        
        // Znajdź umiejętności dla tego agenta
        const agentSkills = skills.filter(skill => parseInt(skill.agentId, 10) === agentId) || [];
        
        return {
          ...agent,
          id: agentId, // Upewnij się, że ID jest liczbą
          skills: agentSkills.map(skill => ({
            ...skill,
            agentId: parseInt(skill.agentId, 10),
            areaId: parseInt(skill.areaId, 10),
            efficiency: parseFloat(skill.efficiency)
          }))
        };
      });
      
      // Upewnij się, że ID obszarów są liczbami
      const areasWithNumberIds = areas.map((area, index) => {
        // Jeśli ID jest NaN, użyj indeksu + 1
        const areaId = isNaN(parseInt(area.id, 10)) ? (index + 1) : parseInt(area.id, 10);
        return {
          ...area,
          id: areaId
        };
      });
      
      console.log("Agenci z umiejętnościami:", agentsWithSkills);
      console.log("Obszary z numerycznymi ID:", areasWithNumberIds);
      
      // Dodaj informacje o wybranym tygodniu, jeśli jest dostępny
      let dateRange = null;
      if (selectedWeek && Array.isArray(selectedWeek) && selectedWeek.length > 0) {
        const startDate = selectedWeek[0].toISOString().split('T')[0]; // Format YYYY-MM-DD
        const endDate = selectedWeek[6].toISOString().split('T')[0];
        dateRange = { startDate, endDate };
        console.log(`Pobieranie harmonogramu dla tygodnia: ${startDate} - ${endDate}`);
      }
      
      // Przygotowanie danych do wysłania
      const requestData = {
        agents: agentsWithSkills,
        availability: availability || {},
        areas: areasWithNumberIds,
        dateRange: dateRange // Dodaj datę tygodnia do zapytania
      };
      
      console.log("Wysyłanie danych do generowania grafiku:", requestData);
      
      // Wywołaj API do generowania harmonogramu
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
      
      // Pobierz dane z odpowiedzi
      const data = await response.json();
      console.log("Otrzymany harmonogram:", data);
      
      // Analiza harmonogramu - sprawdź czy jest pusty
      const filledSlots = countFilledSlots(data);
      console.log(`Wypełnione sloty: ${filledSlots.filled} z ${filledSlots.total} (${(filledSlots.filled / filledSlots.total * 100).toFixed(2)}%)`);
      
    
      
      return data;
    } catch (err) {
      console.error('Błąd podczas pobierania:', err);
      // Zwróć pusty harmonogram
      return generateEmptySchedule();
    }
  };

// Funkcja pomocnicza do liczenia wypełnionych slotów
function countFilledSlots(schedule) {
  let filled = 0;
  let total = 0;
  
  if (!schedule || typeof schedule !== 'object') return { filled: 0, total: 0 };
  
  // Przetwarzanie harmonogramu
  for (let day = 0; day < 7; day++) {
    if (!schedule[day]) continue;
    
    for (let hour = 9; hour <= 16; hour++) {
      if (!schedule[day][hour]) continue;
      
      // Iteruj po obszarach - używamy for zamiast forEach, aby uniknąć błędu ESLint
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

// Funkcja generująca pusty harmonogram
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

// Funkcja symulująca dane harmonogramu dla testów interfejsu

