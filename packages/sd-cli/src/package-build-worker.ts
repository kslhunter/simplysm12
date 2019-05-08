import {ISdWorkerMessage} from "./commons";
import {SdPackageChecker} from "./SdPackageChecker";
import {SdPackageLinter} from "./SdPackageLinter";
import {SdPackageBuilder} from "./SdPackageBuilder";

const type = process.argv[2] as "build" | "check" | "lint";
const packageKey = process.argv[3];
const isWatch = process.argv[4] === "watch";
const options = process.argv[5];

const sendMessage = (message: ISdWorkerMessage) => {
  process.send!(message, (err: Error) => {
    if (err) throw err;
  });
};

const packageBuilderClass =
  type === "build" ? SdPackageBuilder :
    type === "check" ? SdPackageChecker :
      SdPackageLinter;

const builder = new packageBuilderClass(
  packageKey,
  options ? options.split(",").map(item => item.trim()) : undefined
);
builder
  .on("run", () => {
    sendMessage({type: "run"});
  })
  .on("done", () => {
    sendMessage({type: "done"});
  })
  .on("log", () => (message: string) => {
    sendMessage({type: "log", message});
  })
  .on("info", (message: string) => {
    sendMessage({type: "info", message});
  })
  .on("warning", (message: string) => {
    sendMessage({type: "warning", message});
  })
  .on("error", (message: string) => {
    sendMessage({type: "error", message});
  });

if (isWatch) {
  builder.watchAsync().catch(err => {
    sendMessage({type: "error", message: err.stack});
  });
}
else {
  builder.runAsync().catch(err => {
    sendMessage({type: "error", message: err.stack});
  });
}