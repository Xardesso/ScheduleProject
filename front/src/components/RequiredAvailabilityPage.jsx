import React, { useState, useEffect, useCallback, useMemo } from 'react';

const RequiredAvailabilityPage = ({ onNavigateToAvailability }) => {
  const [requiredPeople, setRequiredPeople] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Użyj useMemo do zapamiętania tablic hours i positions
  const hours = useMemo(() => [9, 10, 11, 12, 13, 14, 15, 16], []);
  
  const positions = useMemo(() => [
    { id: 1, name: "Obsługa klienta" },
    { id: 2, name: "Pozyskiwanie klienta" },
    { id: 3, name: "Wsparcie techniczne" }
  ], []);

  // Definiujemy fetchRequiredAvailability jako useCallback, aby uniknąć problemów z ESLint
  const fetchRequiredAvailability = useCallback(async () => {
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
          requiredByHour[hour][position.id] = 0;
        });
      });
      
      // Wypełnij danymi z API
      data.forEach(item => {
        const hour = item.hour;
        // Obsługa danych z API - zakładamy, że API zwraca dla każdego rekordu:
        // { id, hour, reqpeople_1, reqpeople_2, reqpeople_3 }
        positions.forEach(position => {
          // Pobierz wartość dla danej pozycji
          const fieldName = `reqpeople_${position.id}`;
          if (item[fieldName] !== undefined) {
            requiredByHour[hour][position.id] = item[fieldName];
          }
        });
      });
      
      setRequiredPeople(requiredByHour);
    } catch (error) {
      console.error('Błąd podczas pobierania danych:', error);
      setMessage('Wystąpił błąd podczas pobierania danych');
      
      // Inicjalizuj pustymi wartościami w przypadku błędu
      const emptyValues = {};
      hours.forEach(hour => {
        emptyValues[hour] = {};
        positions.forEach(position => {
          emptyValues[hour][position.id] = 0;
        });
      });
      
      setRequiredPeople(emptyValues);
    } finally {
      setIsLoading(false);
    }
  }, [hours, positions]);  // Dodaj hours i positions jako zależności

  // Pobierz istniejące dane przy ładowaniu komponentu
  useEffect(() => {
    fetchRequiredAvailability();
  }, [fetchRequiredAvailability]);

  const handleInputChange = (hour, positionId, value) => {
    // Konwertuj wartość wejściową na liczbę całkowitą
    const numValue = parseInt(value, 10) || 0;
    
    setRequiredPeople(prev => ({
      ...prev,
      [hour]: {
        ...prev[hour],
        [positionId]: numValue
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    
    try {
      // Przekształć strukturę zagnieżdżoną na tablicę rekordów do zapisu
      const dataToSave = [];
      
      hours.forEach(hour => {
        const record = {
          hour: parseInt(hour, 10)
        };
        
        // Dodaj pola reqpeople_X
        positions.forEach(position => {
          record[`reqpeople_${position.id}`] = requiredPeople[hour][position.id] || 0;
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
  };

  if (isLoading) {
    return <div>Ładowanie danych...</div>;
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Ustawienia wymaganej liczby osób</h2>
      
      <div style={{ marginBottom: 20 }}>
        <p>Określ wymaganą liczbę osób dla każdej godziny i stanowiska:</p>
        
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Godzina</th>
              {positions.map(position => (
                <th key={position.id}>{position.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td>{hour}:00</td>
                {positions.map(position => (
                  <td key={position.id}>
                    <input
                      type="number"
                      min="0"
                      value={(requiredPeople[hour] && requiredPeople[hour][position.id]) || 0}
                      onChange={(e) => handleInputChange(hour, position.id, e.target.value)}
                      style={{ width: '80px', padding: '6px' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          backgroundColor: message.includes('błąd') ? '#ffebee' : '#e8f5e9',
          border: `1px solid ${message.includes('błąd') ? '#ffcdd2' : '#c8e6c9'}`,
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSaving ? 'wait' : 'pointer'
          }}
        >
          {isSaving ? 'Zapisywanie...' : 'Zapisz dane'}
        </button>
        
        <button 
          onClick={onNavigateToAvailability}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Przejdź do dostępności
        </button>
      </div>
    </div>
  );
};

export default RequiredAvailabilityPage;
