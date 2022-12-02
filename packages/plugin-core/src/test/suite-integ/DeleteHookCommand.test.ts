import { ConfigService, ConfigUtils, URI } from "@dendronhq/common-all";
import { HookUtils } from "@dendronhq/engine-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import { describe } from "mocha";
import path from "path";
import { CreateHookCommand } from "../../commands/CreateHookCommand";
import { DeleteHookCommand } from "../../commands/DeleteHookCommand";
import { DENDRON_COMMANDS } from "../../constants";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite(DENDRON_COMMANDS.DELETE_HOOK.key, function () {
  const ctx = setupBeforeAfter(this);
  describe("main", () => {
    // TODO: fix test (ConfigService)
    test.skip("basic", (done) => {
      const hookName = "foo";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
        onInit: async ({ wsRoot }) => {
          await new CreateHookCommand().execute({ hookFilter: "*", hookName });
          await new DeleteHookCommand().execute({
            hookName,
            shouldDeleteScript: true,
          });
          const config = (
            await ConfigService.instance().readConfig(URI.file(wsRoot))
          )._unsafeUnwrap();
          const hooks = ConfigUtils.getHooks(config);
          expect(hooks).toEqual({
            onCreate: [],
          });

          expect(
            fs.existsSync(
              path.join(
                HookUtils.getHookScriptPath({
                  basename: `${hookName}.js`,
                  wsRoot,
                })
              )
            )
          ).toBeFalsy();
          done();
        },
      });
    });

    // TODO: fix test (ConfigService)
    test.skip("no delete", (done) => {
      const hookName = "foo";

      runLegacyMultiWorkspaceTest({
        ctx,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
        onInit: async ({ wsRoot }) => {
          await new CreateHookCommand().execute({ hookFilter: "*", hookName });
          await new DeleteHookCommand().execute({
            hookName,
            shouldDeleteScript: false,
          });
          const config = (
            await ConfigService.instance().readConfig(URI.file(wsRoot))
          )._unsafeUnwrap();
          const hooks = ConfigUtils.getHooks(config);
          expect(hooks).toEqual({
            onCreate: [],
          });

          expect(
            fs.existsSync(
              path.join(
                HookUtils.getHookScriptPath({
                  basename: `${hookName}.js`,
                  wsRoot,
                })
              )
            )
          ).toBeTruthy();
          done();
        },
      });
    });
  });
});
