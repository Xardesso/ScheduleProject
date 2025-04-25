import React from 'react';

const AgentList = ({ agents }) => (
  <section>
    <h2>Agenci</h2>
    <table border="1" cellPadding="5">
      <thead>
        <tr><th>Imię</th><th>Umiejętności</th><th>Efektywność</th></tr>
      </thead>
      <tbody>
        {agents.map(a => (
          <tr key={a.id}>
            <td>{a.name}</td>
            <td>{a.skills.join(', ')}</td>
            <td>
              {a.skills.map(s =>
                <div key={s}>{s}: {a.efficiency[s]}×</div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

export default AgentList;