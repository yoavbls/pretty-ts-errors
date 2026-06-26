import * as path from "path";
import Mocha from "mocha";
import { glob } from "glob";

export function run(
  testsRoot: string,
  cb: (error: unknown | null, failures?: number) => void
): void {
  const resolvedTestsRoot = testsRoot.endsWith(".js")
    ? path.dirname(testsRoot)
    : testsRoot;

  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  glob("**/*.test.js", { cwd: resolvedTestsRoot })
    .then((files) => {
      if (files.length === 0) {
        throw new Error(
          `No compiled extension test files were found in ${resolvedTestsRoot}.`
        );
      }

      console.log(
        `Discovered ${files.length} extension test file(s) in ${resolvedTestsRoot}: ${files.join(", ")}`
      );

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(resolvedTestsRoot, f)));

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
