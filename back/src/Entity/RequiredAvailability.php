<?php
// src/Entity/RequiredAvailability.php
namespace App\Entity;

use App\Repository\RequiredAvailabilityRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RequiredAvailabilityRepository::class)]
#[ORM\Table(name: "requiredavailability")]
class RequiredAvailability
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?int $hour = null;

    #[ORM\Column]
    private ?int $reqpeople = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getHour(): ?int
    {
        return $this->hour;
    }

    public function setHour(int $hour): self
    {
        $this->hour = $hour;
        return $this;
    }

    public function getReqpeople(): ?int
    {
        return $this->reqpeople;
    }

    public function setReqpeople(int $reqpeople): self
    {
        $this->reqpeople = $reqpeople;
        return $this;
    }
}
