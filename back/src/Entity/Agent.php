<?php
// src/Entity/Agent.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity]
#[ORM\Table(name: "agent")]
class Agent
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\OneToMany(mappedBy: "agent", targetEntity: Skill::class)]
    private Collection $skills;

    #[ORM\OneToMany(mappedBy: "agent", targetEntity: Availability::class)]
    private Collection $availabilities;

    public function __construct()
    {
        $this->skills = new ArrayCollection();
        $this->availabilities = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getSkills(): Collection
    {
        return $this->skills;
    }

    public function getAvailabilities(): Collection
    {
        return $this->availabilities;
    }
    
    public function addAvailability(Availability $availability): self
    {
        if (!$this->availabilities->contains($availability)) {
            $this->availabilities[] = $availability;
            $availability->setAgent($this);
        }
        return $this;
    }

    public function removeAvailability(Availability $availability): self
    {
        if ($this->availabilities->removeElement($availability)) {
            // Jeśli availability nadal wskazuje na tego agenta, zerujemy referencję
            if ($availability->getAgent() === $this) {
                $availability->setAgent(null);
            }
        }
        return $this;
    }
}
