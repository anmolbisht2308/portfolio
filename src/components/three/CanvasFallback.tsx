/**
 * Zero-JS stand-in while the WebGL chunk loads (and the permanent backdrop
 * if WebGL is unavailable): a soft indigo field where the network will be.
 */
export default function CanvasFallback() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(40% 45% at 68% 48%, rgb(124 156 255 / 0.10), transparent 70%), radial-gradient(18% 20% at 70% 50%, rgb(195 208 255 / 0.06), transparent 70%)",
      }}
    />
  );
}
