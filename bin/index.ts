#!/usr/bin/env node
import "reflect-metadata";
import { container } from "tsyringe";
import { Command } from 'commander';
import { ImportAccountsCommand } from '../lib/commands/import-accounts';
import { LoginCommand } from '../lib/commands/login';
import { LogoutCommand } from '../lib/commands/logout';
import { SetCommand } from '../lib/commands/set';
import { ConfigCommand } from '../lib/commands/config';
import { DataManager } from "../lib/data-manager";
import chalk from "chalk";

const program = new Command();
const dataManager = container.resolve(DataManager);

(async () => {

  await dataManager.load();
  await dataManager.validate();
  if (!dataManager.getConfig().sso_endpoint) {
    const configCommand = container.resolve(ConfigCommand);
    await configCommand.run();
  } 
  if (dataManager.getAccounts().length < 1) { 
    console.log(chalk.blueBright('Found empty list of accounts'));
    const configCommand = container.resolve(ConfigCommand);
    await configCommand.runRefresh();
  }

  program
    .name('aws-sso')
    .usage('command [options]')
    .description('A helper for AWS SSO terminal login');

  await program
    .command('refresh')
    .description('Refresh AWS SSO Accounts and roles')
    .action(() => {
      const importerCommand = container.resolve(ImportAccountsCommand);
      importerCommand.run();
    });

  await program
    .command('config')
    .description('Configure this CLI')
    .action(() => {
      const configCommand = container.resolve(ConfigCommand);
      configCommand.run();
    });

  await program
    .command('set')
    .description('Set default account and role')
    .action(() => {
      const setCommand = container.resolve(SetCommand);
      setCommand.run();
    });

  await program
    .command('login', { isDefault: true })
    .alias('l')
    .argument('[account]', 'AWS account name, alias or id', dataManager.getLastValuesUsed().account)
    .argument('[role]', 'AWS role to assume', dataManager.getLastValuesUsed().role)
    .description('Login to an AWS Account')
    .action((account, role) => {
      const awsAccount = dataManager.getAccount(account || '');
      const loginCommand = container.resolve(LoginCommand);
      loginCommand.run(awsAccount, role);
    });

  await program
    .command('logout')
    .alias('t')
    .description('Remove stored credentials')
    .action(() => {
      const logoutCommand = container.resolve(LogoutCommand);
      logoutCommand.run();
    });

  program.parse(process.argv);

})();