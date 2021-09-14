import {injectable} from "tsyringe";
import chalk from 'chalk';
import * as prompts from 'prompts';
import {AwsAccount, DataManager } from '../data-manager';

@injectable()
export class SetCommand {

  constructor(private dataManager: DataManager) {}

  public async run(): Promise<void> {
    const lastValuesUsed = this.dataManager.getLastValuesUsed();
    const response = await prompts.prompt([{
      type: 'autocomplete',
      name: 'account',
      message: 'AWS account name, alias or id',
      choices: this.dataManager.getAccounts().map((x) => { return { title: x.account_name }; }),
      initial: lastValuesUsed.account
    }]);
    let account: AwsAccount | undefined;

    if (response && response.account) {
      account = this.dataManager.getAccount(response.account);
    }
    
    if (account == undefined) {
      console.error(chalk.redBright("Account not found"));
      process.exit(0);
    }
    lastValuesUsed.account = response.account;
   
    const responserole = await prompts.prompt([{
      type: 'autocomplete',
      name: 'role',
      message: 'AWS Role to assume',
      choices: account.roles.map((x) => { return { title: x }; }),
      initial: lastValuesUsed.role
    }]);
    lastValuesUsed.role = responserole.role;
    this.dataManager.setLastValuesUsed(lastValuesUsed);
  }
}
