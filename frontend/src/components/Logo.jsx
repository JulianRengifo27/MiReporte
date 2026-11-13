// ===== Logo de MiReporte =====
// Un pin de mapa (ubicación) con un signo de alerta adentro: "reporto lo que pasa aquí".
import { APP_NAME } from '../config.js';

export function IconoLogo({ tam = 32, className = '' }) {
  return (
    <svg className={className} width={tam} height={tam} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        d="M16 2.5c-6.1 0-11 4.8-11 10.8 0 7.6 9 15.1 10 15.9.6.5 1.4.5 2 0 1-.8 10-8.3 10-15.9 0-6-4.9-10.8-11-10.8z"
        fill="var(--acento, #d6382f)"
      />
      <rect x="14.6" y="7" width="2.8" height="8.4" rx="1.4" fill="#fff" />
      <circle cx="16" cy="19" r="1.7" fill="#fff" />
    </svg>
  );
}

// Logo completo: ícono + nombre ("Mi" normal, "Reporte" en negrita)
export default function Logo({ tam = 30 }) {
  const corte = APP_NAME.startsWith('Mi') ? 2 : 0;
  return (
    <span className="logo">
      <IconoLogo tam={tam} />
      <span className="logo-texto">
        <span className="logo-mi">{APP_NAME.slice(0, corte)}</span>
        <span className="logo-nombre">{APP_NAME.slice(corte)}</span>
      </span>
    </span>
  );
}
