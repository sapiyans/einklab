# E-InkLab — Backend

API em Django + django-ninja para o toolkit E-InkLab.

## Rodando

```sh
# na raiz do projeto einklab (venv em ./env)
../env/bin/python manage.py migrate
../env/bin/python manage.py runserver 127.0.0.1:8010
```

Admin: <http://127.0.0.1:8010/admin/> (crie um superusuário com
`createsuperuser`).

## Endpoints

Base: `/api/`

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `screensaver/list` | Lista paginada com busca/filtros |
| GET | `screensaver/?id=<uuid>` | Detalhe |
| POST | `screensaver/` | Cria (multipart: `file`, `original_file` + metadados) |
| POST | `screensaver/{id}/count/views` | Incrementa visualizações |
| POST | `screensaver/{id}/count/downloads` | Incrementa downloads |

Arquivos enviados ficam em `backend/media/screensavers/` e são servidos em
`/media/...` (apenas com `DEBUG=True`; em produção use o proxy/nginx).

## Configuração

`.env.dev` / `.env.prod` (veja os `.example`): `DJANGO_SECRET_KEY`,
`DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`,
`DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_DB_PATH`.

Por padrão o banco é SQLite (`backend/db.sqlite3`).
