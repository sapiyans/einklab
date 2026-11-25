# Dados dos firmwares

Cada arquivo `.json` desta pasta vira automaticamente um firmware na comparação.
Para adicionar um novo, crie um novo arquivo (ex.: `meu-firmware.json`) seguindo o formato abaixo.

## Formato

```json
{
  "meta": {
    "name": "Nome exibido",
    "eyebrow": "RÓTULO PEQUENO",
    "accent": "blue",
    "order": 3
  },
  "summary": "Uma frase resumindo o firmware.",
  "features": [
    {
      "number": "01",
      "title": "Leitura",
      "icon": "BookOpen",
      "rows": [
        ["EPUB", "yes"],
        ["Índice / capítulos", { "status": "limited", "note": "Texto opcional" }]
      ]
    }
  ],
  "ratingSections": [
    {
      "number": "11",
      "title": "Estabilidade",
      "icon": "Shield",
      "warning": false,
      "rows": [["Estabilidade geral", 4]]
    }
  ]
}
```

## Campos

- `meta.name`: nome do firmware (aparece nos filtros, gráficos e tabelas).
- `meta.accent`: cor do firmware — `amber`, `blue`, `emerald`, `violet`, `rose`, `cyan`, `orange` ou `teal`.
- `meta.order` (opcional): posição na lista; menores aparecem primeiro. Sem ele, ordena por nome.
- `meta.version` (opcional): versão do firmware, exibida no card de nota e no cabeçalho da tabela.
  Deixe `""` para não exibir nada até definir a versão.
- `summary`: frase curta do card de nota.
- `features[].rows`: pares `[recurso, status]`. Status possíveis: `yes`, `no`, `limited`, `unknown`, `experimental`.
  Para `limited` dá para usar `{ "status": "limited", "note": "observação" }`.
- `ratingSections[].rows`: pares `[critério, nota de 1 a 5]`.
- Seções com o mesmo `title` são alinhadas entre firmwares diferentes; recursos/critérios ausentes
  em um firmware aparecem como `unknown` (recursos) ou sem estrelas (notas).
- `icon`: `BookOpen`, `Type`, `ChartBar`, `Wifi`, `Monitor`, `Moon`, `RefreshCw`, `Gamepad2`,
  `Palette`, `Settings`, `Shield`, `Zap`, `Sparkles` (outros valores caem num ícone padrão).
