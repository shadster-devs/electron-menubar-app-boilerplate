import { Menu, app } from 'electron';

export class ContextMenuManager {
  private menubar: any;
  private contextMenu: any;
  private quitCallback?: () => void;

  constructor(menubar: any, quitCallback?: () => void) {
    this.menubar = menubar;
    this.quitCallback = quitCallback;
  }

  private getDefaultMenuItems() {
    return [
      {
        label: 'Show/Hide',
        click: () => {
          // Check if window exists before accessing it
          if (this.menubar.window && this.menubar.window.isVisible()) {
            this.menubar.hideWindow();
          } else {
            this.menubar.showWindow();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Reload',
        click: () => {
          // Check if window exists before accessing it
          if (this.menubar.window && this.menubar.window.webContents) {
            this.menubar.window.reload();
          }
        }
      },
      {
        label: 'Toggle Developer Tools',
        click: () => {
          // Check if window and webContents exist before accessing them
          if (this.menubar.window && this.menubar.window.webContents) {
            this.menubar.window.webContents.toggleDevTools();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          if (this.quitCallback) {
            this.quitCallback();
          } else {
            app.quit();
          }
        }
      }
    ];
  }

  setupTrayContextMenu(clickBehavior: 'right-only' | 'left-and-right' | 'left-only' = 'right-only'): void {
    // Wait for the tray to be ready
    this.menubar.on('ready', () => {
      this.contextMenu = Menu.buildFromTemplate(this.getDefaultMenuItems() as any);

      if (this.menubar.tray) {
                // Set up click behavior based on preference
        this.setupClickBehavior(clickBehavior);
      }
    });
  }

  private setupClickBehavior(behavior: 'right-only' | 'left-and-right' | 'left-only'): void {
    if (!this.menubar.tray) return;

    switch (behavior) {
      case 'right-only':
        // DO NOT set context menu - this prevents it from showing on left-click
        this.menubar.tray.setContextMenu(null);
        
        // Listen for RIGHT-CLICK and DOUBLE-CLICK to show menu manually
        this.menubar.tray.on('right-click', () => {
          console.log('Right-click detected! Showing context menu! 🖱️');
          this.showContextMenuAtCursor();
        });
        
        this.menubar.tray.on('double-click', () => {
          console.log('Double-click detected! Showing context menu! 🖱️');
          this.showContextMenuAtCursor();
        });
        
        console.log('Context menu configured for RIGHT-CLICK and DOUBLE-CLICK! Left-click shows/hides app! 🖱️');
        break;

      case 'left-and-right':
        // Context menu on both left and right click
        this.menubar.tray.setContextMenu(this.contextMenu);
        this.menubar.tray.on('click', () => {
          this.showContextMenuAtCursor();
        });
        break;

      case 'left-only':
        // Context menu on left-click only, disable default right-click
        this.menubar.tray.setContextMenu(null);
        this.menubar.tray.on('click', () => {
          this.showContextMenuAtCursor();
        });
        break;
    }
  }

  private showContextMenuAtCursor(): void {
    if (this.contextMenu && this.menubar.tray) {
      this.menubar.tray.popUpContextMenu(this.contextMenu);
    }
  }

  updateContextMenu(customItems?: any[]): void {
    if (customItems) {
      // Get base items without the quit item
      const baseItems = this.getDefaultMenuItems().slice(0, -2); // Remove separator and quit
      const menuItems = [...baseItems, { type: 'separator' }, ...customItems, { type: 'separator' }, {
        label: 'Quit',
        click: () => {
          if (this.quitCallback) {
            this.quitCallback();
          } else {
            app.quit();
          }
        }
      }];
      this.contextMenu = Menu.buildFromTemplate(menuItems as any);
    } else {
      this.contextMenu = Menu.buildFromTemplate(this.getDefaultMenuItems() as any);
    }
    
    // Don't automatically set context menu - let the behavior control how it's shown
    console.log('Context menu updated - right-click behavior preserved');
  }

  // Method to change click behavior after initialization
  setClickBehavior(behavior: 'right-only' | 'left-and-right' | 'left-only'): void {
    if (this.menubar.tray) {
      // Remove existing click listeners
      this.menubar.tray.removeAllListeners('click');
      this.menubar.tray.removeAllListeners('right-click');
      this.menubar.tray.removeAllListeners('double-click');
      this.setupClickBehavior(behavior);
    }
  }
} 