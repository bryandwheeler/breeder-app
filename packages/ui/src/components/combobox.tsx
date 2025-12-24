import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from './command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  // Filter options based on input
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;

    const searchTerm = inputValue.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm)
    );
  }, [options, inputValue]);

  // Find the selected option
  const selectedOption = options.find((option) => option.value === value);

  // Handle selection
  const handleSelect = (currentValue: string) => {
    // cmdk passes the value in lowercase, so we need to find the original
    const selected = options.find(
      (option) => option.value.toLowerCase() === currentValue.toLowerCase()
    );

    if (selected) {
      // If clicking the same value, deselect it, otherwise select it
      const newValue = value === selected.value ? '' : selected.value;
      onValueChange?.(newValue);
      setOpen(false);
      setInputValue('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onValueChange?.(option.value);
                  setOpen(false);
                  setInputValue('');
                }}
              >
                <CommandItem
                  value={option.value}
                  onSelect={handleSelect}
                  className="cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              </div>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
