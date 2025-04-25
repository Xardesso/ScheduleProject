import React from 'react';
import { days, hours } from '../constants';

export default function SchedulePage({ agents, schedule, areas, selectedWeek }) {
  if (!schedule) return <p>Ładowanie grafiku…</p>;

  // Dodajmy log do debugowania
  console.log("Renderowanie SchedulePage:", { schedule, agents, areas });

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
        <div style={{ fontSize: '0.8em', color: '#666' }}>
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

  // Nowa funkcja do renderowania agentów - obsługuje zarówno pojedynczego agenta jak i tablicę
  const renderAgents = (assigned, agentsList) => {
    if (assigned === null || assigned === undefined) {
      return "—";
    }
    
    // Obsługa tablicy agentów
    if (Array.isArray(assigned)) {
      // Znajdź wszystkich agentów z tablicy ID
      const assignedAgents = assigned
        .map(id => findAgent(id, agentsList))
        .filter(a => a !== null);
      
      if (assignedAgents.length === 0) return "—";
      
      // Zwróć listę z nazwami agentów
      return (
        <div style={{ textAlign: 'left', fontSize: '0.85em' }}>
          {assignedAgents.map((agent, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              {agent.name}
            </div>
          ))}
        </div>
      );
    } 
    
    // Obsługa pojedynczego agenta (dla kompatybilności wstecznej)
    const agent = findAgent(assigned, agentsList);
    return agent?.name || "—";
  };

  return (
    <div>
      <h2>Ułożony grafik</h2>
      {areas.map(area => {
        // Wypisz identyfikatory dla diagnostyki
        console.log(`Renderowanie obszaru: ${area.name}, ID: ${area.id}, numeryczne ID: ${autoAreaIdMap[area.id]}`);
        
        return (
          <div key={area.id} style={{ marginBottom: 24 }}>
            <h3>{area.name}</h3>
            <table border="1" cellPadding="6" style={{borderCollapse:'collapse'}}>
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
                      // Użyj zmapowanego ID obszaru zamiast bezpośrednio area.id
                      const mappedAreaId = autoAreaIdMap[area.id];
                      
                      // Bezpieczne uzyskiwanie przypisanego agenta/agentów
                      const assigned = schedule[di]?.[h]?.[mappedAreaId];
                      
                      // Sprawdź liczbę agentów dla stylizacji
                      const agentCount = Array.isArray(assigned) ? 
                        assigned.filter(id => id !== null).length : 
                        (assigned !== null && assigned !== undefined ? 1 : 0);
                      
                      return (
                        <td key={di}
                            style={{
                              width: 120, // Zwiększona szerokość dla lepszego wyświetlania wielu agentów
                              height: agentCount > 1 ? 'auto' : 40, // Dynamiczna wysokość zależna od liczby agentów
                              textAlign: Array.isArray(assigned) ? 'left' : 'center',
                              background: agentCount > 0 ? '#def' : '#f5f5f5',
                              padding: '4px 6px'
                            }}>
                          {renderAgents(assigned, agents)}
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
