import React, { useEffect } from 'react';
import { days } from '../constants';

export default function AvailabilityPage({ 
  agents, 
  selectedAgent, 
  availability, 
  onSelectAgent, 
  onToggleSlot,
  selectedWeek,
  pendingChanges,
  onSaveChanges
}) {
  // Logowanie dla debugowania
  useEffect(() => {
    console.log("Dane dostępności w komponencie:", availability);
  }, [availability]);

  if (!selectedAgent) return <p>Wybierz agenta z listy</p>;

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
  
  // Funkcja pomocnicza do debugowania - wyświetla pełną datę w konsoli
  const logDateInfo = (date, slotKey) => {
    console.log(`Pełna data: ${date.toISOString()}, SlotKey: ${slotKey}`);
  };
  
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 200, marginRight: 20 }}>
          <h3>Agenci</h3>
          {agents.map(a => (
            <div
              key={a.id}
              onClick={() => onSelectAgent(a)}
              style={{
                padding: 10,
                backgroundColor: selectedAgent?.id === a.id ? '#e6f7ff' : 'white',
                cursor: 'pointer',
                border: '1px solid #ddd',
                marginBottom: 5
              }}
            >
              {a.name}
            </div>
          ))}
          
          {/* Przycisk do zapisywania zmian */}
          <button 
            onClick={onSaveChanges}
            style={{
              marginTop: 20,
              padding: '10px 15px',
              backgroundColor: pendingChanges.length > 0 ? '#1890ff' : '#d9d9d9',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: pendingChanges.length > 0 ? 'pointer' : 'default',
              width: '100%'
            }}
            disabled={pendingChanges.length === 0}
          >
            Zapisz zmiany {pendingChanges.length > 0 ? `(${pendingChanges.length})` : ''}
          </button>
        </div>
        
        <div>
          <h3>Dostępność: {selectedAgent?.name}</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Godzina</th>
                {days.map((_, i) => (
                  <th key={i}>{formatDayHeader(i)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, hourIdx) => {
                const hour = hourIdx + 9; // 9:00 - 16:00
                return (
                  <tr key={hour}>
                    <td><b>{hour}:00</b></td>
                    {days.map((_, dayIdx) => {
                      const date = new Date(selectedWeek[dayIdx]); // Tworzenie nowej instancji daty
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      const slotKey = `${dateStr}-${hour}`;
                      
                      // Sprawdź czy dostępność istnieje dla tego slotu
                      const isAvailable = availability[selectedAgent.id]?.[slotKey];
                      
                      // Sprawdź czy ta komórka ma niezapisane zmiany
                      const isPending = pendingChanges?.some(
                        change => change.agentId === selectedAgent.id && change.slot === slotKey
                      ) || false;
                      
                      return (
                        <td
                          key={dayIdx}
                          onClick={() => {
                            logDateInfo(date, slotKey); // Debugging
                            // Przekaż dokładne dane o dacie i godzinie
                            onToggleSlot(selectedAgent.id, slotKey, {
                              date: dateStr,
                              hour: hour,
                              dayIndex: dayIdx
                            });
                          }}
                          style={{
                            backgroundColor: isAvailable ? (isPending ? '#ffc069' : '#d4ffcc') : (isPending ? '#ffccc7' : '#fff'),
                            cursor: 'pointer',
                            width: 60,
                            textAlign: 'center',
                            border: isPending ? '2px solid #722ed1' : '1px solid #ddd'
                          }}
                        >
                          {isAvailable ? '✓' : '—'}
                          <div style={{ fontSize: '0.7em', color: '#666' }}>
                            {day}/{month}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Debug info - pokaż oczekujące zmiany */}
      {pendingChanges && pendingChanges.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4>Oczekujące zmiany ({pendingChanges.length}):</h4>
          <ul>
            {pendingChanges.map((change, idx) => (
              <li key={idx}>
                Agent: {change.agentId}, 
                Data: {change.date}, 
                Godzina: {change.hour}, 
                Slot: {change.slot}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}