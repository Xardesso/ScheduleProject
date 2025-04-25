<?php
// src/Controller/ScheduleController.php
namespace App\Controller;

use App\Service\SchedulerService;
use App\Entity\Agent;
use App\Entity\Area;
use App\Entity\Skill;
use App\Entity\Availability;
use App\Entity\Schedule;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class ScheduleController extends AbstractController
{
    private $logger;

    public function __construct(
        private SchedulerService $scheduler,
        private EntityManagerInterface $entityManager,
        LoggerInterface $logger = null
    ) {
        $this->logger = $logger;
    }

    #[Route('/api/schedule', methods: ['POST'])]
    public function createSchedule(Request $request): JsonResponse
    {
        try {
            // Logowanie otrzymanego żądania
            if ($this->logger) {
                $this->logger->info('Otrzymano żądanie generowania grafiku', [
                    'ip' => $request->getClientIp(),
                    'content_length' => $request->headers->get('Content-Length')
                ]);
            }
            
            $data = json_decode($request->getContent(), true);
            
            // Walidacja danych wejściowych
            if (empty($data)) {
                return $this->json([
                    'error' => 'Brak danych wejściowych lub nieprawidłowy format JSON'
                ], Response::HTTP_BAD_REQUEST);
            }
            
            // Przekazanie danych do serwisu
            $agents = $data['agents'] ?? [];
            $availability = $data['availability'] ?? [];
            $areas = $data['areas'] ?? [];
            
            // Logowanie danych przed generowaniem
            if ($this->logger) {
                $this->logger->info('Dane do generowania grafiku', [
                    'agents_count' => count($agents),
                    'areas_count' => count($areas)
                ]);
            }
            
            // Generowanie harmonogramu
            $schedule = $this->scheduler->generateSchedule($agents, $availability, $areas);
            
            // Zwrócenie wyniku jako JSON
            return $this->json([
                'schedule' => $schedule
            ]);
            
        } catch (\Exception $e) {
            // Logowanie błędu
            if ($this->logger) {
                $this->logger->error('Błąd podczas generowania grafiku: ' . $e->getMessage(), [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
            
            // Zwrócenie informacji o błędzie
            return $this->json([
                'error' => 'Wystąpił błąd podczas generowania grafiku',
                'details' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/schedule/debug', methods: ['GET'])]
    public function debugSchedule(): JsonResponse
    {
        try {
            // Przykładowe dane testowe
            $agents = $this->entityManager->getRepository(Agent::class)->findAll();
            $areas = $this->entityManager->getRepository(Area::class)->findAll();
            
            // Przygotowanie danych w formacie oczekiwanym przez serwis
            $agentsData = [];
            foreach ($agents as $agent) {
                $agentsData[] = [
                    'id' => $agent->getId(),
                    'name' => $agent->getName()
                ];
            }
            
            $areasData = [];
            foreach ($areas as $area) {
                $areasData[] = [
                    'id' => $area->getId(),
                    'name' => $area->getName()
                ];
            }
            
            // Pobierz umiejętności
            $skills = $this->entityManager->getRepository(Skill::class)->findAll();
            $skillsData = [];
            foreach ($skills as $skill) {
                $skillsData[] = [
                    'id' => $skill->getId(),
                    'agentId' => $skill->getAgent()->getId(),
                    'areaId' => $skill->getArea()->getId(),
                    'efficiency' => $skill->getEfficiency()
                ];
            }
            
            // Zwróć wszystkie dane diagnostyczne
            return $this->json([
                'debug_info' => [
                    'agents' => $agentsData,
                    'areas' => $areasData,
                    'skills' => $skillsData
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/agents', methods: ['GET'])]
    public function getAgents(): JsonResponse
    {
        try {
            $agents = $this->entityManager->getRepository(Agent::class)->findAll();
            
            $data = [];
            foreach ($agents as $agent) {
                $data[] = [
                    'id' => $agent->getId(),
                    'name' => $agent->getName(),
                ];
            }
            
            return $this->json($data);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Błąd podczas pobierania agentów: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/areas', methods: ['GET'])]
    public function getAreas(): JsonResponse
    {
        try {
            $areas = $this->entityManager->getRepository(Area::class)->findAll();
            
            $data = [];
            foreach ($areas as $area) {
                $data[] = [
                    'id' => $area->getId(),
                    'name' => $area->getName(),
                ];
            }
            
            return $this->json($data);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Błąd podczas pobierania obszarów: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/skills', methods: ['GET'])]
    public function getSkills(): JsonResponse
    {
        try {
            $skills = $this->entityManager->getRepository(Skill::class)->findAll();
            
            $data = [];
            foreach ($skills as $skill) {
                $data[] = [
                    'id' => $skill->getId(),
                    'agentId' => $skill->getAgent()->getId(),
                    'areaId' => $skill->getArea()->getId(),
                    'efficiency' => $skill->getEfficiency(),
                ];
            }
            
            return $this->json($data);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Błąd podczas pobierania umiejętności: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/skills', methods: ['POST'])]
    public function createSkill(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!isset($data['agentId']) || !isset($data['areaId'])) {
                return $this->json([
                    'error' => 'Brak wymaganych danych (agentId, areaId)'
                ], Response::HTTP_BAD_REQUEST);
            }
            
            $agent = $this->entityManager->getRepository(Agent::class)->find($data['agentId']);
            $area = $this->entityManager->getRepository(Area::class)->find($data['areaId']);
            
            if (!$agent || !$area) {
                return $this->json([
                    'error' => 'Agent lub obszar nie znaleziony'
                ], Response::HTTP_NOT_FOUND);
            }
            
            $skill = new Skill();
            $skill->setAgent($agent);
            $skill->setArea($area);
            $skill->setEfficiency($data['efficiency'] ?? 1.0);
            
            $this->entityManager->persist($skill);
            $this->entityManager->flush();
            
            return $this->json([
                'id' => $skill->getId(),
                'agentId' => $skill->getAgent()->getId(),
                'areaId' => $skill->getArea()->getId(),
                'efficiency' => $skill->getEfficiency(),
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Błąd podczas tworzenia umiejętności: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/availability', methods: ['GET'])]
    public function getAvailability(Request $request): JsonResponse
    {
        try {
            $agentId = $request->query->get('agentId');
            $startDate = $request->query->get('startDate');
            $endDate = $request->query->get('endDate');
            
            $qb = $this->entityManager->createQueryBuilder();
            $qb->select('a')
               ->from(Availability::class, 'a');
            
            if ($agentId) {
                $qb->andWhere('a.agent = :agentId')
                   ->setParameter('agentId', $agentId);
            }
            
            // Dodaj filtry dat, jeśli są dostarczone
            if ($startDate) {
                $qb->andWhere('a.date >= :startDate')
                   ->setParameter('startDate', new \DateTime($startDate));
            }
            
            if ($endDate) {
                $qb->andWhere('a.date <= :endDate')
                   ->setParameter('endDate', new \DateTime($endDate));
            }
            
            $availabilities = $qb->getQuery()->getResult();
            
            $data = [];
            foreach ($availabilities as $availability) {
                $data[] = [
                    'id' => $availability->getId(),
                    'agentId' => $availability->getAgent()->getId(),
                    'date' => $availability->getDate()->format('Y-m-d'),
                    'hour' => $availability->getHour(),
                    'isAvailable' => $availability->getIsAvailable(),
                ];
            }
            
            return $this->json($data);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Błąd podczas pobierania dostępności: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/availability', methods: ['POST'])]
    public function createAvailability(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!isset($data['agentId']) || !isset($data['date']) || !isset($data['hour'])) {
                return $this->json([
                    'error' => 'Brak wymaganych danych (agentId, date, hour)'
                ], Response::HTTP_BAD_REQUEST);
            }
            
            $agent = $this->entityManager->getRepository(Agent::class)->find($data['agentId']);
            
            if (!$agent) {
                return $this->json(['error' => 'Agent nie znaleziony'], Response::HTTP_NOT_FOUND);
            }
            
            $date = new \DateTime($data['date']);
            $hour = (int)$data['hour'];
            $isAvailable = $data['isAvailable'] ?? true;
            
            // Sprawdź, czy istnieje już rekord o takich parametrach
            $existingAvailability = $this->entityManager->getRepository(Availability::class)
                ->findOneBy([
                    'agent' => $agent,
                    'date' => $date,
                    'hour' => $hour
                ]);
            
            if ($existingAvailability) {
                // Aktualizuj istniejący rekord
                $existingAvailability->setIsAvailable($isAvailable);
                $this->entityManager->flush();
                
                return $this->json([
                    'id' => $existingAvailability->getId(),
                    'agentId' => $existingAvailability->getAgent()->getId(),
                    'date' => $existingAvailability->getDate()->format('Y-m-d'),
                    'hour' => $existingAvailability->getHour(),
                    'isAvailable' => $existingAvailability->getIsAvailable(),
                ]);
            }
            
            // Utwórz nowy rekord, jeśli nie istnieje
            $availability = new Availability();
            $availability->setAgent($agent);
            $availability->setDate($date);
            $availability->setHour($hour);
            $availability->setIsAvailable($isAvailable);
            
            $this->entityManager->persist($availability);
            $this->entityManager->flush();
            
            return $this->json([
                'id' => $availability->getId(),
                'agentId' => $availability->getAgent()->getId(),
                'date' => $availability->getDate()->format('Y-m-d'),
                'hour' => $availability->getHour(),
                'isAvailable' => $availability->getIsAvailable(),
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Błąd podczas tworzenia dostępności: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    
    #[Route('/api/availability/delete', methods: ['POST'])]
    public function deleteAvailability(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!isset($data['agentId']) || !isset($data['date']) || !isset($data['hour'])) {
                return $this->json([
                    'error' => 'Brak wymaganych danych (agentId, date, hour)'
                ], Response::HTTP_BAD_REQUEST);
            }
            
            $agent = $this->entityManager->getRepository(Agent::class)->find($data['agentId']);
            
            if (!$agent) {
                return $this->json(['error' => 'Agent nie znaleziony'], Response::HTTP_NOT_FOUND);
            }
            
            $date = new \DateTime($data['date']);
            $hour = (int)$data['hour'];
            
            // Znajdź rekord dostępności do usunięcia
            $availability = $this->entityManager->getRepository(Availability::class)
                ->findOneBy([
                    'agent' => $agent,
                    'date' => $date,
                    'hour' => $hour
                ]);
            
            if (!$availability) {
                return $this->json(['error' => 'Rekord dostępności nie znaleziony'], Response::HTTP_NOT_FOUND);
            }
            
            // Usuń rekord
            $this->entityManager->remove($availability);
            $this->entityManager->flush();
            
            return $this->json(['success' => true, 'message' => 'Rekord dostępności usunięty']);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Błąd podczas usuwania dostępności: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}