import Sql from 'better-sqlite3';
import { program } from 'commander';
import { version } from '../package.json';
import * as Keygen from './keygen';
import * as path from 'node:path';

type Options = {
  email: string;
  auto: boolean;
};

type DatabaseKey = {
  value?: string;
};

program
  //--Metadata--
  .name('Monokai Pro Keygen')
  .description('Generates license keys for Monokai Pro. VSCode only.')
  .version(version)
  //--Options--
  .option(
    '-e, --email <email>',
    'E-mail to be used in the registration process..',
    'monokai@gmail.com'
  )
  .option(
    '-a, --auto',
    'Automatically set the license key in the global state. This will require you to restart Visual Studio Code.',
    false,
  )
  .action(() => {
    const ARGUMENTS = program.opts<Options>() as Options;

    const key: Keygen.License = Keygen.generate(ARGUMENTS.email);

    if (ARGUMENTS.auto) {
      const possiblePaths: Map<string, string> = new Map<string, string>([
        ['win32', path.resolve(path.join(process.env.appdata ?? '', 'Code', 'User', 'globalStorage', 'state.vscdb'))],
        ['darwin', path.resolve(path.join(process.env.HOME ?? '', 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'state.vscdb'))], // TODO: test
        ['linux', path.resolve(path.join(process.env.HOME ?? '', '.config', 'Code', 'User', 'globalStorage', 'state.vscdb'))], // TODO: test
      ]);

      const dbPath: string =
        (possiblePaths.has(process.platform)
          ? possiblePaths.get(process.platform)
          : '') ?? '';
      if (!dbPath) {
        throw new Error('Unsupported platform.');
      }

      const db = new Sql(dbPath);
      const extensionKey: string = 'monokai.theme-monokai-pro-vscode';

      const stmt: Sql.Statement = db.prepare(
        'SELECT value FROM ItemTable WHERE key = ?'
      );

      const row: DatabaseKey = stmt.get(extensionKey) as DatabaseKey;
      console.assert(
        row.value, 'You need to run VSCode with the extension at least once.'
      );

      const addKeyStmt: Sql.Statement = db.prepare(
        'INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)'
      );

      let modifiedValue = JSON.parse(row.value!);
      modifiedValue['email'] = ARGUMENTS.email;
      modifiedValue['licenseKey'] = key;

      addKeyStmt.run(extensionKey, JSON.stringify(modifiedValue));

      console.log(
        'Automatically added license key to VSCode. You probably need to restart VSCode. This might not work is VSCode is currently open.'
      );
    }
    console.log('Email:', ARGUMENTS.email);
    console.log('License Key:', key);
  });

program.parse(process.argv);
