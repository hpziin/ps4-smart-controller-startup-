/* =========================================================
   controller.js
   Camada de abstração da Gamepad API.
   Não simula dados: expõe apenas o que o navegador informa.
   ========================================================= */

(function (global) {
  "use strict";

  var ControllerManager = {
    supported: typeof navigator !== "undefined" && typeof navigator.getGamepads === "function",
    _listeners: { change: [] },
    _prevSignature: "",
    _rafId: null,
    _lastPoll: 0,

    /* Mapeamento amigável dos botões padrão (Standard Gamepad) */
    BUTTON_LABELS: [
      "Cross (X)", "Circle (O)", "Square", "Triangle",
      "L1", "R1", "L2", "R2",
      "Share", "Options", "L3", "R3",
      "D-Pad ↑", "D-Pad ↓", "D-Pad ←", "D-Pad →",
      "PS", "Touchpad"
    ],

    init: function () {
      if (!this.supported) return;
      var self = this;

      global.addEventListener("gamepadconnected", function (e) {
        self._emit("gamepadconnected", self._describe(e.gamepad));
      });
      global.addEventListener("gamepaddisconnected", function (e) {
        self._emit("gamepaddisconnected", self._describe(e.gamepad));
      });

      this._loop();
    },

    on: function (event, cb) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(cb);
    },

    _emit: function (event, payload) {
      (this._listeners[event] || []).forEach(function (cb) {
        try { cb(payload); } catch (err) { console.error(err); }
      });
    },

    /* Converte um Gamepad em um objeto simples e serializável */
    _describe: function (pad) {
      if (!pad) return null;
      return {
        index: pad.index,
        id: pad.id || "Controle desconhecido",
        mapping: pad.mapping || "",
        connected: !!pad.connected,
        buttonsCount: pad.buttons ? pad.buttons.length : 0,
        axesCount: pad.axes ? pad.axes.length : 0,
        timestamp: pad.timestamp || 0,
        isStandard: pad.mapping === "standard",
        vendor: this._extractVendor(pad.id),
        product: this._extractProduct(pad.id)
      };
    },

    _extractVendor: function (id) {
      var m = /vendor:([0-9a-f]{4})/i.exec(id || "");
      return m ? m[1].toUpperCase() : null;
    },

    _extractProduct: function (id) {
      var m = /product:([0-9a-f]{4})/i.exec(id || "");
      return m ? m[1].toUpperCase() : null;
    },

    /* Retorna todos os controles visíveis para o navegador */
    list: function () {
      if (!this.supported) return [];
      var raw = navigator.getGamepads ? navigator.getGamepads() : [];
      var out = [];
      for (var i = 0; i < raw.length; i++) {
        if (raw[i]) out.push(this._describe(raw[i]));
      }
      return out;
    },

    /* Detecta se algum botão foi pressionado em um controle */
    anyButtonPressed: function (index) {
      if (!this.supported) return false;
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      var pad = pads[index];
      if (!pad || !pad.buttons) return false;
      for (var i = 0; i < pad.buttons.length; i++) {
        if (pad.buttons[i] && pad.buttons[i].pressed) return true;
      }
      return false;
    },

    /* Assinatura para detectar mudanças reais na lista de controles */
    _signature: function (list) {
      return list.map(function (p) {
        return p.index + "|" + p.id + "|" + p.mapping + "|" + p.buttonsCount;
      }).join("::");
    },

    _loop: function () {
      var self = this;
      function tick(ts) {
        /* Poll ~10x por segundo é suficiente e leve para o PS4 */
        if (!self._lastPoll || ts - self._lastPoll > 100) {
          self._lastPoll = ts;
          var list = self.list();
          var sig = self._signature(list);
          if (sig !== self._prevSignature) {
            self._prevSignature = sig;
            self._emit("change", list);
          } else {
            self._emit("poll", list);
          }
        }
        self._rafId = global.requestAnimationFrame(tick);
      }
      this._rafId = global.requestAnimationFrame(tick);
    },

    stop: function () {
      if (this._rafId) global.cancelAnimationFrame(this._rafId);
      this._rafId = null;
    },

    /* Leitura contínua de um controle para navegação (direcional, X, O) */
    readInput: function (index) {
      if (!this.supported) return null;
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      var pad = pads[index];
      if (!pad) return null;

      function pressed(i) {
        return !!(pad.buttons[i] && pad.buttons[i].pressed);
      }

      var axes = pad.axes || [];
      return {
        up: pressed(12) || (axes[1] !== undefined && axes[1] < -0.6),
        down: pressed(13) || (axes[1] !== undefined && axes[1] > 0.6),
        left: pressed(14) || (axes[0] !== undefined && axes[0] < -0.6),
        right: pressed(15) || (axes[0] !== undefined && axes[0] > 0.6),
        cross: pressed(0),
        circle: pressed(1)
      };
    }
  };

  global.ControllerManager = ControllerManager;
})(window);
