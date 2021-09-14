/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import {container, injectable} from "tsyringe";
import chalk from 'chalk';
import { AwsAccount, DataManager } from '../data-manager';
import { ExportCredentialsHelper } from '../export-credentials-helper';
import { AccessTokenHelper } from '../access-token-helper';
import { SSOClient, GetRoleCredentialsCommand } from '@aws-sdk/client-sso'

@injectable()
export class LoginCommand {
  constructor(private dataManager: DataManager) {}

  public async run(account:AwsAccount, role:string): Promise<void> {
    
    if (account == undefined) {
      console.error(chalk.redBright("Account not found"));
      console.error(chalk.gray("Pass Account and Role as parameter or use the set command"));
      console.error(chalk.gray("You can refresh the account list using the refresh command"));
      process.exit(0);
    }
    
    if (!account.roles.includes(role)) {
      console.error(chalk.redBright(`Invalid role for account ${account.account_name}`));
      process.exit(0);
    }

    this.dataManager.setLastValuesUsed({
      account: account.account_name,
      role: role,
    })    

    const accessTokenHelper = container.resolve(AccessTokenHelper);
    await accessTokenHelper.LoadCachedAccessToken();

    // Get Temporary credentials from Role and Account
    console.log(
      chalk.gray('# Obtaining credentials for ') +
      chalk.yellow(role) +
      chalk.gray(' on account ') +
      chalk.yellow(`${account.account_name} #${account.account_id}`));

    const client = new SSOClient({ region: this.dataManager.getConfig().region });
    const command = new GetRoleCredentialsCommand({
      accessToken: this.dataManager.getCredentials().accessToken,
      accountId: account.account_id,
      roleName: role
    });
    const credentials = await client.send(command);
    if (!credentials.roleCredentials) {
      console.error(chalk.redBright("Invalid credentials received"));
      process.exit(0);
    }
    ExportCredentialsHelper.ExportCredentials(
      credentials.roleCredentials, 
      this.dataManager.getConfig().region, 
      account.account_alias, 
      role);

  }
}
