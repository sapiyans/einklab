#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# CONFIGURAÇÕES
# ============================================================

SOURCE_HOST="root@177.153.22.20"
SSH_KEY="$HOME/.ssh/zatura"

SSH_OPTS=(
    -i "$SSH_KEY"
    -o IdentitiesOnly=yes
    -o BatchMode=yes
    -o ConnectTimeout=10
    -o ControlMaster=auto
    -o ControlPath="$HOME/.ssh/cm-%r@%h:%p"
    -o ControlPersist=60
)

# Origem (produção, Zatura/vps74564)
SOURCE_CONTAINER="postgres"
SOURCE_DB="einklab"
SOURCE_DB_USER="postgres"
SOURCE_TABLE="public.screensaver_screensaver"
SOURCE_MEDIA="/opt/docker/einklab/media"

# Remote do rclone apontando para o Zatura (sftp)
RCLONE_REMOTE="zatura"

# Destino (local)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/backend/.env.dev"
TARGET_MEDIA="$PROJECT_DIR/backend/media"
TARGET_TABLE="public.screensaver_screensaver"
BACKUP_DIR="$PROJECT_DIR/backups"

# ============================================================
# MODO DE EXECUÇÃO
# ============================================================

DO_MEDIA=1
DO_DB=1
CHECK_ONLY=0

while (( $# > 0 )); do
    case "$1" in
        --check)      CHECK_ONLY=1 ;;
        --media-only) DO_DB=0 ;;
        --db-only)    DO_MEDIA=0 ;;
        *)
            echo "Uso: $0 [--check] [--media-only | --db-only]"
            exit 1
            ;;
    esac
    shift
done

# ============================================================
# FUNÇÕES
# ============================================================

log() {
    echo ""
    echo "========== $1 =========="
}

abort() {
    echo ""
    echo "ERRO: $1"
    exit 1
}

error_handler() {
    echo ""
    echo "ERRO: a sincronização foi interrompida."
    echo "Verifique a mensagem acima antes de tentar novamente."
}

trap error_handler ERR

env_value() {
    grep -E "^${1}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2-
}

source_psql() {
    ssh "${SSH_OPTS[@]}" "$SOURCE_HOST" \
        "docker exec -i $SOURCE_CONTAINER psql -v ON_ERROR_STOP=1 -q -tA -U $SOURCE_DB_USER -d $SOURCE_DB"
}

target_psql() {
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -v ON_ERROR_STOP=1 -q -tA
}

join_columns() {
    local IFS=','
    printf '%s' "$*"
}

SOURCE_SCHEMA="${SOURCE_TABLE%%.*}"
SOURCE_TABLE_NAME="${SOURCE_TABLE##*.}"
TARGET_SCHEMA="${TARGET_TABLE%%.*}"
TARGET_TABLE_NAME="${TARGET_TABLE##*.}"

# ============================================================
# VERIFICAR DEPENDÊNCIAS
# ============================================================

log "VERIFICANDO DEPENDÊNCIAS"

for cmd in ssh rclone psql pg_dump; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "ERRO: comando '$cmd' não encontrado."
        exit 1
    fi
done

if [[ ! -f "$SSH_KEY" ]]; then
    echo "ERRO: chave SSH não encontrada: $SSH_KEY"
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERRO: arquivo de ambiente não encontrado: $ENV_FILE"
    exit 1
fi

DB_NAME="$(env_value DJANGO_DB_NAME)"
DB_USER="$(env_value DJANGO_DB_USER)"
DB_PASSWORD="$(env_value DJANGO_DB_PASSWORD)"
DB_HOST="$(env_value DJANGO_DB_HOST)"
DB_PORT="$(env_value DJANGO_DB_PORT)"

for var in DB_NAME DB_USER DB_PASSWORD DB_HOST DB_PORT; do
    if [[ -z "${!var}" ]]; then
        abort "variável $var vazia em $ENV_FILE."
    fi
done

mkdir -p "$BACKUP_DIR"

# ============================================================
# TESTAR BANCO DE DESTINO
# ============================================================

log "TESTANDO BANCO LOCAL"

printf 'SELECT 1;\n' | target_psql >/dev/null \
    || abort "não foi possível conectar no banco local ($DB_NAME)."

echo "Banco local OK ($DB_HOST:$DB_PORT/$DB_NAME)."

# ============================================================
# TESTAR SSH E BANCO DE ORIGEM
# ============================================================

log "TESTANDO CONEXÃO COM O ZATURA"

printf 'SELECT 1;\n' | source_psql >/dev/null \
    || abort "não foi possível conectar no banco de produção."

echo "Conexão SSH e banco de origem OK."

if (( DO_MEDIA )); then
    if ! rclone lsd "$RCLONE_REMOTE:$SOURCE_MEDIA" >/dev/null 2>&1; then
        abort "remote rclone '$RCLONE_REMOTE:$SOURCE_MEDIA' inacessível. Configure com:
  rclone config create $RCLONE_REMOTE sftp host=177.153.22.20 user=root key_file=$SSH_KEY"
    fi
    echo "Remote rclone OK ($RCLONE_REMOTE:$SOURCE_MEDIA)."
fi

# ============================================================
# COMPARAR COLUNAS DAS TABELAS
# ============================================================

log "COMPARANDO ESTRUTURA DAS TABELAS"

SOURCE_COLUMNS=$(
    printf "SELECT column_name FROM information_schema.columns WHERE table_schema = '%s' AND table_name = '%s' ORDER BY ordinal_position;\n" \
        "$SOURCE_SCHEMA" "$SOURCE_TABLE_NAME" | source_psql
)

TARGET_COLUMNS=$(
    printf "SELECT column_name FROM information_schema.columns WHERE table_schema = '%s' AND table_name = '%s' ORDER BY ordinal_position;\n" \
        "$TARGET_SCHEMA" "$TARGET_TABLE_NAME" | target_psql
)

TARGET_REQUIRED=$(
    printf "SELECT column_name FROM information_schema.columns WHERE table_schema = '%s' AND table_name = '%s' AND is_nullable = 'NO' AND column_default IS NULL ORDER BY ordinal_position;\n" \
        "$TARGET_SCHEMA" "$TARGET_TABLE_NAME" | target_psql
)

[[ -n "$SOURCE_COLUMNS" ]] || abort "tabela $SOURCE_TABLE não encontrada na origem."
[[ -n "$TARGET_COLUMNS" ]] || abort "tabela $TARGET_TABLE não encontrada no destino."

declare -A SOURCE_HAS=()

while IFS= read -r column; do
    [[ -z "$column" ]] && continue
    SOURCE_HAS["$column"]=1
done <<< "$SOURCE_COLUMNS"

COPY_TARGET_COLUMNS=()
COPY_SOURCE_COLUMNS=()
SKIPPED_COLUMNS=()
RENAMED_COLUMNS=()

while IFS= read -r column; do
    [[ -z "$column" ]] && continue

    if [[ -n "${SOURCE_HAS[$column]:-}" ]]; then
        COPY_TARGET_COLUMNS+=("$column")
        COPY_SOURCE_COLUMNS+=("$column")
    elif [[ "$column" == "crop" && -n "${SOURCE_HAS[file]:-}" ]]; then
        COPY_TARGET_COLUMNS+=("crop")
        COPY_SOURCE_COLUMNS+=("file")
        RENAMED_COLUMNS+=("file > crop")
    else
        SKIPPED_COLUMNS+=("$column")
    fi
done <<< "$TARGET_COLUMNS"

COPIED_TARGET=" ${COPY_TARGET_COLUMNS[*]} "

if [[ "$COPIED_TARGET" != *" id "* ]]; then
    abort "a coluna 'id' não existe na origem; importar sem ela geraria IDs novos."
fi

for column in $TARGET_REQUIRED; do
    if [[ "$COPIED_TARGET" != *" $column "* ]]; then
        abort "coluna obrigatória '$column' não existe na origem (esquemas diferentes)."
    fi
done

if (( ${#SKIPPED_COLUMNS[@]} > 0 )); then
    echo ""
    echo "AVISO: colunas do destino que não existem na origem:"
    printf '  - %s\n' "${SKIPPED_COLUMNS[@]}"
fi

if (( ${#RENAMED_COLUMNS[@]} > 0 )); then
    echo ""
    echo "Colunas renomeadas na origem:"
    printf '  - %s\n' "${RENAMED_COLUMNS[@]}"
fi

echo ""
echo "Colunas que serão copiadas: ${#COPY_TARGET_COLUMNS[@]}"

# ============================================================
# CONFERIR REGISTROS NOS DOIS LADOS
# ============================================================

log "CONTANDO REGISTROS"

SOURCE_COUNT=$(
    printf 'SELECT COUNT(*) FROM %s;\n' "$SOURCE_TABLE" | source_psql | tr -d '[:space:]'
)

TARGET_COUNT_BEFORE=$(
    printf 'SELECT COUNT(*) FROM %s;\n' "$TARGET_TABLE" | target_psql | tr -d '[:space:]'
)

if [[ ! "$SOURCE_COUNT" =~ ^[0-9]+$ ]]; then
    abort "não foi possível obter a quantidade de registros da origem."
fi

echo "Registros na produção (Zatura): $SOURCE_COUNT"
echo "Registros no banco local:       $TARGET_COUNT_BEFORE"

# ============================================================
# CONFIRMAÇÃO
# ============================================================

echo ""
echo "============================================================"
echo "             SINCRONIZAÇÃO ZATURA -> LOCAL"
echo "============================================================"
echo ""
echo "ORIGEM (produção):"
echo "  Servidor:  $SOURCE_HOST"
echo "  Mídia:     $SOURCE_MEDIA"
echo "  Banco:     $SOURCE_DB / $SOURCE_TABLE"
echo "  Registros: $SOURCE_COUNT"
echo ""
echo "DESTINO (local):"
echo "  Ambiente:  $ENV_FILE"
echo "  Mídia:     $TARGET_MEDIA"
echo "  Banco:     $DB_HOST:$DB_PORT/$DB_NAME / $TARGET_TABLE"
echo "  Registros: $TARGET_COUNT_BEFORE"
echo ""

if (( DO_MEDIA )); then
    echo "  - A mídia de produção será espelhada em $TARGET_MEDIA (só o que mudou é"
    echo "    transferido). Arquivos locais que não existem na produção, e arquivos"
    echo "    substituídos, serão movidos para backups/media_<data> (nada é apagado)."
fi

if (( DO_DB )); then
    echo "  - A tabela local será substituída pelos $SOURCE_COUNT registros da produção."
    echo "  - Um backup da tabela local será criado em $BACKUP_DIR antes da alteração."
fi

echo ""

if (( CHECK_ONLY )); then
    echo "Modo --check: nada será alterado. Pré-verificação concluída."
    exit 0
fi

read -r -p "Deseja iniciar a sincronização? (s/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
    echo "Sincronização cancelada."
    exit 0
fi

# ============================================================
# BACKUP DO BANCO LOCAL
# ============================================================

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/screensaver_${STAMP}.dump"
CSV_FILE="$BACKUP_DIR/zatura_screensaver_${STAMP}.csv"

if (( DO_DB )); then
    log "FAZENDO BACKUP DA TABELA LOCAL"

    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -Fc -t "$TARGET_TABLE" \
        > "$BACKUP_FILE"

    if [[ ! -s "$BACKUP_FILE" ]]; then
        echo "ERRO: backup não foi criado corretamente."
        exit 1
    fi

    echo "Backup criado: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
fi

# ============================================================
# SINCRONIZAR MÍDIA
# ============================================================

if (( DO_MEDIA )); then
    log "SINCRONIZANDO ARQUIVOS DE MÍDIA"

    mkdir -p "$TARGET_MEDIA"

    MEDIA_BACKUP_DIR="$BACKUP_DIR/media_$STAMP"

    rclone sync \
        "$RCLONE_REMOTE:$SOURCE_MEDIA" \
        "$TARGET_MEDIA" \
        --backup-dir "$MEDIA_BACKUP_DIR" \
        --progress \
        --stats-one-line \
        --stats 10s \
        --transfers 1 \
        --checkers 1

    echo "Espelhamento concluído. Conferindo integridade..."

    rclone check \
        "$RCLONE_REMOTE:$SOURCE_MEDIA" \
        "$TARGET_MEDIA" \
        --size-only \
        --checkers 1

    echo "Mídia conferida: local idêntico à produção."

    if [[ -d "$MEDIA_BACKUP_DIR" ]]; then
        echo "Arquivos removidos/substituídos guardados em: $MEDIA_BACKUP_DIR"
    fi
fi

# ============================================================
# EXPORTAR REGISTROS DA ORIGEM
# ============================================================

if (( DO_DB )); then
    log "EXPORTANDO REGISTROS DO ZATURA"

    SOURCE_SELECT="$(join_columns "${COPY_SOURCE_COLUMNS[@]}")"
    TARGET_COPY_COLUMNS="$(join_columns "${COPY_TARGET_COLUMNS[@]}")"

    {
        printf "SET TIME ZONE 'UTC';\n"
        printf 'COPY (SELECT %s FROM %s) TO STDOUT WITH (FORMAT csv, HEADER false);\n' \
            "$SOURCE_SELECT" "$SOURCE_TABLE"
    } | source_psql > "$CSV_FILE"

    if [[ ! -s "$CSV_FILE" ]]; then
        echo "ERRO: exportação vazia ou falhou."
        exit 1
    fi

    if grep -qxF '\.' "$CSV_FILE"; then
        echo "ERRO: o CSV exportado contém uma linha '\\.' e interromperia o COPY."
        echo "Arquivo: $CSV_FILE"
        exit 1
    fi

    echo "Exportação concluída: $CSV_FILE"
    echo "Tamanho: $(du -h "$CSV_FILE" | cut -f1)"

    # ========================================================
    # IMPORTAR NO BANCO LOCAL
    # ========================================================

    log "ATUALIZANDO BANCO LOCAL"

    {
        printf "SET TIME ZONE 'UTC';\n"
        printf "SET lock_timeout = '10s';\n"
        printf 'BEGIN;\n'
        printf 'TRUNCATE TABLE %s;\n' "$TARGET_TABLE"
        printf 'COPY %s (%s) FROM STDIN WITH (FORMAT csv);\n' "$TARGET_TABLE" "$TARGET_COPY_COLUMNS"
        cat "$CSV_FILE"
        printf '\\.\n'
        printf 'ANALYZE %s;\n' "$TARGET_TABLE"
        printf 'COMMIT;\n'
    } | PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -v ON_ERROR_STOP=1 >/dev/null

    echo "Banco local atualizado."
fi

# ============================================================
# CONFERIR RESULTADO
# ============================================================

if (( DO_DB )); then
    log "CONFERINDO REGISTROS"

    TARGET_COUNT=$(
        printf 'SELECT COUNT(*) FROM %s;\n' "$TARGET_TABLE" | target_psql | tr -d '[:space:]'
    )

    echo "Registros na produção: $SOURCE_COUNT"
    echo "Registros no local:    $TARGET_COUNT"

    if [[ "$SOURCE_COUNT" != "$TARGET_COUNT" ]]; then
        echo ""
        echo "ERRO: as quantidades de registros são diferentes."
        echo "O backup está disponível em: $BACKUP_FILE"
        exit 1
    fi
fi

# ============================================================
# CONCLUÍDO
# ============================================================

log "SINCRONIZAÇÃO CONCLUÍDA"

if (( DO_MEDIA )); then
    echo "Mídia sincronizada: $TARGET_MEDIA"
    if [[ -d "$MEDIA_BACKUP_DIR" ]]; then
        echo "Backup da mídia:    $MEDIA_BACKUP_DIR"
    fi
fi

if (( DO_DB )); then
    echo "Banco local atualizado: $DB_NAME / $TARGET_TABLE ($TARGET_COUNT registros)"
    echo "Backup da tabela:       $BACKUP_FILE"
    echo "Dados importados:       $CSV_FILE"
fi
