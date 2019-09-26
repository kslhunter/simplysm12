import * as chokidar from "chokidar";
import {Logger} from "./Logger";
import * as path from "path";
import {Wait} from "./Wait";
import * as fs from "fs-extra";

export class FileWatcher {
  public static async watch(paths: string | string[], sits: FileChangeInfoType[], callback: (changedFiles: IFileChangeInfo[]) => (void | Promise<void>), options: { millisecond?: number; ignoreInitial?: boolean }): Promise<chokidar.FSWatcher> {
    return await new Promise<chokidar.FSWatcher>((resolve, reject) => {
      const watcher = chokidar.watch((typeof paths === "string" ? [paths] : paths).map(item => item.replace(/\\/g, "/")).distinct(), {
        ignoreInitial: options.ignoreInitial
      })
        .on("ready", () => {
          let preservedFileChanges: IFileChangeInfo[] = [];
          let timeout: NodeJS.Timer;

          let processing = false;

          const onWatched = async (type: "add" | "change" | "unlink", filePath: string) => {
            preservedFileChanges.push({type, filePath: path.normalize(filePath)});
            await Wait.true(() => !processing);

            clearTimeout(timeout);
            timeout = setTimeout(
              async () => {
                processing = true;

                const fileChanges = Object.clone(preservedFileChanges);
                preservedFileChanges = [];

                try {
                  await callback(fileChanges);
                }
                catch (err) {
                  new Logger("@simplysm/sd-core", "FileWatcher").error(err.stack);
                }

                processing = false;
              },
              options.millisecond || 100
            );
          };

          watcher.on("raw", async (event, fileName, details) => {
            if ((sits as string[]).includes(event)) {
              const filePath = fs.statSync(details.watchedPath).isDirectory() ? path.resolve(details.watchedPath, fileName) : details.watchedPath;
              /*console.log(event, filePath);*/
              await onWatched(event as FileChangeInfoType, filePath);
            }
          });

          resolve(watcher);
        })
        .on("error", err => {
          reject(err);
        });
    });
  }
}

export type FileChangeInfoType = "add" | "change" | "unlink";

export interface IFileChangeInfo {
  type: FileChangeInfoType;
  filePath: string;
}