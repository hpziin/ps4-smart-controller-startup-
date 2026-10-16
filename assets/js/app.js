/* =========================================================
   app.js
   Lógica da interface: estados, cartões, foco e navegação.
   ========================================================= */

(function () {
  "use strict";

  var DOM = {
    boot: document.getElementById("boot-overlay"),
    statusLine: document.getElementById("status-line"),
    statusSub: document.getElementById("status-sub"),
    cards: document.getElementById("cards"),
    emptyState: document.getElementById("empty-state"),
    emptyHint: document.getElementById("empty-hint"),
    notice: document.getElementById("notice"),
    btnRetry: document.getElementById("btn-retry"),
    btnContinue: document.getElementById("btn-continue"),
    clock: document.getElementById("clock"),
    legend: document.getElementById("legend")
  };

  var state = {
    controllers: [],
    focusables: [],
    focusIndex: 0,
    activeGamepadIndex: null,
    pollingId: null,
    lastButtons: {}
  };

  /* ---------------- Relógio ---------------- */
  function startClock() {
    function tick() {
      var d = new Date();
      var hh = String(d.getHours()).padStart(2, "0");
      var mm = String(d.getMinutes()).padStart(2, "0");
      DOM.clock.textContent = hh + ":" + mm;
    }
    tick();
    setInterval(tick, 15000);
  }

  /* ---------------- Boot ---------------- */
  function endBoot() {
    setTimeout(function () {
      DOM.boot.classList.add("done");
      DOM.boot.setAttribute("aria-hidden", "true");
    }, 1400);
  }

  /* ---------------- Estados visuais ---------------- */
  function classify(pad) {
    if (!pad) return "unknown";
    if (pad.connected && (pad.isStandard || pad.buttonsCount > 0)) return "connected";
    if (pad.connected) return "waiting";
    return "unknown";
  }

  function stateLabel(kind) {
    if (kind === "connected") return "Conectado";
    if (kind === "waiting") return "Aguardando ativação";
    return "Estado desconhecido";
  }

  function renderCards() {
    var list = state.controllers;
    DOM.cards.innerHTML = "";

    if (!list.length) {
      DOM.cards.hidden = true;
      return;
    }
    DOM.cards.hidden = false;

    list.forEach(function (pad) {
      var kind = classify(pad);
      var card = document.createElement("article");
      card.className = "card state-" + kind;
      card.tabIndex = 0;
      card.dataset.index = pad.index;

      var vendor = pad.vendor ? "0x" + pad.vendor : "—";
      var product = pad.product ? "0x" + pad.product : "—";

      card.innerHTML =
        '<div class="card-top">' +
          '<img class="card-icon" src="assets/images/controller.svg" alt="" />' +
          '<div>' +
            '<h2 class="card-name">' + escapeHtml(shortName(pad.id)) + '</h2>' +
            '<p class="card-slot">Slot #' + pad.index + ' • ' + (pad.isStandard ? "Standard Mapping" : "Mapping não padrão") + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="card-meta">' +
          '<span>Botões: <strong>' + pad.buttonsCount + '</strong></span>' +
          '<span>Eixos: <strong>' + pad.axesCount + '</strong></span>' +
          '<span>Vendor: <strong>' + vendor + '</strong></span>' +
          '<span>Product: <strong>' + product + '</strong></span>' +
        '</div>' +
        '<span class="badge"><span class="dot"></span>' + stateLabel(kind) + '</span>';

      DOM.cards.appendChild(card);
    });

    rebuildFocusables();
  }

  function shortName(id) {
    if (!id) return "Controle";
    /* Limita o ID para caber bem na TV */
    return id.length > 60 ? id.slice(0, 57) + "..." : id;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------------- Estado geral ---------------- */
  function renderOverall() {
    var list = state.controllers;
    var connected = list.filter(function (p) { return classify(p) === "connected"; });
    var waiting = list.filter(function (p) { return classify(p) === "waiting"; });

    if (!ControllerManager.supported) {
      DOM.statusLine.textContent = "Gamepad API indisponível neste navegador.";
      DOM.statusSub.textContent = "Não é possível detectar controles por aqui.";
      DOM.emptyState.hidden = true;
      showNotice(
        "A Gamepad API não está disponível no navegador deste PS4. " +
        "O site consegue exibir a interface, mas não pode ler os controles USB. " +
        "Isso é uma limitação do navegador, não do site.",
        true
      );
      DOM.btnContinue.disabled = true;
      return;
    }

    DOM.notice.hidden = true;

    if (list.length === 0) {
      DOM.statusLine.textContent = "Verificando controles conectados...";
      DOM.statusSub.textContent = "Nenhum controle reconhecido pelo navegador até agora.";
      DOM.emptyState.hidden = false;
      DOM.emptyHint.textContent = "Conecte o controle por cabo USB e pressione o botão PS.";
      DOM.btnContinue.disabled = true;
      return;
    }

    DOM.emptyState.hidden = true;

    if (connected.length > 0) {
      DOM.statusLine.textContent = connected.length + " controle(s) pronto(s) para uso.";
      DOM.statusSub.textContent = "Você pode continuar.";
      DOM.btnContinue.disabled = false;
      state.activeGamepadIndex = connected[0].index;
    } else if (waiting.length > 0) {
      DOM.statusLine.textContent = "Controle USB detectado, aguardando ativação.";
      DOM.statusSub.textContent = "Pressione o botão PS do controle para ativá-lo.";
      DOM.btnContinue.disabled = true;
      state.activeGamepadIndex = waiting[0].index;
    } else {
      DOM.statusLine.textContent = "Controles em estado desconhecido.";
      DOM.statusSub.textContent = "Pressione o botão PS para tentar ativar.";
      DOM.btnContinue.disabled = true;
    }
  }

  function showNotice(msg, isError) {
    DOM.notice.hidden = false;
    DOM.notice.textContent = msg;
    DOM.notice.classList.toggle("error", !!isError);
  }

  /* ---------------- Foco / navegação ---------------- */
  function rebuildFocusables() {
    var cards = Array.prototype.slice.call(DOM.cards.querySelectorAll(".card"));
    state.focusables = cards.concat([DOM.btnRetry, DOM.btnContinue].filter(function (b) { return !b.disabled; }));
    if (state.focusIndex >= state.focusables.length) state.focusIndex = 0;
    applyFocus();
  }

  function applyFocus() {
    state.focusables.forEach(function (el, i) {
      el.classList.toggle("focused", i === state.focusIndex);
    });
    var el = state.focusables[state.focusIndex];
    if (el && el.focus) el.focus({ preventScroll: true });
  }

  function moveFocus(delta) {
    if (!state.focusables.length) return;
    state.focusIndex = (state.focusIndex + delta + state.focusables.length) % state.focusables.length;
    applyFocus();
  }

  function activateFocused() {
    var el = state.focusables[state.focusIndex];
    if (el && typeof el.click === "function") el.click();
  }

  /* ---------------- Ações ---------------- */
  function retry() {
    if (!ControllerManager.supported) return;
    /* Releitura imediata; o loop contínuo também atualizará. */
    var list = ControllerManager.list();
    state.controllers = list;
    renderCards();
    renderOverall();
  }

  function continueAction() {
    var ready = state.controllers.filter(function (p) { return classify(p) === "connected"; });
    if (!ready.length) return;
    showNotice(
      "Controle pronto: " + shortName(ready[0].id) + ". " +
      "Esta interface é apenas web — a inicialização real do console depende do sistema do PS4.",
      false
    );
  }

  /* ---------------- Navegação por teclado e controle ---------------- */
  function bindKeyboard() {
    window.addEventListener("keydown", function (e) {
      switch (e.key) {
        case "ArrowUp": moveFocus(-1); e.preventDefault(); break;
        case "ArrowDown": moveFocus(1); e.preventDefault(); break;
        case "ArrowLeft": moveFocus(-1); e.preventDefault(); break;
        case "ArrowRight": moveFocus(1); e.preventDefault(); break;
        case "Enter": activateFocused(); e.preventDefault(); break;
        case "Escape": e.preventDefault(); break;
        default: break;
      }
    });
  }

  function pollGamepadInput() {
    if (!ControllerManager.supported) return;
    function tick() {
      var idx = state.activeGamepadIndex;
      if (idx !== null) {
        var input = ControllerManager.readInput(idx);
        if (input) {
          handleInput(input);
        }
      }
      state.pollingId = requestAnimationFrame(tick);
    }
    state.pollingId = requestAnimationFrame(tick);
  }

  function handleInput(input) {
    var key = state.activeGamepadIndex + "";
    if (!state.lastButtons[key]) state.lastButtons[key] = {};

    function edge(name, pressed) {
      var prev = state.lastButtons[key][name] || false;
      state.lastButtons[key][name] = pressed;
      return pressed && !prev;
    }

    if (edge("up", input.up) || edge("left", input.left)) moveFocus(-1);
    if (edge("down", input.down) || edge("right", input.right)) moveFocus(1);
    if (edge("cross", input.cross)) activateFocused();
    if (edge("circle", input.circle)) { /* Reservado para "voltar" */ }
  }

  /* ---------------- Inicialização ---------------- */
  function init() {
    startClock();
    endBoot();
    bindKeyboard();

    DOM.btnRetry.addEventListener("click", retry);
    DOM.btnContinue.addEventListener("click", continueAction);

    if (!ControllerManager.supported) {
      renderOverall();
      return;
    }

    ControllerManager.on("change", function (list) {
      state.controllers = list;
      renderCards();
      renderOverall();
    });

    ControllerManager.init();
    pollGamepadInput();

    /* Primeira leitura imediata */
    state.controllers = ControllerManager.list();
    renderCards();
    renderOverall();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
