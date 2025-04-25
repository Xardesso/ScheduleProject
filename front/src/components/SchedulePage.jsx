import React, { useState, useEffect } from 'react';
import { days, hours } from '../constants';
import '../styles.css'; // Import stylów

export default function SchedulePage({ agents, schedule, areas, selectedWeek }) {
  const [requiredPeople, setRequiredPeople] = useState({});
  
  // Pobierz wymagane liczby osób z API
  useEffect(() => {
    const fetchRequiredAvailability = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/required-availability');
        if (response.ok) {
          const data = await response.json();
          
          // Przekształć dane do formatu indeksowanego godziną i obszarem
          const byHourAndArea = {};
          data.forEach(item => {
            if (!byHourAndArea[item.hour]) {
              byHourAndArea[item.hour] = {};
            }
            byHourAndArea[item.hour][1] = item.reqpeople_1 || 1;
            byHourAndArea[item.hour][2] = item.reqpeople_2 || 1;
            byHourAndArea[item.hour][3] = item.reqpeople_3 || 1;
          });
          
          console.log("Pobrane wymagane liczby osób:", byHourAndArea);
          setRequiredPeople(byHourAndArea);
        }
      } catch (error) {
        console.error("Błąd podczas pobierania wymaganej liczby osób:", error);
      }
    };
    
    fetchRequiredAvailability();
  }, []);

  if (!schedule) return <p>Ładowanie grafiku…</p>;

  console.log("Renderowanie SchedulePage:", { schedule, agents, areas, requiredPeople });

  // Mapowanie stringowych ID obszarów na numeryczne ID używane w harmonogramie
  const areaIdMap = {
    "customer": 1,
    "acquisition": 2,
    "tech": 3
  };

  // Można też utworzyć mapowanie automatycznie na podstawie indeksu (alternatywa)
  const autoAreaIdMap = {};
  areas.forEach((area, index) => {
    autoAreaIdMap[area.id] = index + 1;
  });

  console.log("Mapowanie ID obszarów:", { areaIdMap, autoAreaIdMap });

  const formatDayHeader = (dayIndex) => {
    const date = selectedWeek[dayIndex];
    return (
      <>
        <div>{days[dayIndex]}</div>
        <div className="date-subheader">
          {date.getDate()}.{date.getMonth() + 1}
        </div>
      </>
    );
  };

  // Funkcja pomocnicza do znajdowania agenta - obsługuje różne typy danych
  const findAgent = (agentId, agentsList) => {
    if (agentId === null || agentId === undefined) return null;
    
    // Konwersja ID do String dla bezpiecznego porównania
    const idToFind = String(agentId);
    return agentsList.find(a => String(a.id) === idToFind);
  };

  // Funkcja do renderowania agentów z informacją o brakujących osobach
  const renderAgents = (assigned, requiredCount, agentsList) => {
    // Jeśli nic nie jest przydzielone
    if (!assigned || (Array.isArray(assigned) && assigned.length === 0)) {
      // Jeśli jest wymagane więcej niż 0 osób, pokaż ilość brakujących
      if (requiredCount && requiredCount > 0) {
        return <div className="missing-indicator">- (brak {requiredCount})</div>;
      }
      return "-";
    }
    
    // Obsługa tablicy agentów
    if (Array.isArray(assigned)) {
      // Znajdź wszystkich agentów z tablicy ID
      const assignedAgents = assigned
        .map(id => findAgent(id, agentsList))
        .filter(a => a !== null);
      
      // Jeśli brakuje agentów - pokaż listę + informację o brakujących
      const missing = requiredCount - assignedAgents.length;
      
      return (
        <div className="agents-list">
          {assignedAgents.map((agent, index) => (
            <div key={index} className="agent-name">
              {agent.name}
            </div>
          ))}
          {missing > 0 && (
            <div className="missing-indicator">
              - (brak {missing})
            </div>
          )}
        </div>
      );
    } 
    
    // Obsługa pojedynczego agenta (dla kompatybilności wstecznej)
    const agent = findAgent(assigned, agentsList);
    
    // Jeśli wymagana liczba osób > 1, a przydzielona = 1
    if (requiredCount > 1 && agent) {
      return (
        <div>
          <div className="agent-name">{agent.name}</div>
          <div className="missing-indicator">
            - (brak {requiredCount - 1})
          </div>
        </div>
      );
    }
    
    return agent?.name || "-";
  };

  return (
    <div className="schedules-container">
      <h2>Ułożony grafik</h2>
      {areas.map(area => {
        return (
          <div key={area.id} className="schedule-section">
            <h3>{area.name}</h3>
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Godz / Dzień</th>
                  {days.map((_, i) => <th key={i}>{formatDayHeader(i)}</th>)}
                </tr>
              </thead>
              <tbody>
                {hours.map(h => (
                  <tr key={h}>
                    <td><b>{h}:00</b></td>
                    {days.map((_, di) => {
                      // Użyj zmapowanego ID obszaru
                      const mappedAreaId = autoAreaIdMap[area.id];
                      
                      // Bezpieczne uzyskiwanie przypisanego agenta/agentów
                      const assigned = schedule[di]?.[h]?.[mappedAreaId];
                      
                      // Pobierz wymaganą liczbę osób dla tego obszaru i godziny
                      const requiredCount = requiredPeople[h]?.[mappedAreaId] || 1;
                      
                      // Sprawdź liczbę agentów dla stylizacji
                      const agentCount = Array.isArray(assigned) ? 
                        assigned.filter(id => id !== null).length : 
                        (assigned !== null && assigned !== undefined ? 1 : 0);
                      
                      // Sprawdź, czy jest niedobór agentów (nawet jeden brakujący)
                      const isShortage = agentCount < requiredCount;
                      
                      // Dodaj odpowiednie klasy CSS
                      let cellClass = '';
                      if (agentCount > 0) {
                        cellClass = isShortage ? 'filled shortage' : 'filled';
                      } else if (isShortage) {
                        cellClass = 'shortage';
                      }
                      
                      return (
                        <td key={di} className={cellClass}>
                          {renderAgents(assigned, requiredCount, agents)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
