/**
 * Shared product thumbnail component.
 * Shows the product image if available, otherwise a styled initial letter.
 */
export default function ProductThumb({ src, name, size = 32, className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover bg-gray-100 flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}
