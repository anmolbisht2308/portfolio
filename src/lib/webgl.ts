let cached: boolean | undefined;

/**
 * Can this browser create a WebGL context? Probed once and cached; the probe
 * context is released immediately so it doesn't count against the
 * browser's (small) limit of live WebGL contexts.
 */
export function hasWebGL(): boolean {
  if (cached !== undefined) return cached;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    cached = !!gl;
  } catch {
    cached = false;
  }
  return cached;
}
