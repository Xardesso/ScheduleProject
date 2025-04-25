import React, { useState, useEffect, useCallback } from 'react';
import '../styles.css';

const SkillManagementPage = () => {
  const [agents, setAgents] = useState([]);
  const [areas, setAreas] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

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
        showFeedbackMessage('Wystąpił błąd podczas ładowania danych', true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Znajdź bieżące umiejętności agenta
  const getAgentSkill = useCallback((agentId, areaId) => {
    if (!agentId || !areaId) return null;
    return skills.find(skill => 
      parseInt(skill.agentId) === parseInt(agentId) && 
      parseInt(skill.areaId) === parseInt(areaId)
    );
  }, [skills]);

  // Obsługa zmiany agenta
  const handleAgentChange = useCallback((e) => {
    setSelectedAgent(e.target.value);
  }, []);

  // Wyświetlanie komunikatu zwrotnego
  const showFeedbackMessage = useCallback((text, isError = false) => {
    setMessage(text);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  }, []);

  // Obsługa aktualizacji umiejętności
  const handleSkillUpdate = useCallback(async (areaId, isPositive) => {
    if (!selectedAgent || !areaId) {
      showFeedbackMessage('Wybierz agenta i obszar', true);
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
      showFeedbackMessage(`Umiejętność agenta została ${isPositive ? 'zwiększona' : 'zmniejszona'}`);
    } catch (error) {
      console.error('Błąd podczas aktualizacji umiejętności:', error);
      showFeedbackMessage('Wystąpił błąd podczas aktualizacji umiejętności', true);
    }
  }, [selectedAgent, getAgentSkill, showFeedbackMessage]);

  // Funkcja renderująca sekcję umiejętności
  const renderSkillSection = useCallback((areaId, areaName, questionText, positiveLabel, negativeLabel) => {
    const skill = getAgentSkill(selectedAgent, areaId);
    const efficiency = skill ? parseFloat(skill.efficiency).toFixed(1) : "1.0";
    
    return (
      <div key={areaId} className="skill-section">
        <h3>{areaName}</h3>
        <div className="skill-info">
          <div className="skill-level">
            Obecny poziom: <strong>{efficiency}</strong> <span className="max-level">/ 10</span>
          </div>
          <div className="skill-progress">
            <div 
              className="skill-progress-bar" 
              style={{width: `${(parseFloat(efficiency)/10)*100}%`}}
            ></div>
          </div>
        </div>
        
        <div className="feedback-question">{questionText}</div>
        
        <div className="feedback-buttons">
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
  }, [getAgentSkill, handleSkillUpdate, selectedAgent]);

  if (isLoading) {
    return <div className="loading">Ładowanie danych...</div>;
  }

  return (
    <div className="skills-container">
      <h2>Zarządzanie umiejętnościami pracowników</h2>
      
      <div className="agent-selector-container">
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
      
      {showMessage && (
        <div className={`message ${message.includes('błąd') ? 'error-message' : 'success-message'}`}>
          {message}
        </div>
      )}
      
      {selectedAgent ? (
        <div className="skills-content">
          {/* Obsługa klienta */}
          {renderSkillSection(
            1, 
            "Obsługa klienta", 
            "Czy klient wystawił pozytywną recenzję?", 
            "Tak, pozytywna", 
            "Nie, negatywna"
          )}
          
          {/* Pozyskiwanie klienta */}
          {renderSkillSection(
            2, 
            "Pozyskiwanie klienta", 
            "Czy klient dokonał zakupu?", 
            "Tak, kupił", 
            "Nie, nie kupił"
          )}
          
          {/* Wsparcie techniczne */}
          {renderSkillSection(
            3, 
            "Wsparcie techniczne", 
            "Czy problem został rozwiązany?", 
            "Tak, rozwiązany", 
            "Nie, nierozwiązany"
          )}
        </div>
      ) : (
        <div className="no-agent-selected">
          Wybierz agenta, aby zarządzać jego umiejętnościami
        </div>
      )}
    </div>
  );
};

export default SkillManagementPage;
