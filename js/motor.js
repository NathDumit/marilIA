/*
 * Motor adaptativo da MarilIA.
 *
 * Ideia: cada habilidade é um nó do grafo de pré-requisitos.
 * - Acertou uma habilidade: ela e todos os seus pré-requisitos (ancestrais) contam como dominados.
 * - Errou: ela e tudo o que depende dela (descendentes) contam como lacuna.
 * A próxima pergunta é a habilidade ainda desconhecida que divide melhor o que falta descobrir,
 * como uma busca binária ao longo das cadeias. O teste termina quando não sobra habilidade
 * desconhecida ou quando chega ao limite de perguntas.
 *
 * Sem dependência de navegador: funciona igual no site e nos testes em Node.
 */
(function (root) {
  "use strict";

  function Motor(mapa, questoes, opcoes) {
    opcoes = opcoes || {};
    this.maxPerguntas = opcoes.maxPerguntas || 30;
    this.aleatorio = opcoes.aleatorio || Math.random;

    this.hab = {};
    this.ordem = [];
    var self = this;
    mapa.habilidades.forEach(function (h) {
      self.hab[h.codigo] = h;
      self.ordem.push(h.codigo);
    });
    this.questoes = questoes.questoes || questoes;

    this.anc = {};
    this.desc = {};
    this.ordem.forEach(function (c) {
      self.anc[c] = self._fecho(c, "pre_requisitos");
      self.desc[c] = self._fecho(c, "dependentes");
    });

    this.status = {};   // codigo -> "dominada" | "lacuna"
    this.origem = {};   // codigo -> "resposta" | "inferida"
    this.historico = []; // { codigo, questaoId, acertou }
    this.usadas = {};   // questaoId -> true
  }

  Motor.prototype._fecho = function (c, campo) {
    var vistos = {}, pilha = (this.hab[c][campo] || []).slice();
    while (pilha.length) {
      var x = pilha.pop();
      if (vistos[x] || !this.hab[x]) continue;
      vistos[x] = true;
      pilha.push.apply(pilha, this.hab[x][campo] || []);
    }
    return Object.keys(vistos);
  };

  Motor.prototype._temQuestao = function (c) {
    var lista = this.questoes[c] || [];
    var usadas = this.usadas;
    return lista.some(function (q) { return !usadas[q.id]; });
  };

  Motor.prototype._desconhecida = function (c) {
    return !this.status[c];
  };

  /* Quantas desconhecidas cada resposta resolveria; escolhemos a que equilibra os dois lados. */
  Motor.prototype._pontuacao = function (c) {
    var self = this;
    var a = this.anc[c].filter(function (x) { return self._desconhecida(x); }).length;
    var d = this.desc[c].filter(function (x) { return self._desconhecida(x); }).length;
    return Math.min(a + 1, d + 1) * 1000 + (a + d);
  };

  Motor.prototype.terminou = function () {
    return this.historico.length >= this.maxPerguntas || this.proximaHabilidade() === null;
  };

  Motor.prototype.proximaHabilidade = function () {
    var melhor = null, melhorPts = -1, self = this;
    this.ordem.forEach(function (c) {
      if (!self._desconhecida(c) || !self._temQuestao(c)) return;
      var p = self._pontuacao(c);
      if (p > melhorPts) { melhor = c; melhorPts = p; }
    });
    return melhor;
  };

  /* Devolve { habilidade, questao, alternativas: [{texto, correta}] } com as opções embaralhadas. */
  Motor.prototype.proximaPergunta = function () {
    if (this.historico.length >= this.maxPerguntas) return null;
    var c = this.proximaHabilidade();
    if (!c) return null;
    var usadas = this.usadas;
    var q = (this.questoes[c] || []).filter(function (x) { return !usadas[x.id]; })[0];
    var alternativas = q.alternativas.map(function (t, i) { return { texto: t, correta: i === q.correta }; });
    for (var i = alternativas.length - 1; i > 0; i--) {
      var j = Math.floor(this.aleatorio() * (i + 1));
      var tmp = alternativas[i]; alternativas[i] = alternativas[j]; alternativas[j] = tmp;
    }
    return { habilidade: this.hab[c], questao: q, alternativas: alternativas };
  };

  /* acertou = true/false. "Ainda não sei" conta como false. */
  Motor.prototype.responder = function (codigo, questaoId, acertou) {
    var self = this;
    this.usadas[questaoId] = true;
    this.historico.push({ codigo: codigo, questaoId: questaoId, acertou: acertou });
    this.status[codigo] = acertou ? "dominada" : "lacuna";
    this.origem[codigo] = "resposta";
    var alvo = acertou ? this.anc[codigo] : this.desc[codigo];
    alvo.forEach(function (x) {
      if (self._desconhecida(x)) {
        self.status[x] = acertou ? "dominada" : "lacuna";
        self.origem[x] = "inferida";
      }
    });
  };

  /* Ordena habilidades respeitando os pré-requisitos (e, no empate, ano e código). */
  Motor.prototype._topologica = function (codigos) {
    var conj = {}, self = this;
    codigos.forEach(function (c) { conj[c] = true; });
    var grau = {};
    codigos.forEach(function (c) {
      grau[c] = self.hab[c].pre_requisitos.filter(function (p) { return conj[p]; }).length;
    });
    var prontos = codigos.filter(function (c) { return grau[c] === 0; });
    var saida = [];
    var cmp = function (x, y) { return self.hab[x].ano - self.hab[y].ano || (x < y ? -1 : 1); };
    while (prontos.length) {
      prontos.sort(cmp);
      var c = prontos.shift();
      saida.push(c);
      self.hab[c].dependentes.forEach(function (d) {
        if (conj[d] && --grau[d] === 0) prontos.push(d);
      });
    }
    return saida;
  };

  Motor.prototype.resultado = function () {
    var self = this;
    // Habilidades nunca resolvidas (sem questão) entram como lacuna, para irem para a trilha.
    var lacunas = this.ordem.filter(function (c) { return self.status[c] !== "dominada"; });
    var dominadas = this.ordem.filter(function (c) { return self.status[c] === "dominada"; });
    var fronteira = lacunas.filter(function (c) {
      return self.hab[c].pre_requisitos.every(function (p) { return self.status[p] === "dominada"; });
    });
    var trilha = this._topologica(lacunas);
    var ponto = trilha.filter(function (c) { return fronteira.indexOf(c) >= 0; })[0] || null;
    return {
      perguntas: this.historico.length,
      acertos: this.historico.filter(function (h) { return h.acertou; }).length,
      dominadas: dominadas,
      lacunas: lacunas,
      fronteira: this._topologica(fronteira),
      pontoDePartida: ponto,
      trilha: trilha,
      completo: lacunas.length === 0,
    };
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Motor;
  else root.Motor = Motor;
})(this);
