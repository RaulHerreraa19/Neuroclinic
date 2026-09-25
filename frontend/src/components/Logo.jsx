// Isotipo de NeuroClinic: dos piezas de rompecabezas entrelazadas (terapia/conexión)
// sobre un círculo navy, recreando en SVG el badge de image.png con la paleta de marca.
export default function Logo({ className = 'w-9 h-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="NeuroClinic">
      <circle cx="32" cy="32" r="32" fill="#1B2A4A" />
      <circle cx="38" cy="26" r="5" fill="#34D399" />
      <rect x="14" y="14" width="24" height="24" rx="6" fill="#34D399" />
      <circle cx="26" cy="38" r="5" fill="#FF7A50" />
      <rect x="26" y="26" width="24" height="24" rx="6" fill="#FF7A50" />
    </svg>
  );
}
