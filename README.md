# MarilIA

Teste adaptativo de matemática que encontra o ponto em que a base de cada pessoa travou e monta a trilha de estudo a partir dali, até a ciência e a tecnologia. Homenagem a Marília Chaves Peixoto (1921–1961), primeira brasileira doutora em matemática.

MVP: eixo **Números** da BNCC, Ensino Fundamental (1º ao 9º ano), 79 habilidades.

## Estrutura

```
index.html          página única (início, teste e diagnóstico)
css/style.css       visual
js/motor.js         motor adaptativo (sem dependência de navegador)
js/app.js           telas
data/mapa.json      habilidades da BNCC + pré-requisitos  ← conteúdo
data/questoes.json  banco de questões                     ← conteúdo
data/conteudo.json  textos do site (nome, homenagem etc.) ← conteúdo
scripts/simular.js  testes do motor com perfis simulados
vercel.json         configuração do deploy
```

Para mudar texto, questões ou ligações, edite só os arquivos de `data/`. O código não precisa mudar.

## Rodar no computador

O navegador bloqueia a leitura dos arquivos de `data/` quando o `index.html` é aberto direto. Use um servidor local:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Testar o motor

```bash
node scripts/simular.js
```

Simula pessoas com lacunas conhecidas e confere se o teste encontra o ponto de partida certo.

## Publicar na Vercel

É um site estático: não precisa de build.

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel, **Add New → Project**, escolha o repositório.
3. Em **Framework Preset**, deixe **Other**. Sem comando de build, diretório de saída `.` (raiz).
4. **Deploy**.

Pela linha de comando: `npx vercel` dentro da pasta.

## Como o motor funciona

- Cada habilidade é um nó do grafo de pré-requisitos (`data/mapa.json`).
- Acertou: a habilidade e todos os seus pré-requisitos contam como dominados.
- Errou ou "Ainda não sei": a habilidade e tudo o que depende dela contam como lacuna.
- A próxima pergunta é a habilidade desconhecida que divide melhor o que falta descobrir (como uma busca binária pelas cadeias).
- Ponto de partida = a primeira lacuna cujos pré-requisitos estão todos dominados.
- Em 500 perfis simulados com 1 a 3 lacunas, o motor acertou todos, com média de 18 perguntas e máximo de 26.

Limitação conhecida: com uma questão por habilidade, um chute certo pode marcar uma cadeia inteira como dominada. O próximo passo é ter de 3 a 5 questões por habilidade e confirmar os acertos em habilidades com muitos pré-requisitos.

## Créditos e licenças

- Textos das habilidades: BNCC (2018), via [bncc.dev](https://bncc.dev) (mantido pela Profy), licença CC BY 4.0: https://github.com/bncc-dev/bncc-dados
- Pré-requisitos e questões: curadoria própria, rascunho pendente de revisão docente.
- Links de estudo: busca da Khan Academy em português (confira se a busca abre resultados; dá para trocar por um link específico no campo `link_estudo` de cada habilidade em `data/mapa.json`).
