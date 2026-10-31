(function () {
  if (typeof AbortSignal.any !== 'function') {
    Object.defineProperty(AbortSignal, 'any', {
      configurable: true, writable: true,
      value: function any(signals) {
        var list = Array.from(signals);
        for (var signal of list) {
          if (!(signal instanceof AbortSignal)) throw new TypeError('Expected AbortSignal');
        }
        var controller = new AbortController();
        for (var signal of list) {
          if (signal.aborted) { controller.abort(signal.reason); return controller.signal; }
        }
        var subscriptions = [];
        controller.signal.addEventListener('abort', function () {
          for (var item of subscriptions) item[0].removeEventListener('abort', item[1]);
          subscriptions.length = 0;
        }, { once: true });
        for (let signal of list) {
          var listener = function () { controller.abort(signal.reason); };
          subscriptions.push([signal, listener]);
          signal.addEventListener('abort', listener, { once: true });
        }
        return controller.signal;
      }
    });
  }
})();
