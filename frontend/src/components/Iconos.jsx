// ===== Íconos de línea (estilo minimalista) =====
// Todos usan "currentColor": toman el color del texto donde se ponen.
const Base = ({ children, tam = 24 }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);

export const IconoMapa = (p) => <Base {...p}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></Base>;
export const IconoEscudo = (p) => <Base {...p}><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3z" /><path d="m9 12 2 2 4-4" /></Base>;
export const IconoRuta = (p) => <Base {...p}><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16" /></Base>;
export const IconoAccesible = (p) => <Base {...p}><circle cx="12" cy="4.5" r="1.5" /><path d="M5 8l7 1.5L19 8M12 9.5V14m0 0-3 6m3-6 3 6" /></Base>;
export const IconoCamara = (p) => <Base {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Base>;
export const IconoChispa = (p) => <Base {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></Base>;
export const IconoCampana = (p) => <Base {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></Base>;
export const IconoTelefono = (p) => <Base {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Base>;
export const IconoMas = (p) => <Base {...p}><path d="M12 5v14M5 12h14" /></Base>;
export const IconoFlecha = (p) => <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>;
export const IconoAjustes = (p) => <Base {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Base>;
