# E-InkLab

Toolkit para dispositivos E-Ink, começando por screensavers e pesquisa de
firmware para leitores XTEINK.

## Serviços

- **Screensavers** — galeria da comunidade e editor para criar/customizar
  screensavers dos modelos XTEINK X3, X4 e X4 Pro (export BMP 24-bit ou PNG).
- **Firmware** — comparativo e documentação dos firmwares XTEINK
  (original, CrossPoint, CrossInk).

## Estrutura

- [`frontend/`](frontend/) — app Vike + React + Tailwind CSS v4
- [`backend/`](backend/) — API Django + django-ninja
- [`env/`](env/) — virtualenv Python do backend (não versionado)

## Rodando localmente

```sh
# backend (http://127.0.0.1:8010)
cd backend && ../env/bin/python manage.py migrate && ../env/bin/python manage.py runserver 127.0.0.1:8010

# frontend (http://localhost:3000)
cd frontend && npm install && npm run dev
```

## Contribuindo

Contribuições são bem-vindas! Se tiver ideias, sugestões, bugs ou melhorias
relacionadas a screensavers e firmware XTEINK, abra uma issue ou envie um
pull request.
