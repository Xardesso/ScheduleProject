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
                      
                      // Bezpieczne uzyskiwanie ID agenta używając zmapowanego ID obszaru
                      const assignedId = schedule[di]?.[h]?.[mappedAreaId];
                      
                      // Log dla diagnostyki
                      
                      // Używamy nowej funkcji findAgent
                      const agent = findAgent(assignedId, agents);
                      
                      // Log dla debugowania
                      if (assignedId !== null && assignedId !== undefined && !agent) {
                        console.log(`Nie znaleziono agenta dla ID=${assignedId}, dzień=${di}, godz=${h}, obszar=${area.id}`);
                      }
                      
                      return (
                        <td key={di}
                            style={{
                              width: 60, height: 40, textAlign: 'center',
                              background: agent ? '#def' : '#f5f5f5'
                            }}>
                          {agent?.name || '—'}
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