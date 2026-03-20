'use client';

import { Link2, Phone, FileText, Image, Video, File } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function PlantillaPreview({
  plantilla,
  variables = {},
  className = '',
  showTime = true,
  compact = false,
}) {
  if (!plantilla) {
    return (
      <div className={`bg-muted/50 rounded-xl p-8 text-center ${className}`}>
        <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Selecciona una plantilla para ver la vista previa</p>
      </div>
    );
  }

  const getContent = () => {
    let header = null;
    let body = '';
    let footer = '';
    let buttons = [];
    let headerType = 'TEXT';
    let urlImagen = plantilla.url_imagen || null;

    if (plantilla.components && !Array.isArray(plantilla.components)) {
      header = plantilla.components.header;
      body = plantilla.components.body || '';
      footer = plantilla.components.footer || '';
      buttons = plantilla.components.buttons || [];
      headerType = header?.type || 'TEXT';
    } else if (Array.isArray(plantilla.components)) {
      for (const comp of plantilla.components) {
        if (comp.type === 'HEADER') {
          header = { type: comp.format || 'TEXT', text: comp.text || '' };
          headerType = comp.format || 'TEXT';
        } else if (comp.type === 'BODY') {
          body = comp.text || '';
        } else if (comp.type === 'FOOTER') {
          footer = comp.text || '';
        } else if (comp.type === 'BUTTONS') {
          buttons = Array.isArray(comp.buttons) ? comp.buttons : [];
        }
      }
      if (plantilla.header_type_local) {
        headerType = plantilla.header_type_local;
        if (header) header.type = headerType;
      }
    } else {
      headerType = plantilla.header_type || 'TEXT';
      if (plantilla.header_text || ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType?.toUpperCase())) {
        header = { type: headerType, text: plantilla.header_text || '' };
      }
      body = plantilla.body || '';
      footer = plantilla.footer || '';
      if (Array.isArray(plantilla.buttons)) {
        buttons = plantilla.buttons;
      } else if (typeof plantilla.buttons === 'string') {
        try { buttons = JSON.parse(plantilla.buttons); } catch { buttons = []; }
      }
    }

    return { header, body, footer, buttons, headerType, urlImagen };
  };

  const { header, body, footer, buttons, headerType, urlImagen } = getContent();

  const replaceVariables = (text) => {
    if (!text) return '';
    let result = text;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, variables[key] || `[${key}]`);
    });
    result = result.replace(/\{\{(\d+)\}\}/g, (match, num) => `[Variable ${num}]`);
    return result;
  };

  const getMediaUrl = () => {
    if (!urlImagen) return null;
    if (urlImagen.startsWith('http')) return urlImagen;
    return `${API_BASE_URL}${urlImagen}`;
  };

  const mediaUrl = getMediaUrl();
  const isMediaHeader = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType?.toUpperCase());

  const renderHeader = () => {
    if (!header && !isMediaHeader) return null;
    const headerText = replaceVariables(header?.text);

    switch (headerType?.toUpperCase()) {
      case 'IMAGE':
        return mediaUrl ? (
          <img
            src={mediaUrl}
            alt="Header"
            className="w-full h-32 object-cover rounded-t-lg mb-2"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 rounded-t-lg mb-2 flex items-center justify-center">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
        );
      case 'VIDEO':
        return mediaUrl ? (
          <video src={mediaUrl} className="w-full h-32 object-cover rounded-t-lg mb-2" controls />
        ) : (
          <div className="w-full h-32 bg-gray-200 rounded-t-lg mb-2 flex items-center justify-center">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
        );
      case 'DOCUMENT':
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded mb-2">
            <File className="w-8 h-8 text-red-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{plantilla.name || 'Documento'}.pdf</p>
              <p className="text-xs text-gray-500">PDF</p>
            </div>
          </div>
        );
      case 'TEXT':
      default:
        return headerText ? (
          <p className="text-[15px] font-semibold text-gray-900 mb-1.5">{headerText}</p>
        ) : null;
    }
  };

  const renderButtons = () => {
    if (!buttons || buttons.length === 0) return null;
    return (
      <div className="mt-3 pt-2 border-t border-[#c5e8b0] space-y-1.5">
        {buttons.map((btn, idx) => (
          <div key={idx} className="w-full py-2 text-[14px] text-[#00a884] font-medium text-center flex items-center justify-center gap-1">
            {btn.type === 'URL' && <Link2 className="w-4 h-4" />}
            {btn.type === 'PHONE_NUMBER' && <Phone className="w-4 h-4" />}
            <span>{btn.text}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTimestamp = () => {
    if (!showTime) return null;
    return (
      <div className="flex items-center justify-end gap-1 mt-1">
        <span className="text-[11px] text-gray-500">
          {new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <svg className="w-4 h-4 text-[#53bdeb]" viewBox="0 0 16 11" fill="currentColor">
          <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.146l-.311.31a.445.445 0 0 0-.14.337c0 .136.047.25.14.343l2.996 2.996a.724.724 0 0 0 .501.203.697.697 0 0 0 .546-.266l6.646-8.417a.497.497 0 0 0 .108-.299.441.441 0 0 0-.19-.374l-.337-.273zm2.992 0a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.066-1.009-.566.718 1.352 1.352a.724.724 0 0 0 .501.203.697.697 0 0 0 .546-.266l6.646-8.417a.497.497 0 0 0 .108-.299.441.441 0 0 0-.19-.374l-.337-.273z" />
        </svg>
      </div>
    );
  };

  if (compact) {
    return (
      <div className={`bg-[#DCF8C6] rounded-lg p-3 shadow-sm ${className}`}>
        {renderHeader()}
        <p className="text-[14px] text-gray-800 whitespace-pre-line leading-relaxed">{replaceVariables(body)}</p>
        {footer && <p className="text-[12px] text-gray-500 mt-2">{replaceVariables(footer)}</p>}
        {renderButtons()}
        {renderTimestamp()}
      </div>
    );
  }

  return (
    <div className={`bg-[#E5DDD5] rounded-xl p-4 ${className}`}>
      <div className="flex justify-end">
        <div className="relative max-w-[90%]">
          <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-3 shadow-sm">
            {renderHeader()}
            <p className="text-[14px] text-gray-800 whitespace-pre-line leading-relaxed">{replaceVariables(body)}</p>
            {footer && <p className="text-[12px] text-gray-500 mt-2">{replaceVariables(footer)}</p>}
            {renderButtons()}
            {renderTimestamp()}
          </div>
        </div>
      </div>
    </div>
  );
}
