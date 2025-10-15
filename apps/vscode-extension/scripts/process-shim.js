// https://esbuild.github.io/api/#inject

let _cwd = "/";

export let process = {
  cwd: () => _cwd,
  chdir: (newCwd) => (_cwd = newCwd),
  env: {},
};
