/* eslint-disable no-console */
import { container, injectable } from "tsyringe";
import { DataManager, AwsAccount } from '../data-manager';
import { AccessTokenHelper } from '../access-token-helper';
import { SSOClient, paginateListAccounts, paginateListAccountRoles } from '@aws-sdk/client-sso'
import chalk from 'chalk';

@injectable()
export class ImportAccountsCommand {

  constructor(private dataManager: DataManager) { }

  public async run(): Promise<void> {

    console.info(chalk.blueBright('Importing account from AWS Organizations'));
    try {
      const accessTokenHelper = container.resolve(AccessTokenHelper);
      await accessTokenHelper.LoadCachedAccessToken();
      const accessToken = this.dataManager.getCredentials().accessToken;
      const client = new SSOClient({ region: this.dataManager.getConfig().region });
      const queryPaginator = paginateListAccounts({ client: client }, {
        accessToken: accessToken
      });
      const accounts = [];
      for await (const page of queryPaginator) {
        page.accountList && accounts.push(...page.accountList);
      }
      console.info(chalk.blueBright(`Importing roles for ${accounts.length} accounts`));
      for (const account of accounts) {
        const rolesQueryPaginator = paginateListAccountRoles({ client: client }, {
          accessToken: accessToken,
          accountId: account.accountId
        });
        account.roles = [];
        for await (const page of rolesQueryPaginator) {
          page.roleList && account.roles.push(...page.roleList);
        }
        process.stdout.write(".");
        await new Promise(f => setTimeout(f, 100));
      }
      console.log("");

      this.dataManager.setAccounts(
        accounts.map((x) => {
          return <AwsAccount>{
            account_id: x.accountId,
            account_alias: x.accountName,
            account_name: this.clean_account_name(x.accountName),
            roles: x.roles.map((r) => {
              return r.roleName
            }),
          }
        }));

      console.info(chalk.blueBright(`Import finished`));
    } catch (e) {
      console.log(chalk.redBright(e.name));
      console.log(chalk.gray(e.message));
    }
  }

  private clean_account_name(name: string): string {
    const config = this.dataManager.getConfig();
    if (config.clean_prefix && name.startsWith(config.clean_prefix)) {
      name = name.substring(config.clean_prefix.length);
    }
    if (config.clean_suffix && name.endsWith(config.clean_suffix)) {
      name = name.substring(0, name.length - config.clean_suffix.length);
    }
    return name;
  }
}
