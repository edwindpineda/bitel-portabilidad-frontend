import { format, formatDistance, formatRelative, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha en formato DD/MM/YYYY
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export function formatDate(date) {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
}

/**
 * Formatea una fecha y hora en formato DD/MM/YYYY HH:mm
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha y hora formateadas
 */
export function formatDateTime(date) {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
}

/**
 * Formatea una hora en formato HH:mm
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Hora formateada
 */
export function formatTime(date) {
  if (!date) return '-';
  return format(new Date(date), 'HH:mm', { locale: es });
}

/**
 * Formatea una fecha de forma relativa (hace 2 horas, ayer, etc.)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha relativa
 */
export function formatRelativeDate(date) {
  if (!date) return '-';
  const dateObj = new Date(date);

  if (isToday(dateObj)) {
    return `Hoy a las ${format(dateObj, 'HH:mm')}`;
  }

  if (isYesterday(dateObj)) {
    return `Ayer a las ${format(dateObj, 'HH:mm')}`;
  }

  return formatRelative(dateObj, new Date(), { locale: es });
}

/**
 * Formatea una fecha como distancia temporal (hace 2 horas)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Distancia temporal
 */
export function formatDistanceToNow(date) {
  if (!date) return '-';
  return formatDistance(new Date(date), new Date(), {
    addSuffix: true,
    locale: es
  });
}

/**
 * Formatea un número como moneda peruana
 * @param {number} amount - Cantidad
 * @returns {string} - Cantidad formateada
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un número con separadores de miles
 * @param {number} num - Número
 * @returns {string} - Número formateado
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('es-PE').format(num);
}

/**
 * Formatea un porcentaje
 * @param {number} value - Valor decimal (0.15 = 15%)
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} - Porcentaje formateado
 */
export function formatPercentage(value, decimals = 0) {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formatea un número de teléfono peruano
 * @param {string} phone - Número de teléfono
 * @returns {string} - Teléfono formateado
 */
export function formatPhone(phone) {
  if (!phone) return '-';
  // Formato: 999 999 999
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return phone;
}

/**
 * Formatea bytes a tamaño legible
 * @param {number} bytes - Bytes
 * @param {number} decimals - Decimales
 * @returns {string} - Tamaño formateado
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Trunca un texto y agrega ...
 * @param {string} text - Texto
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitaliza la primera letra
 * @param {string} str - String
 * @returns {string} - String capitalizado
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formatea un nombre completo
 * @param {string} firstName - Nombre
 * @param {string} lastName - Apellido
 * @returns {string} - Nombre completo formateado
 */
export function formatFullName(firstName, lastName) {
  if (!firstName && !lastName) return '-';
  return `${firstName || ''} ${lastName || ''}`.trim();
}
