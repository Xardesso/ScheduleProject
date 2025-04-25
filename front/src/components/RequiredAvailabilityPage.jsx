import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles.css';

const RequiredAvailabilityPage = ({ onNavigateToAvailability }) => {
  const [requiredPeople, setRequiredPeople] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const initialRenderRef = useRef(true);

  const hours = [9, 10, 11, 12, 13, 14, 15, 16];
  const positions = [
    { id: 1, name: "Obsługa klienta" },
    { id: 2, name: "Pozyskiwanie klienta" },
    { id: 3, name: "Wsparcie techniczne" }
  ];

  // Używamy useCallback, aby funkcja fetchRequiredAvailability nie była tworzona na nowo przy każdym renderze
  const fetchRequiredAvailability = useCallback(async () => {
    if (!initialRenderRef.current) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/required-availability');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Przekształć dane z tablicy do struktury zagnieżdżonej
      const requiredByHour = {};
      
      // Inicjalizuj dla wszystkich godzin i stanowisk
      hours.forEach(hour => {
        requiredByHour[hour] = {};
        positions.forEach(position => {
          requiredByHour[hour][position.id] = 1; // Minimalna wartość to 1
        });
      });
      
      // Wypełnij danymi z API
      data.forEach(item => {
        const hour = item.hour;
        positions.forEach(position => {
          const fieldName = `reqpeople_${position.id}`;
          if (item[fieldName] !== undefined) {
            requiredByHour[hour][position.id] = Math.max(1, item[fieldName]); // Minimum 1
          }
        });
      });
      
      setRequiredPeople(requiredByHour);
      
    } catch (error) {
      console.error('Błąd podczas pobierania danych:', error);
      
      // Inicjalizuj wartościami domyślnymi w przypadku błędu
      const defaultValues = {};
      hours.forEach(hour => {
        defaultValues[hour] = {};
        positions.forEach(position => {
          defaultValues[hour][position.id] = 1; // Minimum 1
        });
      });
      
      setRequiredPeople(defaultValues);
    } finally {
      setIsLoading(false);
      initialRenderRef.current = false;
    }
  }, [hours, positions]);

  useEffect(() => {
    fetchRequiredAvailability();
  }, [fetchRequiredAvailability]);

  const handleInputChange = useCallback((hour, positionId, value) => {
    // Konwertuj wartość wejściową na liczbę całkowitą i upewnij się, że jest >= 1
    const numValue = Math.max(1, parseInt(value, 10) || 1);
    
    setRequiredPeople(prev => ({
      ...prev,
      [hour]: {
        ...prev[hour],
        [positionId]: numValue
      }
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setMessage('');
    
    try {
      // Przekształć strukturę zagnieżdżoną na tablicę rekordów do zapisu
      const dataToSave = [];
      
      hours.forEach(hour => {
        const record = {
          hour: parseInt(hour, 10)
        };
        
        // Dodaj pola reqpeople_X, upewniając się, że minimalna wartość to 1
        positions.forEach(position => {
          record[`reqpeople_${position.id}`] = Math.max(1, requiredPeople[hour][position.id] || 1);
        });
        
        dataToSave.push(record);
      });
      
      // Wysłanie danych do API
      const response = await fetch('http://127.0.0.1:8000/api/required-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setMessage('Dane zostały zapisane pomyślnie');
    } catch (error) {
      console.error('Błąd podczas zapisywania danych:', error);
      setMessage('Wystąpił błąd podczas zapisywania danych');
    } finally {
      setIsSaving(false);
    }
  }, [hours, positions, requiredPeople]);

  if (isLoading) {
    return <div className="loading">Ładowanie danych...</div>;
  }

  return (
    <div className="required-container">
      <h2>Ustawienia wymaganej liczby osób</h2>
      
      <p className="required-description">
        Określ wymaganą liczbę osób dla każdej godziny i stanowiska:
      </p>
      
      <div className="table-wrapper">
        <table className="required-table">
          <thead>
            <tr>
              <th className="hour-header">Godzina</th>
              {positions.map(position => (
                <th key={position.id}>{position.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td className="hour-cell">{hour}:00</td>
                {positions.map(position => (
                  <td key={position.id} className="input-cell">
                    <input
                      type="number"
                      min="1"
                      value={requiredPeople[hour]?.[position.id] || 1}
                      onChange={(e) => handleInputChange(hour, position.id, e.target.value)}
                      className="number-input"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {message && (
        <div className={`message ${message.includes('błąd') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <div className="buttons">
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="save-btn"
        >
          {isSaving ? 'Zapisywanie...' : 'Zapisz dane'}
        </button>
        
        <button 
          onClick={onNavigateToAvailability}
          className="nav-btn"
        >
          Przejdź do dostępności
        </button>
      </div>
    </div>
  );
};

export default RequiredAvailabilityPage;
