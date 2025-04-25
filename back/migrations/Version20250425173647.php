<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250425173647 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE agent (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_general_ci`, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_general_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE area (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_general_ci`, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_general_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE availability (id INT AUTO_INCREMENT NOT NULL, date DATE NOT NULL, hour INT NOT NULL, is_available TINYINT(1) NOT NULL, agent_id INT DEFAULT NULL, INDEX IDX_3FB7A2BF3414710B (agent_id), UNIQUE INDEX unique_availability (agent_id, date, hour), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_general_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE availability ADD CONSTRAINT FK_3FB7A2BF3414710B FOREIGN KEY (agent_id) REFERENCES agent (id)
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE requiredavailability (id INT AUTO_INCREMENT NOT NULL, hour INT NOT NULL, reqpeople_1 INT DEFAULT NULL, reqpeople_2 INT DEFAULT NULL, reqpeople_3 INT DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_general_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE schedule (id INT AUTO_INCREMENT NOT NULL, date DATE NOT NULL, hour INT NOT NULL, agent_id INT NOT NULL, area_id INT NOT NULL, INDEX IDX_5A3811FBBD0F409C (area_id), INDEX IDX_5A3811FB3414710B (agent_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_general_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE schedule ADD CONSTRAINT FK_5A3811FB3414710B FOREIGN KEY (agent_id) REFERENCES agent (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE schedule ADD CONSTRAINT FK_5A3811FBBD0F409C FOREIGN KEY (area_id) REFERENCES area (id)
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            CREATE TABLE skill (id INT AUTO_INCREMENT NOT NULL, efficiency DOUBLE PRECISION NOT NULL, agent_id INT DEFAULT NULL, area_id INT DEFAULT NULL, INDEX IDX_5E3DE4773414710B (agent_id), INDEX IDX_5E3DE477BD0F409C (area_id), UNIQUE INDEX unique_skill (agent_id, area_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_general_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE skill ADD CONSTRAINT FK_5E3DE477BD0F409C FOREIGN KEY (area_id) REFERENCES area (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE skill ADD CONSTRAINT FK_5E3DE4773414710B FOREIGN KEY (agent_id) REFERENCES agent (id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            DROP TABLE agent
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            DROP TABLE area
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            DROP TABLE availability
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            DROP TABLE requiredavailability
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            DROP TABLE schedule
        SQL);
        $this->abortIf(
            !$this->connection->getDatabasePlatform() instanceof \Doctrine\DBAL\Platforms\MySQLPlatform,
            "Migration can only be executed safely on '\Doctrine\DBAL\Platforms\MySQLPlatform'."
        );

        $this->addSql(<<<'SQL'
            DROP TABLE skill
        SQL);
    }
}
