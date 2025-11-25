import fs from 'fs';

function directoryPlugin() {
  return {
    name: 'directory-plugin',
    executeCommand({ command, payload }) {
      switch (command) {
        case 'read-dir':
          return fs.readdirSync(payload.path);
        case 'make-dir':
          if (!fs.existsSync(payload.path)) {
            fs.mkdirSync(payload.path);
          }
          return true;
        default:
          return undefined;
      }
    },
  };
}

export default {
  nodeResolve: true,
  plugins: [directoryPlugin()],
};
