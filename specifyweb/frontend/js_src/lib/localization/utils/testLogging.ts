import chalk from 'chalk';

const log = console.log;

let todosCount = 0;

function todo(value: string): void {
  todosCount += 1;
  console.warn(chalk.green(value));
}

let warningsCount = 0;

function warn(value: string): void {
  warningsCount += 1;
  // Orange
  console.warn(chalk.yellow(value));
}

let errorsCount = 0;

function error(value: string): void {
  errorsCount += 1;
  process.exitCode = 1;
  console.error(chalk.red(value));
}

export const testLogging = {
  log,
  todosCount,
  warningsCount,
  todo,
  warn,
  error,
  errorsCount,
};
