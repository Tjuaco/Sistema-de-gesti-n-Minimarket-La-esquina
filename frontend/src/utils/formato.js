/**
 * Formatea un valor numérico como pesos chilenos (CLP)
 * @param {number} valor - El valor a formatear
 * @returns {string} - El valor formateado como "$1.000 CLP"
 */
export const formatearPesosChilenos = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '$0 CLP';
  }

  // Convertir a número si es string
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor;

  // Formatear con separador de miles (punto) y decimales (coma)
  // Redondear a 0 decimales ya que los pesos chilenos no usan centavos comúnmente
  const formateado = Math.round(numero)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `$${formateado} CLP`;
};

