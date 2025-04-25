<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;
use App\Repository\AreaRepository;

#[ORM\Entity]
class Schedule
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    
    #[ORM\ManyToOne(targetEntity: Agent::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Agent $agent = null;
    
    #[ORM\ManyToOne(targetEntity: Area::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Area $area = null;
    
    #[ORM\Column(type: 'date')]
    private ?\DateTimeInterface $date = null;
    
    #[ORM\Column]
    private ?int $hour = null;
    public function getId(): ?int
{
    return $this->id;
}
    // gettery i settery
}