import { globalShortcut } from 'electron';

export interface ShortcutCallbacks {
  toggleWindow: () => void;
  quit: () => void;
}

export class ShortcutManager {
  private shortcuts: Map<string, string> = new Map();

  constructor() {
    // Default shortcuts
    this.shortcuts.set('toggleWindow', 'CommandOrControl+Shift+Space');
    this.shortcuts.set('quit', 'CommandOrControl+Q');
  }

  registerShortcuts(callbacks: ShortcutCallbacks): void {
    // Register toggle window shortcut
    const toggleShortcut = this.shortcuts.get('toggleWindow');
    if (toggleShortcut) {
      globalShortcut.register(toggleShortcut, callbacks.toggleWindow);
    }

    // Register quit shortcut
    const quitShortcut = this.shortcuts.get('quit');
    if (quitShortcut) {
      globalShortcut.register(quitShortcut, callbacks.quit);
    }
  }

  unregisterShortcuts(): void {
    globalShortcut.unregisterAll();
  }

  getShortcuts(): Map<string, string> {
    return this.shortcuts;
  }

  updateShortcut(name: string, accelerator: string): void {
    // Unregister the old shortcut
    const oldShortcut = this.shortcuts.get(name);
    if (oldShortcut) {
      globalShortcut.unregister(oldShortcut);
    }
    
    // Update the shortcut
    this.shortcuts.set(name, accelerator);
  }

  updateShortcuts(shortcuts: { [key: string]: string }, callbacks: ShortcutCallbacks): void {
    // Unregister all current shortcuts
    this.unregisterShortcuts();
    
    // Update shortcuts map
    Object.entries(shortcuts).forEach(([name, accelerator]) => {
      this.shortcuts.set(name, accelerator);
    });
    
    // Re-register shortcuts with new values
    this.registerShortcuts(callbacks);
  }
} 