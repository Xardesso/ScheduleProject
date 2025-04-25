import React, { useState, useEffect } from 'react';
import '../SkillManagementPage.module.css';

const SkillManagementPage = () => {
  const [agents, setAgents] = useState([]);
  const [areas, setAreas] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Pobierz listę agentów, obszarów i umiejętności
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Pobierz agentów
        const agentsResponse = await fetch('http://127.0.0.1:8000/api/agents');
        const agentsData = await agentsResponse.json();
        
        // Pobierz obszary
        const areasResponse = await fetch('http://127.0.0.1:8000/api/areas');
        const areasData = await areasResponse.json();
        
        // Pobierz umiejętności
        const skillsResponse = await fetch('http://127.0.0.1:8000/api/skills');
        const skillsData = await skillsResponse.json();
        
        setAgents(agentsData);
        setAreas(areasData);
        setSkills(skillsData);
        
        if (agentsData.length > 0) {
          setSelectedAgent(agentsData[0].id);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania danych:', error);
        setMessage('Wystąpił błąd podczas ładowania danych');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Znajdź bieżące umiejętności agenta
  const getAgentSkill = (agentId, areaId) => {
    if (!agentId || !areaId) return null;
    return skills.find(skill => 
      parseInt(skill.agentId) === parseInt(agentId) && 
      parseInt(skill.areaId) === parseInt(areaId)
    );
  };

  // Obsługa zmiany agenta
  const handleAgentChange = (e) => {
    setSelectedAgent(e.target.value);
  };

  // Obsługa aktualizacji umiejętności
  const handleSkillUpdate = async (areaId, isPositive) => {
    if (!selectedAgent || !areaId) {
      setMessage('Wybierz agenta i obszar');
      return;
    }
    
    try {
      const currentSkill = getAgentSkill(selectedAgent, areaId);
      let efficiency = currentSkill ? parseFloat(currentSkill.efficiency) : 1.0;
      
      // Zmień wartość efficiency w zależności od oceny
      efficiency = isPositive 
        ? Math.min(efficiency + 0.1, 10) // Nie więcej niż 10
        : Math.max(efficiency - 0.1, 0.1); // Nie mniej niż 0.1
      
      // Ustal dane do wysłania
      const updateData = {
        agentId: parseInt(selectedAgent),
        areaId: parseInt(areaId),
        efficiency: efficiency
      };
      
      // Jeśli istnieje skill, załącz id
      if (currentSkill?.id) {
        updateData.id = currentSkill.id;
      }
      
      // Wyślij dane do API
      const response = await fetch('http://127.0.0.1:8000/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Pobierz zaktualizowane dane umiejętności
      const skillsResponse = await fetch('http://127.0.0.1:8000/api/skills');
      const skillsData = await skillsResponse.json();
      setSkills(skillsData);
      
      // Pokaż komunikat sukcesu
      setMessage(`Umiejętność agenta została ${isPositive ? 'zwiększona' : 'zmniejszona'}`);
      
      // Wyczyść komunikat po 3 sekundach
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Błąd podczas aktualizacji umiejętności:', error);
      setMessage('Wystąpił błąd podczas aktualizacji umiejętności');
    }
  };

  // Znajdź nazwę obszaru po ID
  const getAreaName = (areaId) => {
    const area = areas.find(a => parseInt(a.id) === parseInt(areaId));
    return area ? area.name : 'Nieznany obszar';
  };

  // Tworzenie komponentu oceny dla każdego obszaru
  const renderFeedbackSection = (areaId, areaName, questionText, positiveLabel, negativeLabel) => {
    const skill = getAgentSkill(selectedAgent, areaId);
    const efficiency = skill ? parseFloat(skill.efficiency).toFixed(1) : "1.0";
    
    return (
      <div key={areaId} className="feedback-section">
        <h3>{areaName}</h3>
        <p>Obecny poziom: <strong>{efficiency}</strong> / 10</p>
        <p>{questionText}</p>
        <div className="buttons-container">
          <button 
            onClick={() => handleSkillUpdate(areaId, true)}
            className="positive-button"
          >
            {positiveLabel}
          </button>
          <button 
            onClick={() => handleSkillUpdate(areaId, false)}
            className="negative-button"
          >
            {negativeLabel}
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div>Ładowanie danych...</div>;
  }

  return (
    <div className="skill-management-container">
      <h2>Zarządzanie umiejętnościami pracowników</h2>
      
      <div className="selection-container">
        <label htmlFor="agent-select">Wybierz pracownika:</label>
        <select 
          id="agent-select" 
          value={selectedAgent || ''} 
          onChange={handleAgentChange}
          className="agent-select"
        >
          <option value="">Wybierz...</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
      </div>
      
      {message && (
        <div className={`message ${message.includes('błąd') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      {selectedAgent && (
        <div className="feedback-container">
          {/* Obsługa klienta */}
          {renderFeedbackSection(
            1, 
            "Obsługa klienta", 
            "Czy klient wystawił pozytywną recenzję?", 
            "Tak, pozytywna", 
            "Nie, negatywna"
          )}
          
          {/* Pozyskiwanie klienta */}
          {renderFeedbackSection(
            2, 
            "Pozyskiwanie klienta", 
            "Czy klient dokonał zakupu?", 
            "Tak, kupił", 
            "Nie, nie kupił"
          )}
          
          {/* Wsparcie techniczne */}
          {renderFeedbackSection(
            3, 
            "Wsparcie techniczne", 
            "Czy problem został rozwiązany?", 
            "Tak, rozwiązany", 
            "Nie, nierozwiązany"
          )}
        </div>
      )}
    </div>
  );
};

export default SkillManagementPage;
