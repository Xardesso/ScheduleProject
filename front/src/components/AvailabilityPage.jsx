import React, { useState } from 'react';
import { days, hours } from '../constants';
import '../styles.css';

const AvailabilityPage = ({
  agents,
  selectedAgent,
  availability,
  onSelectAgent,
  onToggleSlot,
  selectedWeek,
  pendingChanges,
  onSaveChanges
}) => {
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // Mapowanie dat wybranego tygodnia na dni tygodnia
  const weekDates = {};
  selectedWeek.forEach((date, index) => {
    weekDates[index] = date;
  });

  // Formatowanie nagłówka dnia tygodnia
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

  // Sprawdzenie, czy slot jest dostępny
  const isSlotAvailable = (agentId, day, hour) => {
    const date = weekDates[day];
    if (!date) return false;

    const dateStr = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    const slotKey = `${dateStr}-${hour}`;

    return availability[agentId]?.[slotKey] === true;
  };

  // Sprawdzenie, czy slot jest w oczekujących zmianach
  const isPendingChange = (agentId, day, hour) => {
    const date = weekDates[day];
    if (!date) return false;

    const dateStr = date.toISOString().split('T')[0];
    const slotKey = `${dateStr}-${hour}`;

    return pendingChanges.some(
      change => change.agentId === agentId && change.slot === slotKey
    );
  };

  // Obsługa kliknięcia w slot dostępności
  const handleSlotClick = (day, hour) => {
    if (!selectedAgent) return;

    const date = weekDates[day];
    if (!date) return;

    const dateStr = date.toISOString().split('T')[0];
    const slotKey = `${dateStr}-${hour}`;
    
    onToggleSlot(selectedAgent.id, slotKey, { date: dateStr, hour });
  };

  return (
    <div className="availability-container">
      <h2>Dostępność agentów</h2>
      
      <div className="availability-controls">
        <div className="agent-selector">
          <label htmlFor="agent-select">Wybierz agenta:</label>
          <select
            id="agent-select"
            value={selectedAgent?.id || ''}
            onChange={(e) => {
              const agentId = e.target.value;
              const agent = agents.find((a) => a.id.toString() === agentId);
              onSelectAgent(agent);
            }}
            className="agent-select"
          >
            <option value="">Wybierz pracownika</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {selectedAgent && (
        <div className="availability-table-container">
          <p className="availability-instruction">
            Kliknij w komórkę, aby zaznaczyć/odznaczyć dostępność agenta w danym terminie
          </p>
          
          <table className="availability-table">
            <thead>
              <tr>
                <th className="hour-header">Godz / Dzień</th>
                {days.map((_, i) => (
                  <th key={i} className="day-header">
                    {formatDayHeader(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="hour-cell">{hour}:00</td>
                  {days.map((_, dayIndex) => {
                    const isAvailable = isSlotAvailable(selectedAgent.id, dayIndex, hour);
                    const isPending = isPendingChange(selectedAgent.id, dayIndex, hour);
                    
                    let cellClass = "availability-cell";
                    if (isAvailable) cellClass += " available";
                    if (isPending) cellClass += " pending";
                    
                    return (
                      <td
                        key={dayIndex}
                        className={cellClass}
                        onClick={() => handleSlotClick(dayIndex, hour)}
                        onMouseEnter={() => setHoveredSlot(`${dayIndex}-${hour}`)}
                        onMouseLeave={() => setHoveredSlot(null)}
                      >
                        {isAvailable ? (
                          <span className="availability-check">✓</span>
                        ) : (
                          <span className="availability-cross">✗</span>
                        )}
                        {isPending && <div className="pending-indicator">*</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          {pendingChanges.length > 0 && (
            <div className="pending-info">
              * Zmiany oczekujące na zapisanie
            </div>
          )}
        </div>
      )}
      
      {!selectedAgent && (
        <div className="no-agent-selected">
          Wybierz agenta, aby zobaczyć i edytować jego dostępność
        </div>
      )}

      {pendingChanges.length > 0 && (
        <button 
          onClick={onSaveChanges}
          className="floating-save-button"
        >
          Zapisz zmiany ({pendingChanges.length})
        </button>
      )}
    </div>
  );
};

export default AvailabilityPage;
