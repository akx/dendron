import _ from "lodash";
import * as vscode from "vscode";
import { GLOBAL_STATE } from "./constants";
import { Logger } from "./logger";
import { Settings } from "./settings";
import { VSCodeUtils } from "./utils";
import { DendronWorkspace } from "./workspace";


// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const ctx = "activate";
  const { logPath, extensionPath, extensionUri, storagePath, globalStoragePath } = context;

  // setup logging
  const previousVersion = context.globalState.get<string | undefined>(GLOBAL_STATE.VERSION);
  Logger.configure(context, "debug");
  Logger.info({ ctx, logPath, extensionPath, extensionUri, storagePath, globalStoragePath });
  // needs to be initialized to setup commands
  const ws = new DendronWorkspace(context);

  if (DendronWorkspace.isActive()) {
    Logger.info({msg: "reloadWorkspace:pre"});
    ws.reloadWorkspace().then(async () => {
      Logger.info({ ctx, msg: "dendron ready" }, true);
      if (_.isUndefined(context.globalState.get<string | undefined>(GLOBAL_STATE.DENDRON_FIRST_WS))) {
        Logger.info({ ctx, msg: "show welcome" });
        const step = ws.context.globalState.get<string|undefined>(GLOBAL_STATE.DENDRON_FIRST_WS_TUTORIAL_STEP);
        if (_.isUndefined(step)) {
          await ws.showWelcome();
          Logger.info({ ctx, step: -1 }, true);
          await ws.updateGlobalState('DENDRON_FIRST_WS', 'initialized');
          await ws.updateGlobalState('DENDRON_FIRST_WS_TUTORIAL_STEP', '0');
        } else {
          switch (step) {
            case "0":
              Logger.info({msg: "going to step", step}, true);
              break;
            default:
              Logger.info({msg: "", step});
          }
        }
      } else {
        Logger.info({ctx, msg: "user finished welcome"});
      }
    });
  } else {
    Logger.info({ ctx: "dendron not active" });
  }
  if (VSCodeUtils.isDebuggingExtension()) {
    Logger.output?.show(false);
    // TODO: check for cmd
    // const fullLogPath = FileUtils.escape(path.join(logPath, 'dendron.log'));
    // TODO
    // const cmd = `/usr/local/bin/code-insiders ${fullLogPath}`;
    // execa.command(cmd);
    // vscode.window.showInformationMessage(`logs at ${fullLogPath}`);
  }
  // TODO: don't hardcode version
 showWelcomeOrWhatsNew(ws.version, previousVersion);
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ctx = "deactivate";
  const { DendronWorkspace } = require("./workspace");
  const ws = DendronWorkspace.instance()
  ws.L.info({ ctx });
}


async function showWelcomeOrWhatsNew(version: string, previousVersion: string | undefined) {
  const ctx = "showWelcomeOrWhatsNew";
  Logger.info({ ctx, version, previousVersion });
  const ws = DendronWorkspace.instance();
  if (_.isUndefined(previousVersion)) {
    Logger.info({ ctx, msg: "first time install" });
    // NOTE: this needs to be from extension because no workspace might exist at this point
    const uri = vscode.Uri.joinPath(ws.context.extensionUri, "README.md");
    await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
    await ws.showWelcome(uri);
  } else {
    Logger.info({ ctx, msg: "not first time install" });
    if (version !== previousVersion) {
      Logger.info({ ctx, msg: "new version", version, previousVersion });
      const changed = await Settings.upgrade(ws.configWS as vscode.WorkspaceConfiguration, Settings.defaultsChangeSet());
      Logger.info({ ctx, msg: "settings upgraded", changed });
      await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
    }
  }
}
