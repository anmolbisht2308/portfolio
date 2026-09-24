/**
 * Runs synchronously in <head> before first paint: skip the intro for
 * returning visitors in this session and for reduced-motion users, so they
 * never see a flash of the preloader.
 */
const script = `try{if(sessionStorage.getItem("intro-seen")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="skip"}catch(e){}`;

export default function IntroScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
