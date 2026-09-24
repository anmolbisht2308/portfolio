/**
 * Mutable, render-free bridge between DOM scroll choreography and the WebGL
 * scene. Sections write numbers here from ScrollTrigger callbacks; the scene
 * reads them inside useFrame. No React state → no re-renders at 60fps.
 */
type Listener = () => void;

export const sceneState = {
  /** 0 → 1 as the hero scrolls away: drives the camera dolly-in. */
  dolly: 0,
  /** 0 → 1: the network calms (slower, flatter, fewer packets). Driven by About. */
  calm: 0,
  /** 0 → 1: every node converges into the single CTA node. Driven by Contact. */
  converge: 0,
  /** Normalised pointer, -1 … 1, (0,0) = centre. */
  pointer: { x: 0, y: 0, active: false },
  /** Is any scene-owning section on screen? When false the canvas stops rendering. */
  inView: true,
};

const listeners = new Set<Listener>();

export function setSceneInView(v: boolean) {
  if (sceneState.inView === v) return;
  sceneState.inView = v;
  listeners.forEach((l) => l());
}

export function subscribeScene(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
