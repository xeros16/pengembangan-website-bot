import { writeFile } from 'node:fs/promises';
import { COMMAND_CATALOG, COMMAND_CATEGORIES, COMMAND_WORKFLOWS, renderCommandCatalogMarkdown } from '../features/command-catalog.js';

const markdownOutput = new URL('../docs/commands.md', import.meta.url);
const jsonOutput = new URL('../docs/commands.json', import.meta.url);
await Promise.all([
  writeFile(markdownOutput, renderCommandCatalogMarkdown(), 'utf8'),
  writeFile(jsonOutput, JSON.stringify({
    schemaVersion: 1,
    commandCount: COMMAND_CATALOG.length,
    categories: COMMAND_CATEGORIES,
    commands: COMMAND_CATALOG,
    workflows: COMMAND_WORKFLOWS,
  }, null, 2) + '\n', 'utf8'),
]);
console.log(`Generated ${markdownOutput.pathname} and ${jsonOutput.pathname}`);
