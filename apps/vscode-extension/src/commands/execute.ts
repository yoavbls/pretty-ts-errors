import { window } from "vscode";
import { logger } from "../logger";

/**
 * A wrapper function to execute command tasks while providing user feedback and logging on errors.
 */
export async function execute(
  commandName: string,
  task: (...args: unknown[]) => unknown | Promise<unknown>
) {
  try {
    return await task();
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error);
    } else if (typeof error === "string") {
      logger.error(error);
    } else {
      logger.error("caught non-string or error value: ", error);
    }
    window.showErrorMessage(`Failed to execute command: '${commandName}'`);
    throw error;
  }
}
