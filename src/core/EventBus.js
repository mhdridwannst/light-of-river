export class EventBus {
  #h = new Map();
  on(e, fn) {
    (this.#h.get(e) ?? this.#h.set(e, []).get(e)).push(fn);
  }
  emit(e, d) {
    (this.#h.get(e) ?? []).forEach((fn) => fn(d));
  }
}
