import { Menu, app, MenuItemConstructorOptions } from 'electron';

type ClickBehavior = 'right-only' | 'left-and-right' | 'left-only';

export class ContextMenuManager {
  private menubar: any;
  private contextMenu: Menu | null = null;
  private currentBehavior: ClickBehavior = 'right-only';
  private readonly quitCallback?: () => void;

  constructor(menubar: any, quitCallback?: () => void) {
    this.menubar = menubar;
    this.quitCallback = quitCallback;
  }

  initialize(clickBehavior: ClickBehavior = 'right-only'): void {
    this.menubar.on('ready', () => {
      this.createContextMenu();
      // Only set up context menu behavior if not using default right-only
      if (clickBehavior === 'right-only') {
        this.setupRightClickOnlyConservative();
      } else {
        this.setClickBehavior(clickBehavior);
      }
      console.log('Context menu initialized with behavior:', clickBehavior);
    });
  }

  private createContextMenu(customItems?: MenuItemConstructorOptions[]): void {
    const menuItems = this.buildMenuItems(customItems);
    this.contextMenu = Menu.buildFromTemplate(menuItems);
  }

  private buildMenuItems(
    customItems?: MenuItemConstructorOptions[]
  ): MenuItemConstructorOptions[] {
    const baseItems: MenuItemConstructorOptions[] = [
      {
        label: 'Show/Hide',
        click: () => this.toggleWindow(),
      },
      { type: 'separator' },
      {
        label: 'Reload',
        click: () => this.reloadWindow(),
      },
      {
        label: 'Toggle Developer Tools',
        click: () => this.toggleDevTools(),
      },
    ];

    if (customItems && customItems.length > 0) {
      baseItems.push({ type: 'separator' }, ...customItems);
    }

    baseItems.push(
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => this.handleQuit(),
      }
    );

    return baseItems;
  }

  private toggleWindow(): void {
    if (!this.menubar.window) return;

    if (this.menubar.window.isVisible()) {
      this.menubar.hideWindow();
    } else {
      this.menubar.showWindow();
    }
  }

  private reloadWindow(): void {
    if (this.menubar.window?.webContents) {
      this.menubar.window.reload();
    }
  }

  private toggleDevTools(): void {
    if (this.menubar.window?.webContents) {
      this.menubar.window.webContents.toggleDevTools();
    }
  }

  private handleQuit(): void {
    if (this.quitCallback) {
      this.quitCallback();
    } else {
      app.quit();
    }
  }

  private showContextMenu(): void {
    if (this.contextMenu && this.menubar.tray) {
      this.menubar.tray.popUpContextMenu(this.contextMenu);
    }
  }

  setClickBehavior(behavior: ClickBehavior): void {
    if (!this.menubar.tray) {
      console.warn('Tray not available, cannot set click behavior');
      return;
    }

    // For right-only, use the conservative approach
    if (behavior === 'right-only') {
      this.setupRightClickOnlyConservative();
      return;
    }

    // For other behaviors that need to override left-click
    this.clearTrayListeners();
    this.menubar.tray.removeAllListeners('click');
    this.currentBehavior = behavior;

    // Set up new behavior
    switch (behavior) {
      case 'left-and-right':
        this.setupBothClicks();
        break;
      case 'left-only':
        this.setupLeftClickOnly();
        break;
    }

    console.log(`Context menu behavior set to: ${behavior}`);
  }

  private clearTrayListeners(): void {
    if (this.menubar.tray) {
      // Only clear the listeners we specifically add, not the built-in ones
      this.menubar.tray.removeAllListeners('right-click');
      this.menubar.tray.removeAllListeners('double-click');
      this.menubar.tray.setContextMenu(null);
    }
  }

  private setupRightClickOnlyConservative(): void {
    // Ultra-conservative approach: NEVER touch any tray event listeners
    // Just add our right-click listener without clearing anything
    if (this.menubar.tray) {
      this.menubar.tray.on('right-click', () => this.showContextMenu());
      this.currentBehavior = 'right-only';
      console.log(
        'Right-click context menu listener added (conservative mode)'
      );
    }
  }

  private setupRightClickOnly(): void {
    // For right-only, we DON'T touch click listeners - let menubar handle left-click show/hide
    // We only add right-click and double-click for context menu
    this.menubar.tray.on('right-click', () => this.showContextMenu());
    this.menubar.tray.on('double-click', () => this.showContextMenu());
  }

  private setupBothClicks(): void {
    this.menubar.tray.setContextMenu(this.contextMenu);
    this.menubar.tray.on('click', () => this.showContextMenu());
  }

  private setupLeftClickOnly(): void {
    this.menubar.tray.on('click', () => this.showContextMenu());
  }

  updateContextMenu(customItems?: MenuItemConstructorOptions[]): void {
    this.createContextMenu(customItems);

    // Reapply current behavior if it uses setContextMenu
    if (this.currentBehavior === 'left-and-right') {
      this.menubar.tray?.setContextMenu(this.contextMenu);
    }

    console.log('Context menu updated');
  }

  getCurrentBehavior(): ClickBehavior {
    return this.currentBehavior;
  }

  // Cleanup method
  cleanup(): void {
    if (this.currentBehavior === 'right-only') {
      // Conservative cleanup - only remove our specific listeners
      if (this.menubar.tray) {
        this.menubar.tray.removeAllListeners('right-click');
      }
    } else {
      // Full cleanup for behaviors that override default handling
      this.clearTrayListeners();
    }
    this.contextMenu = null;
  }
}
