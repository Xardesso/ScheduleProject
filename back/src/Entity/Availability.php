<?php
// src/Entity/Availability.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: "availability")]
#[ORM\UniqueConstraint(name: "unique_availability", columns: ["agent_id", "date", "hour"])]
class Availability
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: "date")]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column]
    private ?int $hour = null;

    #[ORM\Column(name: "is_available")]
    private bool $isAvailable = false;

    #[ORM\ManyToOne(targetEntity: Agent::class, inversedBy: "availabilities")]
    #[ORM\JoinColumn(name: "agent_id", referencedColumnName: "id")]
    private ?Agent $agent = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): self
    {
        $this->date = $date;
        return $this;
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

    public function getIsAvailable(): bool
    {
        return $this->isAvailable;
    }

    public function setIsAvailable(bool $isAvailable): self
    {
        $this->isAvailable = $isAvailable;
        return $this;
    }

    public function getAgent(): ?Agent
    {
        return $this->agent;
    }

    public function setAgent(?Agent $agent): self
    {
        $this->agent = $agent;
        return $this;
    }
}
