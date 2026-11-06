# MarilIA

[Português](README.pt-BR.md) · English

An adaptive math test that finds the point where a person's foundation broke down and builds a study path from there, all the way to science and technology. Named in honor of Marília Chaves Peixoto (1921–1961), the first Brazilian woman to earn a PhD in mathematics.

MVP: the **Numbers** strand of Brazil's national curriculum (BNCC), elementary and middle school (grades 1 to 9), 79 skills.

> The app itself (questions, skill texts, interface) is in Portuguese on purpose: it is built for Brazilian students and follows the BNCC. This README explains the project and the engine in English.

## Structure

```
index.html          single page (start, test and diagnosis)
css/style.css       look and feel
js/motor.js         adaptive engine ("motor"), no browser dependency
js/app.js           screens
data/mapa.json      BNCC skills + prerequisites          ← content
data/questoes.json  question bank                        ← content
data/conteudo.json  site texts (name, tribute, etc.)     ← content
scripts/simular.js  engine tests with simulated profiles
vercel.json         deploy configuration
```

To change texts, questions or links between skills, edit only the files in `data/`. The code does not need to change.

## Run locally

Browsers block reading the `data/` files when `index.html` is opened directly. Use a local server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Test the engine

```bash
node scripts/simular.js
```

It simulates people with known gaps and checks that the test finds the right starting point.

## Deploy on Vercel

It is a static site: no build step.

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New → Project** and pick the repository.
3. Leave **Framework Preset** as **Other**, no build command, output directory `.` (root).
4. **Deploy**.

From the command line: `npx vercel` inside the folder.

## How the engine works

- Each skill is a node in a prerequisite graph (`data/mapa.json`).
- Correct answer: the skill and all of its prerequisites count as mastered.
- Wrong answer or "I don't know yet": the skill and everything that depends on it count as gaps.
- The next question is the unknown skill that best splits what is left to discover (like a binary search over the prerequisite chains).
- Starting point = the first gap whose prerequisites are all mastered.
- On 500 simulated profiles with 1 to 3 gaps, the engine got every one right, averaging 18 questions with a maximum of 26.

Known limitation: with one question per skill, a lucky guess can mark an entire chain as mastered. The next step is 3 to 5 questions per skill and confirming correct answers on skills with many prerequisites.

## Credits and licenses

- Skill texts: BNCC (2018), via [bncc.dev](https://bncc.dev) (maintained by Profy), CC BY 4.0: https://github.com/bncc-dev/bncc-dados
- Prerequisites and questions: own curation, draft pending review by math teachers.
- Study links: Khan Academy search in Portuguese (check that the search opens results; each skill's `link_estudo` field in `data/mapa.json` can be replaced with a specific link).
