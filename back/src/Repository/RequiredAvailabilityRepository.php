<?php
// src/Repository/RequiredAvailabilityRepository.php
namespace App\Repository;

use App\Entity\RequiredAvailability;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class RequiredAvailabilityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RequiredAvailability::class);
    }
}
