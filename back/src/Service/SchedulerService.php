<?php
// src/Service/SchedulerService.php
namespace App\Service;

use App\Entity\Agent;
use App\Entity\Area;
use App\Entity\Skill;
use App\Entity\Availability;
use App\Entity\RequiredAvailability;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class SchedulerService
{
    private $entityManager;
    private $logger;

    public function __construct(
        EntityManagerInterface $entityManager,
        LoggerInterface $logger = null
    ) {
        $this->entityManager = $entityManager;
        $this->logger = $logger;
    }

    public function generateSchedule(array $agents, array $availability, array $areas, array $dateRange = null): array
    {
        $this->log('Rozpoczęcie generowania harmonogramu', [
            'liczba_agentów' => count($agents),
            'liczba_obszarów' => count($areas),
            'zakres_dat' => $dateRange
        ]);

        try {
            // 1. Normalizacja obszarów - upewnienie się, że wszystkie mają ID
            $normalizedAreas = [];
            foreach ($areas as $index => $area) {
                $id = null;
                $name = null;
                
                if (is_array($area)) {
                    $id = isset($area['id']) ? $area['id'] : null;
                    $name = isset($area['name']) ? $area['name'] : null;
                } elseif (is_object($area)) {
                    $id = method_exists($area, 'getId') ? $area->getId() : (property_exists($area, 'id') ? $area->id : null);
                    $name = method_exists($area, 'getName') ? $area->getName() : (property_exists($area, 'name') ? $area->name : null);
                }
                
                // Jeśli brak ID, użyj indeksu + 1
                if ($id === null || !is_numeric($id)) {
                    $id = $index + 1;
                }
                
                // Jeśli brak nazwy, użyj "Obszar X"
                if ($name === null) {
                    $name = "Obszar " . $id;
                }
                
                $normalizedAreas[] = [
                    'id' => (int)$id,
                    'name' => $name
                ];
            }
            
            $this->log('Znormalizowane obszary', ['areas' => $normalizedAreas]);
            $areas = $normalizedAreas;
            
            // 2. Zbuduj mapę umiejętności
            $skillsMap = [];
            $skills = $this->entityManager->getRepository(Skill::class)->findAll();
            
            foreach ($skills as $skill) {
                $areaId = $skill->getArea()->getId();
                $agentId = $skill->getAgent()->getId();
                $efficiency = $skill->getEfficiency();
                
                if (!isset($skillsMap[$areaId])) {
                    $skillsMap[$areaId] = [];
                }
                
                $skillsMap[$areaId][$agentId] = $efficiency;
            }
            
            $this->log('Mapa umiejętności', [
                'liczba_obszarów' => count($skillsMap),
                'przykład' => !empty($skillsMap) ? array_slice($skillsMap, 0, 1) : []
            ]);
            
            // 3. Przygotuj macierz dostępności
            $availMatrix = [];
            
            // WAŻNA ZMIANA: Używaj daty z parametru dateRange zamiast "monday this week"
            if ($dateRange && isset($dateRange['startDate'])) {
                $startDate = new \DateTime($dateRange['startDate']);
            } else {
                $startDate = new \DateTime('monday this week');
            }
            
            $this->log('Data początkowa tygodnia', ['startDate' => $startDate->format('Y-m-d')]);
            
            // Logowanie formatu dostępności
            $this->log('Format dostępności', [
                'przykład_klucza' => array_keys($availability)[0] ?? 'brak',
                'przykład_wartości' => !empty($availability) ? array_slice($availability, 0, 1) : []
            ]);
            
            foreach ($availability as $agentId => $slots) {
                // Sprawdź format danych (może być różny)
                if (is_array($slots)) {
                    foreach ($slots as $slotKey => $isAvailable) {
                        if (!$isAvailable) continue;
                        
                        // Spróbuj rozpoznać format daty
                        $parts = explode('-', $slotKey);
                        if (count($parts) >= 4) {
                            // Format: "2025-04-22-9"
                            $dateStr = $parts[0] . '-' . $parts[1] . '-' . $parts[2];
                            $hour = (int)$parts[3];
                            
                            $slotDate = new \DateTime($dateStr);
                            
                            // WAŻNA ZMIANA: Oblicz dzień tygodnia (0-6) z daty, nie z różnicy dni
                            $day = (int)$slotDate->format('N') - 1; // 0 = poniedziałek, 6 = niedziela
                            
                            // Sprawdź, czy data mieści się w wybranym tygodniu
                            $isInSelectedWeek = true;
                            if ($dateRange && isset($dateRange['startDate']) && isset($dateRange['endDate'])) {
                                $rangeStart = new \DateTime($dateRange['startDate']);
                                $rangeEnd = new \DateTime($dateRange['endDate']);
                                $rangeEnd->setTime(23, 59, 59); // Koniec dnia
                                
                                $isInSelectedWeek = $slotDate >= $rangeStart && $slotDate <= $rangeEnd;
                            }
                            
                            // Dodaj tylko sloty z wybranego tygodnia
                            if ($isInSelectedWeek && $hour >= 9 && $hour <= 16) {
                                if (!isset($availMatrix[$day])) {
                                    $availMatrix[$day] = [];
                                }
                                if (!isset($availMatrix[$day][$hour])) {
                                    $availMatrix[$day][$hour] = [];
                                }
                                $availMatrix[$day][$hour][] = (int)$agentId;
                                
                                $this->log("Agent $agentId dostępny w dniu $day o godzinie $hour (data: $dateStr)");
                            }
                        }
                    }
                }
            }
            
            // 4. Budowa harmonogramu
            $schedule = [];
            for ($day = 0; $day < 7; $day++) {
                $schedule[$day] = [];
                for ($hour = 9; $hour <= 16; $hour++) {
                    $schedule[$day][$hour] = [];
                    
                    // Dostępni agenci w tym czasie
                    $availableAgents = isset($availMatrix[$day][$hour]) ? $availMatrix[$day][$hour] : [];
                    
                    $this->log("Dostępni agenci dla dnia $day, godz. $hour", [
                        'agenci' => $availableAgents,
                        'liczba' => count($availableAgents)
                    ]);
                    
                    // Przydziel agentów do obszarów
                    foreach ($areas as $area) {
                        $areaId = (int)$area['id'];
                        
                        // Inicjalizuj jako pustą tablicę zamiast null
                        $schedule[$day][$hour][$areaId] = [];
                        
                        if (empty($availableAgents)) continue;
                        
                        // Pobierz liczbę wymaganych osób dla tego obszaru i godziny
                        $requiredPeople = $this->getRequiredPeopleCount($areaId, $hour);
                        
                        // Sortuj dostępnych agentów według efektywności dla danego obszaru
                        $candidates = [];
                        foreach ($availableAgents as $agentId) {
                            $efficiency = isset($skillsMap[$areaId][$agentId]) ? $skillsMap[$areaId][$agentId] : 0;
                            $candidates[$agentId] = $efficiency;
                        }
                        
                        // Sortuj malejąco według efektywności (priorytet dla większego skilla)
                        arsort($candidates);
                        
                        $this->log("Wymagana liczba osób dla obszaru $areaId o godzinie $hour: $requiredPeople");
                        $this->log("Kandydaci posortowani według efektywności:", $candidates);
                        
                        // Przydziel tylu agentów, ilu jest wymaganych (lub mniej, jeśli brakuje dostępnych)
                        $assignedCount = 0;
                        $assignedAgents = [];
                        
                        foreach ($candidates as $agentId => $efficiency) {
                            if ($assignedCount >= $requiredPeople) break;
                            
                            // Dodaj agenta do przydzielonych
                            $assignedAgents[] = (int)$agentId;
                            $assignedCount++;
                            
                            // Usuń przydzielonego agenta z dostępnych
                            $availableAgents = array_values(array_filter($availableAgents, function($id) use ($agentId) {
                                return $id != $agentId;
                            }));
                            
                            $this->log("Przydzielono agenta $agentId do obszaru $areaId (wydajność: $efficiency)");
                        }
                        
                        // Zapisz przydzielonych agentów w harmonogramie (jako tablicę)
                        $schedule[$day][$hour][$areaId] = !empty($assignedAgents) ? $assignedAgents : [];
                        
                        $this->log("Przydzielono łącznie $assignedCount agentów do obszaru $areaId (wymagane: $requiredPeople)");
                    }
                }
            }
            
            $this->log('Harmonogram wygenerowany pomyślnie');
            return $schedule;
            
        } catch (\Exception $e) {
            $this->log('Błąd podczas generowania harmonogramu: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ], 'error');
            
            // W przypadku błędu, wygeneruj pusty harmonogram
            return $this->getEmptySchedule($areas);
        }
    }
    
    /**
     * Pobiera wymaganą liczbę osób dla danego obszaru i godziny
     */
    private function getRequiredPeopleCount(int $areaId, int $hour): int
    {
        try {
            $requiredAvailability = $this->entityManager->getRepository(RequiredAvailability::class)
                ->findOneBy(['hour' => $hour]);
            
            if (!$requiredAvailability) {
                return 1; // Domyślnie 1 osoba jeśli nie znaleziono rekordu
            }
            
            // Pobierz wartość dla odpowiedniego obszaru
            $methodName = "getReqpeople{$areaId}";
            if (method_exists($requiredAvailability, $methodName)) {
                $value = $requiredAvailability->$methodName();
                return $value !== null ? max(1, $value) : 1; // Min. 1 osoba
            }
            
            return 1; // Domyślnie 1 osoba
        } catch (\Exception $e) {
            $this->log('Błąd podczas pobierania wymaganej liczby osób: ' . $e->getMessage(), [], 'error');
            return 1; // Domyślnie 1 osoba w przypadku błędu
        }
    }
    
    private function getEmptySchedule(array $areas = []): array
    {
        $schedule = [];
        for ($day = 0; $day < 7; $day++) {
            $schedule[$day] = [];
            for ($hour = 9; $hour <= 16; $hour++) {
                $schedule[$day][$hour] = [];
                
                // Dodaj puste pola dla wszystkich obszarów
                foreach ($areas as $area) {
                    if (isset($area['id'])) {
                        $areaId = (int)$area['id'];
                        $schedule[$day][$hour][$areaId] = []; // Pusta tablica zamiast null
                    }
                }
            }
        }
        return $schedule;
    }
    
    private function log(string $message, array $context = [], string $level = 'info'): void
    {
        if ($this->logger) {
            switch ($level) {
                case 'error':
                    $this->logger->error($message, $context);
                    break;
                case 'warning':
                    $this->logger->warning($message, $context);
                    break;
                default:
                    $this->logger->info($message, $context);
            }
        }
    }
}
