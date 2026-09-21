const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-lg',
};

// Avatar con foto real cuando hay `src`; si no, cae a iniciales con degradado indigo→emerald
// (el comportamiento original, usado en catálogos sin foto de perfil).
export default function Avatar({ nombre = '', apellido = '', size = 'md', src }) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${nombre} ${apellido}`.trim()}
        className={`flex-shrink-0 rounded-full object-cover ${SIZES[size]}`}
      />
    );
  }

  const initials = `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase() || '?';
  return (
    <span
      className={`flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-white font-semibold flex items-center justify-center ${SIZES[size]}`}
    >
      {initials}
    </span>
  );
}
