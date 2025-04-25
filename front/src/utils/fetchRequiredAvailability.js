// utils/fetchRequiredAvailability.js

/**
 * Pobiera dane o wymaganej liczbie osób z API
 * @returns {Promise<Array>} Promise zwracający tablicę z danymi o wymaganej liczbie osób
 */
export const fetchRequiredAvailability = async () => {
    try {
      console.log("Rozpoczynam pobieranie danych o wymaganej liczbie osób");
      
      const response = await fetch('http://127.0.0.1:8000/api/required-availability');
      
      console.log("Status odpowiedzi:", response.status);
      
      if (!response.ok) {
        // Próba odczytania szczegółowego komunikatu błędu
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Nie można odczytać treści błędu';
        }
        
        console.error(`Błąd HTTP: ${response.status}`, errorText);
        throw new Error(`HTTP error! Status: ${response.status}. Details: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Pobrane dane wymaganej liczby osób:", data);
      
      // Obsługa pustego wyniku (tabela jest pusta)
      if (Array.isArray(data) && data.length === 0) {
        console.log("API zwróciło pustą tablicę - brak danych w tabeli requiredavailability");
        // Zwróć domyślne wartości dla godzin 9-16
        return generateDefaultData();
      }
      
      return data;
    } catch (error) {
      console.error('Błąd podczas pobierania wymaganej liczby osób:', error);
      // W przypadku błędu zwróć domyślne dane, aby nie zepsuć interfejsu
      return generateDefaultData();
    }
  };
  
  /**
   * Zapisuje dane o wymaganej liczbie osób
   * @param {Array} data - Dane do zapisania
   * @returns {Promise<Object>} Promise zwracający wynik operacji
   */
  export const saveRequiredAvailability = async (data) => {
    try {
      console.log("Zapisuję dane wymaganej liczby osób:", data);
      
      const response = await fetch('http://127.0.0.1:8000/api/required-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        // Próba odczytania szczegółowego komunikatu błędu
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Nie można odczytać treści błędu';
        }
        
        console.error(`Błąd HTTP: ${response.status}`, errorText);
        throw new Error(`HTTP error! Status: ${response.status}. Details: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Wynik zapisywania:", result);
      return result;
    } catch (error) {
      console.error('Błąd podczas zapisywania wymaganej liczby osób:', error);
      throw error;
    }
  };

/**
 * Generuje domyślne dane dla wszystkich godzin
 * @returns {Array} Tablica z domyślnymi danymi
 */
function generateDefaultData() {
  const defaultData = [];
  for (let hour = 9; hour <= 16; hour++) {
    defaultData.push({
      hour,
      reqpeople_1: 0,
      reqpeople_2: 0,
      reqpeople_3: 0
    });
  }
  console.log("Wygenerowano domyślne dane:", defaultData);
  return defaultData;
}
