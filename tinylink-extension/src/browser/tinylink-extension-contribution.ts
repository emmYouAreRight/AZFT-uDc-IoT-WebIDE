import { injectable, inject } from "inversify";
import {
  CommandContribution,
  CommandRegistry,
  MenuContribution,
  MenuModelRegistry
} from "@theia/core/lib/common";
import { MAIN_MENU_BAR } from "@theia/core/lib/common/menu";
import {
  KeybindingContribution,
  KeybindingRegistry
} from "@theia/core/lib/browser/keybinding";
import { Command } from "@theia/core/lib/common/command";
import { AboutDialog } from "./about-dialog";

export namespace IoTMenus {
  export const IOT = [...MAIN_MENU_BAR, "1_iot"];
  export const IOT_FUNCTION = [...IOT, "2_function"];
  export const IOT_ABOUT = [...IOT, "3_about"];
}

export namespace IoTCommands {
  const IOT_MENU_CATEGORY = "IoT Menu";

  export const TINYLINK: Command = {
    id: "iot.menu.tinylink",
    category: IOT_MENU_CATEGORY,
    label: "TinyLink"
  };

  export const TINYSIM: Command = {
    id: "iot.menu.tinysim",
    category: IOT_MENU_CATEGORY,
    label: "TinySim"
  };

  export const ONELINK: Command = {
    id: "iot.menu.onelink",
    category: IOT_MENU_CATEGORY,
    label: "OneLink"
  };

  export const ABOUT: Command = {
    id: "iot.menu.about",
    category: IOT_MENU_CATEGORY,
    label: "About"
  };
}

@injectable()
export class TinyLinkExtensionMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerSubmenu(IoTMenus.IOT, "IoT");

    menus.registerMenuAction(IoTMenus.IOT_FUNCTION, {
      commandId: IoTCommands.TINYLINK.id,
      order: "0"
    });

    menus.registerMenuAction(IoTMenus.IOT_FUNCTION, {
      commandId: IoTCommands.TINYSIM.id,
      order: "1"
    });

    menus.registerMenuAction(IoTMenus.IOT_FUNCTION, {
      commandId: IoTCommands.ONELINK.id,
      order: "2"
    });

    menus.registerMenuAction(IoTMenus.IOT_ABOUT, {
      commandId: IoTCommands.ABOUT.id
    });
  }
}

@injectable()
export class TinyLinkExtensionCommandContribution
  implements CommandContribution {
  constructor(@inject(AboutDialog) private readonly aboutDialog: AboutDialog) {}

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(IoTCommands.TINYLINK, {
      execute: () => {
        registry.executeCommand("iot.plugin.tinylink.compile");
      }
    });

    registry.registerCommand(IoTCommands.TINYSIM, {
      execute: () => {
        registry.executeCommand("iot.plugin.tinysim.compile");
      }
    });

    registry.registerCommand(IoTCommands.ONELINK, {
      execute: () => {
        registry.executeCommand("iot.plugin.onelink.compile");
      }
    });

    registry.registerCommand(IoTCommands.ABOUT, {
      execute: () => {
        this.aboutDialog.open();
      }
    });
  }
}

@injectable()
export class TinyLinkExtensionKeyBindingContribution
  implements KeybindingContribution {
  registerKeybindings(registry: KeybindingRegistry): void {
    // registry.registerKeybinding({
    //     command:IoTCommands.ABOUT.id,
    //     keybinding:'f5'
    // })
  }
}
