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

    #[ORM\Column(nullable: false, options: ["default" => 1])]
    private int $reqpeople_1 = 1;

    #[ORM\Column(nullable: false, options: ["default" => 1])]
    private int $reqpeople_2 = 1;

    #[ORM\Column(nullable: false, options: ["default" => 1])]
    private int $reqpeople_3 = 1;

    public function __construct()
    {
        // Ustaw domyślne wartości w konstruktorze
        $this->reqpeople_1 = 1;
        $this->reqpeople_2 = 1;
        $this->reqpeople_3 = 1;
    }

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

    public function getReqpeople1(): int
    {
        return $this->reqpeople_1;
    }

    public function setReqpeople1(?int $reqpeople): self
    {
        // Zapewnij minimalną wartość 1
        $this->reqpeople_1 = $reqpeople !== null ? max(1, $reqpeople) : 1;
        return $this;
    }

    public function getReqpeople2(): int
    {
        return $this->reqpeople_2;
    }

    public function setReqpeople2(?int $reqpeople): self
    {
        // Zapewnij minimalną wartość 1
        $this->reqpeople_2 = $reqpeople !== null ? max(1, $reqpeople) : 1;
        return $this;
    }

    public function getReqpeople3(): int
    {
        return $this->reqpeople_3;
    }

    public function setReqpeople3(?int $reqpeople): self
    {
        // Zapewnij minimalną wartość 1
        $this->reqpeople_3 = $reqpeople !== null ? max(1, $reqpeople) : 1;
        return $this;
    }
    
    // Dla zachowania kompatybilności wstecznej
    public function getReqpeople(): int
    {
        return $this->reqpeople_1;
    }

    public function setReqpeople(?int $reqpeople): self
    {
        // Zapewnij minimalną wartość 1
        $this->reqpeople_1 = $reqpeople !== null ? max(1, $reqpeople) : 1;
        return $this;
    }
}
