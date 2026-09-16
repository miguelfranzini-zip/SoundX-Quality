-- ============================================================
-- SoundX Quality — Sistema de Controle de Qualidade de Fones
-- Script DDL e DML para MySQL (controle_qualidade_fones)
-- ============================================================

CREATE DATABASE IF NOT EXISTS controle_qualidade_fones
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE controle_qualidade_fones;

-- 1. Tabela: funcionario
CREATE TABLE IF NOT EXISTS funcionario (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    cargo VARCHAR(50) DEFAULT 'Inspetor',
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2. Tabela: fone
CREATE TABLE IF NOT EXISTS fone (
    id_fone INT AUTO_INCREMENT PRIMARY KEY,
    numero_serie VARCHAR(50) NOT NULL UNIQUE,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) DEFAULT 'SoundX',
    tipo_conexao VARCHAR(50) DEFAULT 'Bluetooth',
    data_fabricacao DATE DEFAULT (CURRENT_DATE),
    status VARCHAR(50) DEFAULT 'Aguardando inspeção'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 3. Tabela: inspecao
CREATE TABLE IF NOT EXISTS inspecao (
    id_inspecao INT AUTO_INCREMENT PRIMARY KEY,
    id_fone INT NOT NULL,
    id_funcionario INT,
    data_inspecao DATETIME DEFAULT CURRENT_TIMESTAMP,
    resultado_final VARCHAR(50) NOT NULL,
    observacao TEXT,
    CONSTRAINT fk_inspecao_fone FOREIGN KEY (id_fone) REFERENCES fone (id_fone) ON DELETE CASCADE,
    CONSTRAINT fk_inspecao_func FOREIGN KEY (id_funcionario) REFERENCES funcionario (id_funcionario) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 4. Tabela: teste
CREATE TABLE IF NOT EXISTS teste (
    id_teste INT AUTO_INCREMENT PRIMARY KEY,
    id_inspecao INT NOT NULL,
    tipo_teste VARCHAR(100) NOT NULL,
    parametro_medido VARCHAR(100),
    resultado VARCHAR(50) NOT NULL,
    observacao TEXT,
    CONSTRAINT fk_teste_inspecao FOREIGN KEY (id_inspecao) REFERENCES inspecao (id_inspecao) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 5. Tabela: manutencao
CREATE TABLE IF NOT EXISTS manutencao (
    id_manutencao INT AUTO_INCREMENT PRIMARY KEY,
    id_fone INT NOT NULL,
    descricao_defeito TEXT NOT NULL,
    acao_corretiva TEXT,
    status ENUM('Pendente', 'Em Manutencao', 'Concluido') DEFAULT 'Pendente',
    data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_conclusao DATETIME,
    CONSTRAINT fk_manutencao_fone FOREIGN KEY (id_fone) REFERENCES fone (id_fone) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ============================================================
-- DADOS INICIAIS (DML)
-- ============================================================

-- Funcionários (Personas)
INSERT INTO funcionario (nome, cpf, cargo, email, senha)
VALUES 
    ('Lucas Silva', '123.456.789-00', 'Inspetor', 'lucas@email.com', '1234'),
    ('Marcos Santos', '234.567.890-11', 'Técnico', 'tecnico@soundx.com', '1234'),
    ('Carlos Souza', '345.678.901-22', 'Admin', 'admin@soundx.com', '1234')
ON DUPLICATE KEY UPDATE nome = VALUES(nome), cargo = VALUES(cargo);

-- Fones adicionais para testes
INSERT INTO fone (numero_serie, modelo, marca, tipo_conexao, data_fabricacao, status)
VALUES 
    ('FN001', 'SoundX Pro', 'SoundX', 'Bluetooth', '2026-08-20', 'Reprovado / Manutenção'),
    ('SX-2026-001', 'SoundX 10', 'SoundX', 'Bluetooth', '2026-09-01', 'Reprovado / Manutenção'),
    ('SX-2026-002', 'SoundX Studio Pro', 'SoundX', 'USB-C', '2026-09-05', 'Aguardando inspeção'),
    ('SX-2026-003', 'SoundX Bass Max', 'SoundX', 'P2', '2026-09-10', 'Aprovado')
ON DUPLICATE KEY UPDATE modelo = VALUES(modelo);
