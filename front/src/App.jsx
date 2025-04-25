import React, { useState, useEffect } from 'react';
import { fetchAgents } from './utils/fetchAgents';
import { areas } from './constants';
import AvailabilityPage from './components/AvailabilityPage';
import SchedulePage from './components/SchedulePage';
import { fetchSchedule } from './utils/fetchSchedule';
import { saveAvailability, fetchAvailability, deleteAvailability } from './utils/fetchAvailability';

export default function App() {
  const [page, setPage] = useState(1);
  const [selectedAgent, setAgent] = useState(null);
  const [availability, setAvailability] = useState({});
  const [schedule, setSchedule] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekDates());
  // Stan do śledzenia niezapisanych zmian
  const [pendingChanges, setPendingChanges] = useState([]);
  // Stan do śledzenia ładowania
  const [isLoading, setIsLoading] = useState(false);

  // Funkcja zwracająca daty aktualnego tygodnia
  function getCurrentWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = niedziela, 1 = poniedziałek, itd.
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Dostosuj dla poniedziałku jako początku tygodnia
    
    const monday = new Date(now.setDate(diff));
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }

  // Zmodyfikowana funkcja do ładowania zapisanych dostępności
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const availabilityData = await fetchAvailability();
        
        if (availabilityData && Array.isArray(availabilityData)) {
          // Przekształć dane z API na format używany przez komponent
          const formattedData = {};
          
          availabilityData.forEach(item => {
            const { agentId, date, hour, isAvailable } = item;
            if (!formattedData[agentId]) {
              formattedData[agentId] = {};
            }
            
            // Utwórz klucz slotu w formacie YYYY-MM-DD-H
            const slotKey = `${date}-${hour}`;
            formattedData[agentId][slotKey] = isAvailable;
          });
          
          console.log("Załadowane dane dostępności:", formattedData);
          setAvailability(formattedData);
        } else {
          console.error("Nieprawidłowy format danych z API:", availabilityData);
        }
      } catch (error) {
        console.error("Błąd podczas ładowania dostępności:", error);
      }
    };
    
    loadAvailability();
  }, []);

  // NOWY EFEKT: Aktualizuje harmonogram, gdy zmienia się wybrany tydzień
  useEffect(() => {
    // Pobierz nowy harmonogram tylko jeśli jesteśmy na stronie harmonogramu
    if (page === 2 && agents.length > 0) {
      const updateScheduleForWeek = async () => {
        setIsLoading(true);
        try {
          const newSchedule = await fetchSchedule(agents, availability, areas);
          setSchedule(newSchedule);
        } catch (error) {
          console.error('Błąd podczas aktualizacji harmonogramu:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      updateScheduleForWeek();
    }
  }, [selectedWeek, page, agents]);

  // Zmodyfikowana funkcja toggleSlot obsługująca odznaczanie niezapisanych zmian
  const toggleSlot = (agentId, slot, slotInfo) => {
    console.log(`Toggle slot: Agent ${agentId}, Slot ${slot}`);
    
    // Sprawdź, czy slot jest w pendingChanges (oczekujące zmiany)
    const isPending = pendingChanges.some(
      change => change.agentId === agentId && change.slot === slot
    );
    
    // Aktualna wartość w UI
    const isCurrentlyChecked = availability[agentId]?.[slot] || false;
    
    // Aktualizacja lokalnego stanu UI
    setAvailability(prev => ({
      ...prev,
      [agentId]: { ...(prev[agentId] || {}), [slot]: !isCurrentlyChecked }
    }));
    
    // Wyodrębnij datę i godzinę
    const { date, hour } = slotInfo || {};
    const dateStr = date || slot.split('-').slice(0, 3).join('-');
    const hourValue = hour || parseInt(slot.split('-')[3]);
    
    if (isCurrentlyChecked && !isPending) {
      // Jeśli slot jest obecnie zaznaczony w bazie (nie jest w pendingChanges)
      // usuń z bazy danych
      deleteAvailability(agentId, dateStr, hourValue)
        .then(() => {
          console.log(`Usunięto dostępność: Agent ${agentId}, data ${dateStr}, godzina ${hourValue}`);
        })
        .catch(error => {
          console.error('Błąd podczas usuwania dostępności:', error);
          // Przywróć poprzedni stan w przypadku błędu
          setAvailability(prev => ({
            ...prev,
            [agentId]: { ...(prev[agentId] || {}), [slot]: true }
          }));
        });
    } else {
      // Zarządzanie listą oczekujących zmian
      setPendingChanges(prev => {
        // Sprawdź, czy zmiana już istnieje w pendingChanges
        const existingIndex = prev.findIndex(
          change => change.agentId === agentId && change.slot === slot
        );
        
        // Jeśli zmiana już istnieje, usuń ją (toggle)
        if (existingIndex >= 0) {
          return prev.filter((_, index) => index !== existingIndex);
        }
        
        // W przeciwnym razie, dodaj nową zmianę
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

  // Funkcja do zapisywania wszystkich zmian naraz
  const saveAllChanges = async () => {
    if (pendingChanges.length === 0) {
      alert('Brak zmian do zapisania');
      return;
    }
    
    try {
      console.log("Zapisywane zmiany:", pendingChanges);
      
      // Zapisuj każdą zmianę z jej rzeczywistymi wartościami
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
      
      // Po zapisaniu, odśwież dane dostępności
      const freshData = await fetchAvailability();
      if (freshData && Array.isArray(freshData)) {
        const formattedData = {};
        
        freshData.forEach(item => {
          const { agentId, date, hour, isAvailable } = item;
          if (!formattedData[agentId]) {
            formattedData[agentId] = {};
          }
          
          const slotKey = `${date}-${hour}`;
          formattedData[agentId][slotKey] = isAvailable;
        });
        
        setAvailability(formattedData);
      }
      
      // Wyczyść listę oczekujących zmian
      setPendingChanges([]);
      
      alert('Wszystkie zmiany zostały zapisane!');
    } catch (error) {
      console.error('Błąd podczas zapisywania zmian:', error);
      alert('Wystąpił błąd podczas zapisywania zmian.');
    }
  };
  
  // Funkcja do przejścia do widoku grafiku
  const goToSchedule = async () => {
    // Jeśli są niezapisane zmiany, zapytaj użytkownika co chce zrobić
    if (pendingChanges.length > 0) {
      const saveFirst = window.confirm('Masz niezapisane zmiany. Czy chcesz je zapisać przed przejściem do grafiku?');
      if (saveFirst) {
        await saveAllChanges();
      }
    }
    
    setIsLoading(true);
    try {
      const sched = await fetchSchedule(agents, availability, areas);
      setSchedule(sched);
      setPage(2);
    } catch (error) {
      console.error('Błąd podczas pobierania harmonogramu:', error);
      alert('Wystąpił błąd podczas pobierania harmonogramu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Efekt do pobierania agentów przy zamontowaniu komponentu
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
  }, []);

  // Funkcja do zmiany tygodnia
  const changeWeek = (direction) => {
    const newDates = selectedWeek.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + (direction * 7));
      return newDate;
    });
    setSelectedWeek(newDates);
  };

  // Formatowanie daty do wyświetlenia
  const formatDate = (date) => {
    return date.toLocaleDateString('pl-PL', { 
      month: 'short',
      day: 'numeric' 
    });
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      {/* Komponent wyboru tygodnia */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}>
        <button onClick={() => changeWeek(-1)}>❮ Poprzedni tydzień</button>
        <div style={{ margin: '0 15px' }}>
          <strong>
            {formatDate(selectedWeek[0])} - {formatDate(selectedWeek[6])}
          </strong>
        </div>
        <button onClick={() => changeWeek(1)}>Następny tydzień ❯</button>
      </div>

      <button 
        onClick={() => page === 1 ? goToSchedule() : setPage(1)}
        style={{ marginBottom: 20 }}
        disabled={isLoading}
      >
        {isLoading ? 'Ładowanie...' : page === 1 ? '→ Pokaż grafik' : '← Zmień dostępność'}
      </button>

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
      ) : (
        <SchedulePage
          agents={agents}
          schedule={schedule}
          areas={areas}
          selectedWeek={selectedWeek}
        />
      )}
    </div>
  );
}