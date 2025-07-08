import { globalShortcut } from 'electron';
import { DEFAULT_SETTINGS } from '../shared/constants';

export interface ShortcutCallbacks {
  toggleWindow: () => void;
  quit: () => void;
}

type ShortcutName = keyof ShortcutCallbacks;
type ShortcutConfig = Record<ShortcutName, string>;

export class ShortcutManager {
  private shortcuts: ShortcutConfig;
  private isRegistered = false;

  constructor() {
    this.shortcuts = {
      toggleWindow: DEFAULT_SETTINGS.shortcuts.toggleWindow,
      quit: DEFAULT_SETTINGS.shortcuts.quit
    };
  }

  registerShortcuts(callbacks: ShortcutCallbacks): boolean {
    try {
      // Unregister any existing shortcuts first
      this.unregisterShortcuts();

      // Register each shortcut
      Object.entries(this.shortcuts).forEach(([name, accelerator]) => {
        const callback = callbacks[name as ShortcutName];
        if (callback && accelerator) {
          const success = globalShortcut.register(accelerator, callback);
          if (!success) {
            console.warn(`Failed to register shortcut: ${name} (${accelerator})`);
          }
        }
      });

      this.isRegistered = true;
      console.log('Shortcuts registered:', this.shortcuts);
      return true;
    } catch (error) {
      console.error('Error registering shortcuts:', error);
      return false;
    }
  }

  unregisterShortcuts(): void {
    try {
      globalShortcut.unregisterAll();
      this.isRegistered = false;
      console.log('All shortcuts unregistered');
    } catch (error) {
      console.error('Error unregistering shortcuts:', error);
    }
  }

  getShortcuts(): ShortcutConfig {
    return { ...this.shortcuts };
  }

  updateShortcut(name: ShortcutName, accelerator: string, callbacks?: ShortcutCallbacks): boolean {
    try {
      // Unregister the old shortcut if it exists
      const oldAccelerator = this.shortcuts[name];
      if (oldAccelerator) {
        globalShortcut.unregister(oldAccelerator);
      }

      // Update the shortcut
      this.shortcuts[name] = accelerator;

      // Re-register the new shortcut if callbacks are provided
      if (callbacks && accelerator) {
        const callback = callbacks[name];
        if (callback) {
          const success = globalShortcut.register(accelerator, callback);
          if (!success) {
            console.warn(`Failed to register updated shortcut: ${name} (${accelerator})`);
            return false;
          }
        }
      }

      console.log(`Shortcut updated: ${name} -> ${accelerator}`);
      return true;
    } catch (error) {
      console.error(`Error updating shortcut ${name}:`, error);
      return false;
    }
  }

  updateAllShortcuts(shortcuts: Partial<ShortcutConfig>, callbacks: ShortcutCallbacks): boolean {
    try {
      // Update shortcuts object
      this.shortcuts = { ...this.shortcuts, ...shortcuts };

      // Re-register all shortcuts if currently registered
      if (this.isRegistered) {
        return this.registerShortcuts(callbacks);
      }

      return true;
    } catch (error) {
      console.error('Error updating shortcuts:', error);
      return false;
    }
  }

  isShortcutRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  getRegistrationStatus(): boolean {
    return this.isRegistered;
  }

  // Cleanup method for when the app is closing
  cleanup(): void {
    this.unregisterShortcuts();
  }
} 