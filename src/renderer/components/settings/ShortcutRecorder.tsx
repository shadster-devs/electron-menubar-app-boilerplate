import { X } from 'lucide-react';
import React, { useState, useRef } from 'react';
import './ShortcutRecorder.css';

interface ShortcutRecorderProps {
  value: string;
  onChange: (shortcut: string) => void;
  placeholder?: string;
}

const ShortcutRecorder: React.FC<ShortcutRecorderProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatShortcut = (keys: string[]): string => {
    if (keys.length === 0) return '';

    const modifiers: string[] = [];
    const regularKeys: string[] = [];

    keys.forEach(key => {
      if (key === 'Meta' || key === 'cmd') {
        modifiers.push('CommandOrControl');
      } else if (key === 'Control' || key === 'ctrl') {
        modifiers.push('CommandOrControl');
      } else if (key === 'Alt' || key === 'alt') {
        modifiers.push('Alt');
      } else if (key === 'Shift' || key === 'shift') {
        modifiers.push('Shift');
      } else if (key.length === 1) {
        regularKeys.push(key.toUpperCase());
      } else if (key === ' ') {
        regularKeys.push('Space');
      } else if (key === 'Enter') {
        regularKeys.push('Return');
      } else if (key === 'Escape') {
        regularKeys.push('Escape');
      } else if (key === 'Tab') {
        regularKeys.push('Tab');
      } else if (key === 'Backspace') {
        regularKeys.push('Backspace');
      } else if (key === 'Delete') {
        regularKeys.push('Delete');
      } else if (key.startsWith('Arrow')) {
        regularKeys.push(key.replace('Arrow', ''));
      } else if (key.startsWith('F') && key.length <= 3) {
        regularKeys.push(key);
      } else {
        regularKeys.push(key);
      }
    });

    // Remove duplicates
    const uniqueModifiers = [...new Set(modifiers)];
    const uniqueKeys = [...new Set(regularKeys)];

    return [...uniqueModifiers, ...uniqueKeys].join('+');
  };

  const displayShortcut = (shortcut: string): string => {
    if (!shortcut) return '';

    // Detect platform using navigator.platform (available in renderer)
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return shortcut
      .replace(/CommandOrControl/g, isMac ? '⌘' : 'Ctrl')
      .replace(/Alt/g, isMac ? '⌥' : 'Alt')
      .replace(/Shift/g, isMac ? '⇧' : 'Shift')
      .replace(/Space/g, '␣')
      .replace(/Return/g, '↩')
      .replace(/Escape/g, '⎋')
      .replace(/Tab/g, '⇥')
      .replace(/Backspace/g, '⌫')
      .replace(/Delete/g, '⌦')
      .replace(/Up/g, '↑')
      .replace(/Down/g, '↓')
      .replace(/Left/g, '←')
      .replace(/Right/g, '→');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    const keys: string[] = [];

    if (e.metaKey) keys.push('Meta');
    if (e.ctrlKey) keys.push('Control');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');

    // Add the main key if it's not a modifier
    if (!['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
      keys.push(e.key);
    }

    setRecordedKeys(keys);
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    if (recordedKeys.length > 0) {
      const shortcut = formatShortcut(recordedKeys);
      onChange(shortcut);
      setIsRecording(false);
      setRecordedKeys([]);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleFocus = () => {
    setIsRecording(true);
    setRecordedKeys([]);
  };

  const handleBlur = () => {
    setIsRecording(false);
    setRecordedKeys([]);
  };

  const handleClear = () => {
    onChange('');
    setIsRecording(false);
    setRecordedKeys([]);
  };

  const displayValue = isRecording
    ? recordedKeys.length > 0
      ? displayShortcut(formatShortcut(recordedKeys))
      : 'Press keys...'
    : displayShortcut(value);

  return (
    <div className='shortcut-recorder'>
      <div className='shortcut-input-container'>
        <input
          ref={inputRef}
          type='text'
          value={displayValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder={placeholder || 'Click to record shortcut...'}
          className={`shortcut-input ${isRecording ? 'recording' : ''}`}
          readOnly
        />
        {value && (
          <button
            type='button'
            onClick={handleClear}
            className='shortcut-clear'
            title='Clear shortcut'
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className='shortcut-hint'>
        {isRecording
          ? 'Press your key combination...'
          : 'Click to record a new shortcut'}
      </div>
    </div>
  );
};

export default ShortcutRecorder;
