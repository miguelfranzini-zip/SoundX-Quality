-- ============================================================
-- SoundX Quality — Sistema de Controle de Qualidade de Fones
-- Script DDL e DML Oficial Atualizado para PostgreSQL (Supabase)
-- ============================================================

-- 1. Tabela: funcionario (com suporte a Soft Delete e RBAC)
CREATE TABLE IF NOT EXISTS funcionario (
    id_funcionario SERIAL PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    cpf            VARCHAR(14)  UNIQUE,
    cargo          VARCHAR(50)  DEFAULT 'Inspetor',
    email          VARCHAR(100) NOT NULL UNIQUE,
    senha          VARCHAR(255) NOT NULL,
    ativo          BOOLEAN      DEFAULT TRUE,
    excluido_em    TIMESTAMP    NULL
);

-- 2. Tabela: fone (com rastreabilidade por lote industrial)
CREATE TABLE IF NOT EXISTS fone (
    id_fone        SERIAL PRIMARY KEY,
    numero_serie   VARCHAR(50)  NOT NULL UNIQUE,
    modelo         VARCHAR(100) NOT NULL,
    marca          VARCHAR(100) DEFAULT 'SoundX',
    tipo_conexao   VARCHAR(50)  DEFAULT 'Bluetooth',
    lote           VARCHAR(50)  DEFAULT 'LT-2026-A',
    data_fabricacao DATE        DEFAULT CURRENT_DATE,
    status         VARCHAR(50)  DEFAULT 'Aguardando inspeção'
);

-- 3. Tabela: inspecao (com evidência fotográfica e rastreabilidade)
CREATE TABLE IF NOT EXISTS inspecao (
    id_inspecao    SERIAL PRIMARY KEY,
    id_fone        INT NOT NULL,
    id_funcionario INT,
    data_inspecao  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado_final VARCHAR(50) NOT NULL,
    observacao     TEXT,
    foto_url       TEXT,
    CONSTRAINT fk_inspecao_fone FOREIGN KEY (id_fone) REFERENCES fone(id_fone) ON DELETE CASCADE,
    CONSTRAINT fk_inspecao_func FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_funcionario) ON DELETE SET NULL
);

-- 4. Tabela: teste (checklist técnico granular de ensaios acústicos)
CREATE TABLE IF NOT EXISTS teste (
    id_teste         SERIAL PRIMARY KEY,
    id_inspecao      INT NOT NULL,
    tipo_teste       VARCHAR(100) NOT NULL,
    parametro_medido VARCHAR(100),
    resultado        VARCHAR(50) NOT NULL,
    observacao       TEXT,
    CONSTRAINT fk_teste_inspecao FOREIGN KEY (id_inspecao) REFERENCES inspecao(id_inspecao) ON DELETE CASCADE
);

-- 5. Tabela: manutencao (ciclo de solicitação, prioridades e técnicos)
CREATE TABLE IF NOT EXISTS manutencao (
    id_manutencao    SERIAL PRIMARY KEY,
    id_fone          INT NOT NULL,
    descricao_defeito TEXT NOT NULL,
    acao_corretiva   TEXT,
    status           VARCHAR(50) DEFAULT 'Pendente'
                     CHECK (status IN ('Pendente', 'Em Manutencao', 'Concluido', 'Solicitada')),
    prioridade       VARCHAR(20) DEFAULT 'Media',
    solicitado_por   INT,
    concluido_por    INT,
    data_entrada     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao   TIMESTAMP,
    CONSTRAINT fk_manutencao_fone FOREIGN KEY (id_fone) REFERENCES fone(id_fone) ON DELETE CASCADE,
    CONSTRAINT fk_manutencao_solicitante FOREIGN KEY (solicitado_por) REFERENCES funcionario(id_funcionario) ON DELETE SET NULL,
    CONSTRAINT fk_manutencao_concluidor FOREIGN KEY (concluido_por) REFERENCES funcionario(id_funcionario) ON DELETE SET NULL
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE E AUDITORIA
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_inspecao_data ON inspecao (data_inspecao);
CREATE INDEX IF NOT EXISTS idx_inspecao_fone ON inspecao (id_fone);
CREATE INDEX IF NOT EXISTS idx_manutencao_status ON manutencao (status);
CREATE INDEX IF NOT EXISTS idx_manutencao_entrada ON manutencao (data_entrada);
CREATE INDEX IF NOT EXISTS idx_fone_lote ON fone (lote);
CREATE INDEX IF NOT EXISTS idx_funcionario_ativo ON funcionario (ativo);

-- ============================================================
-- DADOS INICIAIS (SEEDS OFICIAIS)
-- ============================================================

-- Funcionários com senhas hash ou texto compatíveis com o ambiente
INSERT INTO funcionario (nome, cpf, cargo, email, senha, ativo)
VALUES
    ('Lucas Silva',   '123.456.789-00', 'Inspetor', 'lucas@email.com',       '1234', TRUE),
    ('Marcos Santos', '234.567.890-11', 'Técnico',  'tecnico@soundx.com',    '1234', TRUE),
    ('Carlos Souza',  '345.678.901-22', 'Admin',    'admin@soundx.com',      '1234', TRUE)
ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, cargo = EXCLUDED.cargo, ativo = TRUE;

-- Fones de demonstração fabril
INSERT INTO fone (numero_serie, modelo, marca, tipo_conexao, lote, data_fabricacao, status)
VALUES
    ('FN001',       'SoundX Pro',        'SoundX', 'Bluetooth', 'LT-2026-A', '2026-08-20', 'Reprovado / Manutenção'),
    ('SX-2026-001', 'SoundX 10',         'SoundX', 'Bluetooth', 'LT-2026-A', '2026-09-01', 'Reprovado / Manutenção'),
    ('SX-2026-002', 'SoundX Studio Pro', 'SoundX', 'USB-C',     'LT-2026-B', '2026-09-05', 'Aguardando inspeção'),
    ('SX-2026-003', 'SoundX Bass Max',   'SoundX', 'USB-C',     'LT-2026-B', '2026-09-10', 'Aprovado')
ON CONFLICT (numero_serie) DO UPDATE SET modelo = EXCLUDED.modelo, lote = EXCLUDED.lote;
