/* Interface da MarilIA: início, teste e diagnóstico.
   O conteúdo vem de data/ (mapa, questões e textos); aqui fica só a lógica de tela. */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var dados = {};
  var motor = null;
  var mostrarDominadas = false;

  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) {
      if (f == null) return;
      n.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return n;
  }

  function trocar(filhos) {
    app.replaceChildren.apply(app, filhos);
    window.scrollTo(0, 0);
  }

  function wordmark() {
    var nome = dados.conteudo.nome, dest = dados.conteudo.nome_destaque || "";
    var i = dest ? nome.lastIndexOf(dest) : -1;
    if (i < 0) return el("h1", { class: "wordmark", text: nome });
    return el("h1", { class: "wordmark", "aria-label": nome }, [
      nome.slice(0, i), el("span", { class: "ia", text: dest }), nome.slice(i + dest.length),
    ]);
  }

  function linkEstudo(h) {
    var url = h.link_estudo || (dados.conteudo.estudo.busca_url + encodeURIComponent(h.titulo));
    return el("a", { href: url, target: "_blank", rel: "noopener", text: dados.conteudo.estudo.rotulo + " ↗" });
  }

  /* ---------- Início ---------- */
  function telaInicio() {
    var c = dados.conteudo;
    var passos = el("ol", { class: "passos" }, c.como_funciona.map(function (p) {
      return el("li", null, [el("strong", { text: p.titulo }), el("p", { text: p.texto })]);
    }));
    var h = c.homenagem;
    trocar([
      el("header", { class: "cabecalho" }, [
        wordmark(),
        el("p", { class: "slogan" }, [el("span", { class: "marca", text: c.slogan })]),
        el("p", { class: "chamada", text: c.chamada }),
        el("ul", { class: "garantias" }, c.garantias.map(function (g) { return el("li", { text: g }); })),
        el("div", { class: "acoes" }, [el("button", { class: "botao", id: "comecar", onclick: iniciarTeste, text: "Começar o teste" })]),
      ]),
      el("section", { class: "secao" }, [el("h2", { text: "Como funciona" }), passos]),
      el("section", { class: "homenagem" }, [
        el("p", { class: "rotulo", text: "Homenagem" }),
        el("h2", { text: h.titulo }),
      ].concat(h.paragrafos.map(function (p) { return el("p", { text: p }); })).concat([
        el("p", { class: "fonte" }, [el("a", { href: h.fonte.url, target: "_blank", rel: "noopener", text: h.fonte.texto })]),
      ])),
      el("p", { class: "aviso", text: c.aviso_rascunho }),
    ]);
  }

  /* ---------- Teste ---------- */
  function iniciarTeste() {
    motor = new Motor(dados.mapa, dados.questoes, { maxPerguntas: 30 });
    mostrarDominadas = false;
    proximaPergunta();
  }

  function proximaPergunta() {
    var p = motor.proximaPergunta();
    if (!p) return telaResultado();
    var total = motor.ordem.length;
    var resolvidas = Object.keys(motor.status).length;
    var feitas = motor.historico.length;

    var opcoes = p.alternativas.map(function (a, i) {
      return el("label", { class: "opcao" }, [
        el("input", { type: "radio", name: "resposta", id: "op-" + i, value: String(i) }),
        el("span", { text: a.texto }),
      ]);
    });
    opcoes.push(el("label", { class: "opcao nao-sei" }, [
      el("input", { type: "radio", name: "resposta", id: "op-nao-sei", value: "nao-sei" }),
      el("span", { text: "Ainda não sei" }),
    ]));

    var botao = el("button", { class: "botao", type: "submit", id: "responder", disabled: "disabled", text: "Responder" });
    var form = el("form", { class: "pergunta", id: "form-pergunta" }, [
      el("p", { class: "rotulo", text: p.habilidade.titulo }),
      el("p", { class: "enunciado", id: "enunciado", text: p.questao.enunciado }),
      el("fieldset", { class: "opcoes", "aria-labelledby": "enunciado" }, opcoes),
      el("div", { class: "acoes" }, [botao]),
    ]);
    form.addEventListener("change", function () { botao.removeAttribute("disabled"); });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var escolha = form.querySelector("input:checked");
      if (!escolha) return;
      var acertou = escolha.value !== "nao-sei" && p.alternativas[Number(escolha.value)].correta;
      motor.responder(p.habilidade.codigo, p.questao.id, acertou);
      proximaPergunta();
    });

    trocar([
      el("div", { class: "progresso" }, [
        el("div", { class: "barra", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(total), "aria-valuenow": String(resolvidas) }, [
          el("span", { style: "width:" + Math.round(100 * resolvidas / total) + "%" }),
        ]),
        el("p", { class: "texto", text: "Pergunta " + (feitas + 1) + " · já mapeamos " + resolvidas + " de " + total + " habilidades" }),
      ]),
      form,
      el("div", { class: "acoes" }, [el("button", { class: "botao secundario", type: "button", onclick: telaInicio, text: "Sair do teste" })]),
    ]);
    var primeira = form.querySelector("input");
    if (primeira) primeira.focus();
  }

  /* ---------- Diagnóstico ---------- */
  function telaResultado() {
    var r = motor.resultado();
    var H = motor.hab;
    var c = dados.conteudo;
    var blocos = [wordmark()];

    if (r.pontoDePartida) {
      var h = H[r.pontoDePartida];
      blocos.push(el("section", { class: "ponto" }, [
        el("p", { class: "rotulo", text: "Seu ponto de partida" }),
        el("h2", null, [el("span", { class: "marca", text: h.titulo })]),
        el("p", { class: "descricao", text: h.descricao }),
        el("p", { class: "codigo", text: "Habilidade " + h.codigo + " da BNCC" }),
        el("div", { class: "acoes" }, [linkEstudo(h)]),
      ]));
      var extra = r.fronteira.length > 1
        ? " Também vale começar por " + r.fronteira.filter(function (x) { return x !== r.pontoDePartida; })
            .map(function (x) { return H[x].titulo; }).join(", ") + "."
        : "";
      blocos.push(el("p", { class: "resumo", text:
        "Você já domina " + r.dominadas.length + " das " + motor.ordem.length + " habilidades de Números do Ensino Fundamental. " +
        "Daqui até o fim do 9º ano são " + r.trilha.length + " passos." + extra }));
    } else {
      blocos.push(el("section", { class: "ponto" }, [
        el("p", { class: "rotulo", text: "Resultado" }),
        el("h2", null, [el("span", { class: "marca", text: "Sua base de Números está completa" })]),
        el("p", { class: "descricao", text: "Você mostrou domínio das habilidades de Números do 1º ao 9º ano. O próximo passo é a matemática do Ensino Médio." }),
      ]));
    }

    // Trilha agrupada por ano
    var trilhaSet = {};
    r.trilha.forEach(function (x) { trilhaSet[x] = true; });
    var ordem = r.trilha.slice();
    if (mostrarDominadas) ordem = motor._topologica(motor.ordem);
    var porAno = {};
    ordem.forEach(function (x) { (porAno[H[x].ano] = porAno[H[x].ano] || []).push(x); });

    var anos = Object.keys(porAno).sort(function (a, b) { return a - b; }).map(function (ano) {
      return el("div", { class: "ano" }, [
        el("h3", { text: ano + "º ano" }),
        el("ol", { class: "itens" }, porAno[ano].map(function (x) {
          var hab = H[x];
          var estado = !trilhaSet[x] ? "dominada" : (x === r.pontoDePartida || r.fronteira.indexOf(x) >= 0 ? "comeco" : "proximo");
          var selo = { dominada: "Você já domina", comeco: "Comece aqui", proximo: "Próximo passo" }[estado];
          return el("li", { class: "item " + estado }, [
            el("span", { class: "selo", text: selo }),
            el("div", null, [
              el("p", { class: "objeto", text: hab.titulo }),
              estado === "dominada" ? null : el("p", { class: "descricao", text: hab.descricao }),
              el("p", { class: "codigo", text: hab.codigo }),
              estado === "dominada" ? null : linkEstudo(hab),
            ]),
          ]);
        })),
      ]);
    });

    if (r.trilha.length || mostrarDominadas) {
      blocos.push(el("section", { class: "secao" }, [
        el("h2", { text: "Sua trilha até o 9º ano" }),
        el("button", { class: "alternar", type: "button", onclick: function () { mostrarDominadas = !mostrarDominadas; telaResultado(); },
          text: mostrarDominadas ? "Mostrar só o que falta estudar" : "Mostrar também o que você já domina" }),
        el("div", { class: "trilha" }, anos),
      ]));
    }

    // Caminho aspiracional
    var caminho = [el("li", { class: "voce", text: "Você, hoje" }), el("li", { class: "seta", "aria-hidden": "true", text: "→" }), el("li", { text: "Números até o 9º ano" })];
    c.depois_do_9_ano.forEach(function (etapa, i) {
      caminho.push(el("li", { class: "seta", "aria-hidden": "true", text: "→" }));
      caminho.push(el("li", { class: i === c.depois_do_9_ano.length - 1 ? "fim" : "", text: etapa }));
    });
    blocos.push(el("section", { class: "secao" }, [
      el("h2", { text: "E depois do 9º ano" }),
      el("p", { text: "Cada passo da sua trilha prepara o seguinte. É o mesmo caminho que leva à ciência e à tecnologia." }),
      el("ol", { class: "caminho" }, caminho),
    ]));

    blocos.push(el("section", { class: "secao" }, [
      el("h2", { text: "Quem fez esse caminho antes" }),
      el("div", { class: "mulheres" }, c.mulheres.map(function (m) {
        return el("div", { class: "mulher" }, [el("strong", { text: m.nome }), el("span", { text: m.texto })]);
      })),
    ]));

    blocos.push(el("div", { class: "acoes" }, [
      el("button", { class: "botao", type: "button", onclick: iniciarTeste, text: "Refazer o teste" }),
      el("button", { class: "botao secundario", type: "button", onclick: telaInicio, text: "Voltar ao início" }),
    ]));
    blocos.push(el("p", { class: "aviso", text: c.aviso_rascunho + " Você respondeu " + r.perguntas + " perguntas." }));
    trocar(blocos);
  }

  /* ---------- Carregamento ---------- */
  function carregar(arquivo) {
    return fetch(arquivo).then(function (res) {
      if (!res.ok) throw new Error(arquivo + " respondeu " + res.status);
      return res.json();
    });
  }

  Promise.all([carregar("data/mapa.json"), carregar("data/questoes.json"), carregar("data/conteudo.json")])
    .then(function (r) {
      dados.mapa = r[0]; dados.questoes = r[1]; dados.conteudo = r[2];
      document.title = dados.conteudo.nome;
      telaInicio();
    })
    .catch(function (e) {
      app.replaceChildren(el("div", { class: "erro-carga" }, [
        el("h2", { text: "Não foi possível carregar os dados" }),
        el("p", { text: "Os arquivos da pasta data/ não abriram (" + e.message + "). Se você abriu o index.html direto do computador, rode um servidor local: veja o README." }),
      ]));
    });
})();
