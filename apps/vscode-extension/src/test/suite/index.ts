import * as path from "path";
import Mocha from "mocha";
import { glob } from "glob";

export function run(
  testsRoot: string,
  cb: (error: unknown | null, failures?: number) => void
): void {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  glob("**/**.test.js", { cwd: testsRoot })
    .then((files) => {
      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          cb(null, failures);
        });
      } catch (err) {
        console.error(err);
        cb(err);
      }
    })
    .catch((err) => {
      return cb(err);
    });
}
