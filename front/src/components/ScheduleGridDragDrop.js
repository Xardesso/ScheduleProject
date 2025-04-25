import React, { useState } from 'react';

const hours = [...Array(8)].map((_, i) => 9 + i); // 9:00–16:00
const days = ['Pon','Wt','Śr','Czw','Pt','Sb','Nd'];

const ScheduleGridDragDrop = ({ queues, agents, assignments, onAssign }) => {
  const [draggedAgent, setDraggedAgent] = useState(null);

  const handleDragStart = agent => setDraggedAgent(agent);
  const handleDrop      = slotKey => {
    if (draggedAgent) {
      onAssign(slotKey, draggedAgent.id);
      setDraggedAgent(null);
    }
  };
  const handleDragOver  = e => e.preventDefault();

  return (
    <section>
      <h2>Grafik (Drag & Drop)</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Godz. / Kolejka</th>
            {queues.map(q => <th key={q.id}>{q.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {days.map((d, di) =>
            hours.map(h => {
              const keyBase = `2025-04-${24+di}-${h}`;
              return (
                <tr key={`${d}-${h}`}>
                  <td>{d} {h}:00</td>
                  {queues.map(q => {
                    const slotKey = `${keyBase}-${q.id}`;
                    const assignedId = assignments[slotKey];
                    const assignedAgent = agents.find(a => a.id === assignedId);

                    return (
                      <td key={slotKey}
                          style={{ minWidth: 120, minHeight: 40, border: '1px solid #ccc' }}
                          onDrop={() => handleDrop(slotKey)}
                          onDragOver={handleDragOver}>
                        {assignedAgent ? assignedAgent.name : <i>—</i>}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: 20 }}>Agenci (przeciągnij na grafik)</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        {agents.map(agent => (
          <div key={agent.id}
               draggable
               onDragStart={() => handleDragStart(agent)}
               style={{
                 padding: '8px 12px',
                 border: '1px solid #888',
                 borderRadius: 4,
                 cursor: 'grab'
               }}>
            {agent.name}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ScheduleGridDragDrop;