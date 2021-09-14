import chalk from 'chalk';
import * as prompts from 'prompts';
import { container, injectable } from "tsyringe";
import { DataManager } from '../data-manager';
import { ImportAccountsCommand } from './import-accounts';

@injectable()
export class ConfigCommand {

  constructor(private dataManager: DataManager) { }

  public async run(): Promise<void> {
    await this.configQueries();
    await this.runRefresh();
  }

  public async runRefresh(): Promise<void> {
    const responses = await prompts.prompt({
      type: 'confirm',
      name: 'refresh',
      message: 'Refresh account list now?',
      initial: true,
    });
    if (responses && responses.refresh) {
      const importer = container.resolve(ImportAccountsCommand);
      await importer.run();
    }
  }

  public async configQueries(): Promise<void> {
    const defaults = this.dataManager.getConfig();
    const q: prompts.PromptObject<string>[] = [
      {
        type: 'text',
        name: 'sso_endpoint',
        message: 'SSO Endpoint url (https://xxxxxx.awsapps.com/start#/)',
        initial: defaults.sso_endpoint
      },
      {
        type: 'text',
        name: 'region',
        message: 'AWS Region',
        initial: defaults.region
      },
      {
        type: 'text',
        name: 'cleanPrefix',
        message: 'Clean text at the beggining of the account names',
        initial: defaults.clean_prefix
      },
      {
        type: 'text',
        name: 'cleanSufix',
        message: 'Clean text at the end of the account names',
        initial: defaults.clean_suffix
      }
    ];
    const responses = await prompts.prompt(q);
    if (!responses ||  !responses.sso_endpoint ) {
      console.error(chalk.redBright("Invalid configuration"));
      process.exit(0);
    }
    this.dataManager.setConfig({
      sso_endpoint: responses.sso_endpoint,
      region: responses.region,
      clean_prefix: responses.cleanPrefix,
      clean_suffix: responses.cleanSufix
    });
  }
}
