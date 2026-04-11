'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function Autocomplete({
  options = [],
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
  emptyMessage = 'No se encontraron resultados',
  className,
}) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef(null);

  // Sincronizar inputValue con el valor seleccionado
  React.useEffect(() => {
    if (value) {
      const selectedOption = options.find((opt) => String(opt.id) === String(value));
      setInputValue(selectedOption?.nombre || '');
    } else {
      setInputValue('');
    }
  }, [value, options]);

  // Filtrar opciones basado en el texto escrito
  const filteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return options;
    return options.filter((opt) =>
      opt.nombre.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  const handleSelect = (option) => {
    onChange(String(option.id));
    setInputValue(option.nombre);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!open) setOpen(true);
    // Si borra el texto, limpiar selección
    if (!e.target.value) {
      onChange('');
    }
  };

  const handleInputFocus = () => {
    if (options.length > 0) {
      setOpen(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div className={cn('relative', className)}>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-16"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {value && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClear}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={disabled}
              onClick={() => setOpen(!open)}
            >
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground',
                    String(option.id) === String(value) && 'bg-accent'
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      'h-4 w-4',
                      String(option.id) === String(value) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
