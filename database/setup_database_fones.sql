-- ============================================================
-- SoundGuard Quality — Controle de Qualidade de Fones de Ouvido
-- Script de criação do banco de dados (DDL) e dados iniciais (DML)
-- SGBD: MySQL
--
-- Como usar:
--   mysql -u seu_usuario -p < setup_database_fones.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS controle_qualidade_fones
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE controle_qualidade_fones;

-- ------------------------------------------------------------
-- Tabela: funcionario
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS funcionario (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    cargo VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    senha VARCHAR(100)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ------------------------------------------------------------
-- Tabela: fone
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fone (
    id_fone INT AUTO_INCREMENT PRIMARY KEY,
    numero_serie VARCHAR(50) UNIQUE NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100),
    tipo_conexao VARCHAR(50),
    data_fabricacao DATE,
    status VARCHAR(30)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ------------------------------------------------------------
-- Tabela: inspecao
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspecao (
    id_inspecao INT AUTO_INCREMENT PRIMARY KEY,
    data_inspecao DATETIME NOT NULL,
    resultado_final VARCHAR(30),
    observacao VARCHAR(255),
    id_funcionario INT NOT NULL,
    id_fone INT NOT NULL,

    CONSTRAINT fk_inspecao_funcionario
        FOREIGN KEY (id_funcionario)
        REFERENCES funcionario (id_funcionario),

    CONSTRAINT fk_inspecao_fone
        FOREIGN KEY (id_fone)
        REFERENCES fone (id_fone)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ------------------------------------------------------------
-- Tabela: teste
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teste (
    id_teste INT AUTO_INCREMENT PRIMARY KEY,
    nome_teste VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    valor_esperado VARCHAR(100)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ------------------------------------------------------------
-- Tabela: resultado_teste
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resultado_teste (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    resultado VARCHAR(30),
    valor_obtido VARCHAR(100),
    observacao VARCHAR(255),
    id_inspecao INT NOT NULL,
    id_teste INT NOT NULL,

    CONSTRAINT fk_resultado_teste_inspecao
        FOREIGN KEY (id_inspecao)
        REFERENCES inspecao (id_inspecao),

    CONSTRAINT fk_resultado_teste_teste
        FOREIGN KEY (id_teste)
        REFERENCES teste (id_teste)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ------------------------------------------------------------
-- Tabela: defeito
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS defeito (
    id_defeito INT AUTO_INCREMENT PRIMARY KEY,
    nome_defeito VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    gravidade VARCHAR(30)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ------------------------------------------------------------
-- Tabela: defeito_encontrado
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS defeito_encontrado (
    id_defeito_encontrado INT AUTO_INCREMENT PRIMARY KEY,
    id_inspecao INT NOT NULL,
    id_defeito INT NOT NULL,
    observacao VARCHAR(255),

    CONSTRAINT fk_defeito_encontrado_inspecao
        FOREIGN KEY (id_inspecao)
        REFERENCES inspecao (id_inspecao),

    CONSTRAINT fk_defeito_encontrado_defeito
        FOREIGN KEY (id_defeito)
        REFERENCES defeito (id_defeito)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ------------------------------------------------------------
-- Tabela: tecnico
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tecnico (
    id_tecnico INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    especialidade VARCHAR(100),
    email VARCHAR(100) UNIQUE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ------------------------------------------------------------
-- Tabela: manutencao
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manutencao (
    id_manutencao INT AUTO_INCREMENT PRIMARY KEY,
    data_manutencao DATETIME NOT NULL,
    descricao_servico VARCHAR(255),
    status VARCHAR(30),
    id_fone INT NOT NULL,
    id_tecnico INT NOT NULL,

    CONSTRAINT fk_manutencao_fone
        FOREIGN KEY (id_fone)
        REFERENCES fone (id_fone),

    CONSTRAINT fk_manutencao_tecnico
        FOREIGN KEY (id_tecnico)
        REFERENCES tecnico (id_tecnico)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ------------------------------------------------------------
-- Tabela: gerente
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gerente (
    id_gerente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    senha VARCHAR(100)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

-- ============================================================
-- DADOS INICIAIS (DML)
-- ============================================================

INSERT INTO funcionario (nome, cpf, cargo, email, senha)
VALUES ('Lucas Silva', '123.456.789-00', 'Inspetor de Qualidade', 'lucas@email.com', '1234');

INSERT INTO fone (numero_serie, modelo, marca, tipo_conexao, data_fabricacao, status)
VALUES ('FN001', 'SoundX Pro', 'SoundX', 'Bluetooth', '2026-08-20', 'Aguardando inspeção');

INSERT INTO teste (nome_teste, descricao, valor_esperado)
VALUES ('Teste de áudio esquerdo', 'Verifica o funcionamento do lado esquerdo', 'Funcionando'),
       ('Teste de áudio direito', 'Verifica o funcionamento do lado direito', 'Funcionando'),
       ('Teste Bluetooth', 'Verifica conexão Bluetooth', 'Conectado'),
       ('Teste de microfone', 'Verifica qualidade do microfone', 'Funcionando'),
       ('Teste de bateria', 'Verifica funcionamento da bateria', 'Normal');

INSERT INTO defeito (nome_defeito, descricao, gravidade)
VALUES ('Falha no áudio esquerdo', 'Não há reprodução de som no lado esquerdo', 'Alta'),
       ('Falha Bluetooth', 'Fone não consegue estabelecer conexão', 'Média'),
       ('Microfone com ruído', 'Microfone apresenta ruídos durante o uso', 'Média');
