<?php
// src/Entity/Skill.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: "skill")]
#[ORM\UniqueConstraint(name: "unique_skill", columns: ["agent_id", "area_id"])]
class Skill
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: "float")]
    private float $efficiency = 1.0;

    #[ORM\ManyToOne(targetEntity: Agent::class, inversedBy: "skills")]
    #[ORM\JoinColumn(name: "agent_id", referencedColumnName: "id")]
    private ?Agent $agent = null;

    #[ORM\ManyToOne(targetEntity: Area::class, inversedBy: "skills")]
    #[ORM\JoinColumn(name: "area_id", referencedColumnName: "id")]
    private ?Area $area = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEfficiency(): float
    {
        return $this->efficiency;
    }

    public function setEfficiency(float $efficiency): self
    {
        $this->efficiency = $efficiency;
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

    public function getArea(): ?Area
    {
        return $this->area;
    }

    public function setArea(?Area $area): self
    {
        $this->area = $area;
        return $this;
    }
}