// Lee un texto en voz alta con la Web Speech API del navegador
export function hablar(texto) {
  if (!('speechSynthesis' in window)) { alert(texto); return; }
  window.speechSynthesis.cancel();
  const voz = new SpeechSynthesisUtterance(texto);
  voz.lang = 'es-CO';
  window.speechSynthesis.speak(voz);
}
