import React, { useState, useEffect, useCallback } from 'react';
import { fetchAgents } from './utils/fetchAgents';
import { areas } from './constants';
import AvailabilityPage from './components/AvailabilityPage';
import SchedulePage from './components/SchedulePage';
import { fetchSchedule } from './utils/fetchSchedule';
import { saveAvailability, fetchAvailability, deleteAvailability } from './utils/fetchAvailability';
import RequiredAvailabilityPage from './components/RequiredAvailabilityPage';
import SkillManagementPage from './components/SkillManagementPage';
import './styles.css'; 

export default function App() {
  const [page, setPage] = useState(1); 
  const [selectedAgent, setAgent] = useState(null);
  const [availability, setAvailability] = useState({});
  const [schedule, setSchedule] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekDates());
  const [pendingChanges, setPendingChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  function getCurrentWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = niedziela, 1 = poniedziałek, itd.
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    
    const monday = new Date(now.setDate(diff));
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }

  const loadAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const availabilityData = await fetchAvailability(null, selectedWeek);
      
      if (availabilityData && Array.isArray(availabilityData)) {
        const formattedData = {};
        
        availabilityData.forEach(item => {
          const { agentId, date, hour, isAvailable } = item;
          if (!formattedData[agentId]) {
            formattedData[agentId] = {};
          }
          
          const slotKey = `${date}-${hour}`;
          formattedData[agentId][slotKey] = isAvailable;
        });
        
        console.log("Załadowane dane dostępności dla tygodnia:", selectedWeek[0].toISOString().split('T')[0], "-", selectedWeek[6].toISOString().split('T')[0]);
        setAvailability(formattedData);
      } else {
        console.error("Nieprawidłowy format danych z API:", availabilityData);
      }
    } catch (error) {
      console.error("Błąd podczas ładowania dostępności:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    if (page === 2 && agents.length > 0) {
      const updateScheduleForWeek = async () => {
        setIsLoading(true);
        try {
          const newSchedule = await fetchSchedule(agents, availability, areas, selectedWeek);
          setSchedule(newSchedule);
        } catch (error) {
          console.error('Błąd podczas aktualizacji harmonogramu:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      updateScheduleForWeek();
    }
  }, [selectedWeek, page, agents, availability]);

  const toggleSlot = (agentId, slot, slotInfo) => {
    console.log(`Toggle slot: Agent ${agentId}, Slot ${slot}`);
    
    const isPending = pendingChanges.some(
      change => change.agentId === agentId && change.slot === slot
    );
    
    const isCurrentlyChecked = availability[agentId]?.[slot] || false;
    
    setAvailability(prev => ({
      ...prev,
      [agentId]: { ...(prev[agentId] || {}), [slot]: !isCurrentlyChecked }
    }));
    
    const { date, hour } = slotInfo || {};
    const dateStr = date || slot.split('-').slice(0, 3).join('-');
    const hourValue = hour || parseInt(slot.split('-')[3]);
    
    if (isCurrentlyChecked && !isPending) {
      deleteAvailability(agentId, dateStr, hourValue)
        .then(() => {
          console.log(`Usunięto dostępność: Agent ${agentId}, data ${dateStr}, godzina ${hourValue}`);
        })
        .catch(error => {
          console.error('Błąd podczas usuwania dostępności:', error);
          setAvailability(prev => ({
            ...prev,
            [agentId]: { ...(prev[agentId] || {}), [slot]: true }
          }));
        });
    } else {
      setPendingChanges(prev => {
        const existingIndex = prev.findIndex(
          change => change.agentId === agentId && change.slot === slot
        );
        
        if (existingIndex >= 0) {
          return prev.filter((_, index) => index !== existingIndex);
        }
        
        return [...prev, { 
          agentId, 
          date: dateStr,
          hour: hourValue, 
          slot,
          isAvailable: !isCurrentlyChecked
        }];
      });
    }
  };

  const saveAllChanges = async () => {
    if (pendingChanges.length === 0) {
      alert('Brak zmian do zapisania');
      return;
    }
    
    try {
      console.log("Zapisywane zmiany:", pendingChanges);
      
      const savePromises = pendingChanges.map(change => {
        return saveAvailability(
          change.agentId, 
          change.date, 
          change.hour, 
          change.isAvailable
        );
      });
      
      const results = await Promise.all(savePromises);
      console.log("Wyniki zapisywania:", results);
      
      await loadAvailability();
      
      setPendingChanges([]);
      
    } catch (error) {
      console.error('Błąd podczas zapisywania zmian:', error);
      alert('Wystąpił błąd podczas zapisywania zmian.');
    }
  };
  
  const goToSchedule = async () => {
    if (pendingChanges.length > 0) {
      const saveFirst = window.confirm('Masz niezapisane zmiany. Czy chcesz je zapisać przed przejściem do grafiku?');
      if (saveFirst) {
        await saveAllChanges();
      }
    }
    
    setIsLoading(true);
    try {
      const sched = await fetchSchedule(agents, availability, areas, selectedWeek);
      setSchedule(sched);
      setPage(2);
    } catch (error) {
      console.error('Błąd podczas pobierania harmonogramu:', error);
      alert('Wystąpił błąd podczas pobierania harmonogramu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const agentsData = await fetchAgents();
        setAgents(agentsData);
        
        if (agentsData.length > 0 && !selectedAgent) {
          setAgent(agentsData[0]);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania agentów:', error);
      }
    };
    
    loadAgents();
  }, [selectedAgent]);

  const changeWeek = (direction) => {
    console.log(`Zmiana tygodnia: ${direction > 0 ? 'następny' : 'poprzedni'}`);
    const newDates = selectedWeek.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + (direction * 7));
      return newDate;
    });
    setSelectedWeek(newDates);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pl-PL', { 
      month: 'short',
      day: 'numeric' 
    });
  };

  return (
    <div className="app-container">
      <div className="navbar">
        <div className="nav-left">
          <button 
            onClick={() => setPage(1)} 
            className={page === 1 ? 'active' : ''}
            disabled={isLoading}
          >
            Dostępność agentów
          </button>
          
          <button 
            onClick={() => goToSchedule()} 
            className={page === 2 ? 'active' : ''}
            disabled={isLoading}
          >
            Grafik pracy
          </button>
          
          <button 
            onClick={() => setPage(3)} 
            className={page === 3 ? 'active' : ''}
            disabled={isLoading}
          >
            Wymagana liczba osób
          </button>
          
          <button 
            onClick={() => setPage(4)} 
            className={page === 4 ? 'active' : ''}
            disabled={isLoading}
          >
            Zarządzanie umiejętnościami
          </button>
        </div>
        
        <div className="nav-right">
          <button onClick={() => changeWeek(-1)} className="week-btn">❮ Poprzedni tydzień</button>
          <div className="week-display">
            <strong>
              {formatDate(selectedWeek[0])} - {formatDate(selectedWeek[6])}
            </strong>
          </div>
          <button onClick={() => changeWeek(1)} className="week-btn">Następny tydzień ❯</button>
        </div>
      </div>

      <div className="content">
        {agents.length === 0 ? (
          <div>Brak danych agentów. Dodaj agentów w systemie.</div>
        ) : isLoading ? (
          <div>Ładowanie danych...</div>
        ) : page === 1 ? (
          <AvailabilityPage
            agents={agents}
            selectedAgent={selectedAgent}
            availability={availability}
            onSelectAgent={setAgent}
            onToggleSlot={toggleSlot}
            selectedWeek={selectedWeek}
            pendingChanges={pendingChanges}
            onSaveChanges={saveAllChanges}
          />
        ) : page === 2 ? (
          <SchedulePage
            agents={agents}
            schedule={schedule}
            areas={areas}
            selectedWeek={selectedWeek}
          />
        ) : page === 3 ? (
          <RequiredAvailabilityPage
            onNavigateToAvailability={() => setPage(1)}
          />
        ) : page === 4 ? (
          <SkillManagementPage />
        ) : null}
      </div>
    </div>
  );
}
