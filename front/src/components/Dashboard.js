import React from 'react';

const Dashboard = ({ queues }) => (
  <section>
    <h2>Prognoza zapotrzebowania (następny tydzień)</h2>
    <div style={{ display: 'flex', gap: 20 }}>
      {queues.map(q => (
        <div key={q.id}>
          <h4>{q.name}</h4>
          {/* tu można wstawić Chart.js lub inny wykres */}
          <ul>
            {q.forecast.map((v, i) => <li key={i}>Dzień {i+1}: {v} połączeń</li>)}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

export default Dashboard;