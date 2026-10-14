// Simula perfis de pessoas e confere se o motor acha o ponto de partida certo.
const Motor = require("../js/motor.js");
const mapa = require("../data/mapa.json");
const questoes = require("../data/questoes.json");
const H = Object.fromEntries(mapa.habilidades.map(h => [h.codigo, h]));
function desc(c, s = new Set()) { for (const d of H[c].dependentes) if (!s.has(d)) { s.add(d); desc(d, s); } return s; }
function perfil(lacunas) {
  const nao = new Set();
  for (const g of lacunas) { nao.add(g); desc(g).forEach(x => nao.add(x)); }
  return c => !nao.has(c);
}
const casos = {
  "trava em divisibilidade (EF06MA05)": ["EF06MA05"],
  "trava em fração (EF05MA03)": ["EF05MA03"],
  "trava em divisão (EF04MA07)": ["EF04MA07"],
  "trava em porcentagem (EF05MA06)": ["EF05MA06"],
  "duas lacunas (EF04MA09 e EF06MA04)": ["EF04MA09", "EF06MA04"],
  "domina tudo": [],
  "começa do zero (EF01MA01 e EF01MA02)": ["EF01MA01", "EF01MA02"],
};
let ok = true;
for (const [nome, gaps] of Object.entries(casos)) {
  const sabe = perfil(gaps);
  const m = new Motor(mapa, questoes, { aleatorio: () => 0.5 });
  let p;
  while ((p = m.proximaPergunta())) m.responder(p.habilidade.codigo, p.questao.id, sabe(p.habilidade.codigo));
  const r = m.resultado();
  const esperado = gaps.slice().sort();
  const achou = r.fronteira.slice().sort();
  const certo = JSON.stringify(esperado) === JSON.stringify(achou);
  ok = ok && certo;
  console.log(`${certo ? "OK " : "ERRO"} ${nome}: ${r.perguntas} perguntas, ponto de partida ${r.pontoDePartida}, fronteira [${achou}], trilha ${r.trilha.length}`);
}
process.exit(ok ? 0 : 1);
