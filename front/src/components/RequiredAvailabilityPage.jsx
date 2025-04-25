import React, { useState, useEffect } from 'react';

const RequiredAvailabilityPage = ({ onNavigateToAvailability }) => {
  const [requiredPeople, setRequiredPeople] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const hours = [9, 10, 11, 12, 13, 14, 15, 16];

  // Pobierz istniejące dane przy ładowaniu komponentu
  useEffect(() => {
    fetchRequiredAvailability();
  }, []);

  const fetchRequiredAvailability = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/required-availability');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Przekształć dane z tablicy do obiektu indeksowanego godzinami
      const requiredByHour = {};
      data.forEach(item => {
        requiredByHour[item.hour] = item.reqpeople;
      });
      
      setRequiredPeople(requiredByHour);
      setIsLoading(false);
    } catch (error) {
      console.error('Błąd podczas pobierania danych:', error);
      setMessage('Wystąpił błąd podczas pobierania danych');
      setIsLoading(false);
      
      // Inicjalizuj pustymi wartościami w przypadku błędu
      const emptyValues = {};
      hours.forEach(hour => {
        emptyValues[hour] = 0;
      });
      setRequiredPeople(emptyValues);
    }
  };

  const handleInputChange = (hour, value) => {
    // Konwertuj wartość wejściową na liczbę całkowitą
    const numValue = parseInt(value, 10) || 0;
    
    setRequiredPeople(prev => ({
      ...prev,
      [hour]: numValue
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    
    try {
      // Przekształć obiekt na tablicę obiektów do wysłania
      const dataToSave = Object.entries(requiredPeople).map(([hour, reqpeople]) => ({
        hour: parseInt(hour, 10),
        reqpeople
      }));
      
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
        <p>Określ wymaganą liczbę osób dla każdej godziny:</p>
        
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Godzina</th>
              <th>Wymagana liczba osób</th>
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour}>
                <td>{hour}:00</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={requiredPeople[hour] || 0}
                    onChange={(e) => handleInputChange(hour, e.target.value)}
                    style={{ width: '80px', padding: '6px' }}
                  />
                </td>
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
