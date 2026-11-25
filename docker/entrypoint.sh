#!/bin/sh
set -e

cd /app/backend

echo "==> Aplicando migrações do banco..."
python manage.py migrate --noinput

echo "==> Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

echo "==> Iniciando Gunicorn..."
exec gunicorn backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 1 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --worker-tmp-dir /dev/shm
