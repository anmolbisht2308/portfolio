/**
 * Tiny event bus linking the chat demo to the architecture diagram, so every
 * message you send (and every token streamed back) is visibly routed
 * through the system that carries it.
 */
export type ChatEvent = "request" | "token" | "done";
type Handler = (e: ChatEvent) => void;

const handlers = new Set<Handler>();

export const chatBus = {
  emit(e: ChatEvent) {
    handlers.forEach((h) => h(e));
  },
  on(h: Handler) {
    handlers.add(h);
    return () => {
      handlers.delete(h);
    };
  },
};
