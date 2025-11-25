/* eslint-disable no-unused-expressions */
/* global describe it before */
// eslint-disable-next-line import/no-extraneous-dependencies
import { executeServerCommand } from '@web/test-runner-commands';

const ROOT_DIR = './lib/blocks';

async function getBlockList() {
  return executeServerCommand('read-dir', { path: ROOT_DIR });
}

describe('Getting variants', () => {
  let blocks;

  before(async () => {
    blocks = await getBlockList();
  });

  it('should instantiate all the blocks and read their variants', async () => {
    const promises = blocks.map(async (block) => {
      try {
        const modulePath = `../../../lib/blocks/${block}/${block}.js`;
        const module = await import(modulePath);
        const el = document.createElement('div');
        // eslint-disable-next-line new-cap
        const instance = new module.default(block, el);
        console.log(
          block,
          ': ',
          instance.variants.map((v) => v.name)
        );
      } catch (ex) {
        console.error("Couldn't instatiate block class: ", block, ex.message);
      }
    });

    await Promise.all(promises);
  });
});

// npx wtr ./scripts/_variants/variants.js --node-resolve --config="./scripts/_variants/test-runner.config.mjs" --port=2408 -- --watch
