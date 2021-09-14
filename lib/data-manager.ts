/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os'
import chalk from 'chalk';
import { singleton } from 'tsyringe';
import { RoleCredentials } from '@aws-sdk/client-sso';

export interface CachedData {
  accounts: Array<AwsAccount>,
  temp_credentials: any,
  last_values: LastUsedValues,
  config: SSOConfig,
}

export interface AwsAccount {
  account_name: string,
  account_alias: string,
  account_id: string
  roles: string[]
}

export interface SSOConfig {
  sso_endpoint: string,
  region: string,
  clean_prefix: string,
  clean_suffix: string,
}

export interface LastUsedValues {
  account: string,
  role: string
}

@singleton()
export class DataManager {

  private data: CachedData;
  private cacheFilePath: string;

  public async load(): Promise<void> {
    const baseDir = path.join(os.homedir(), '.aws-sso-helper');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir);
    }
    this.cacheFilePath = path.join(baseDir, 'cached-data.json');
    if (fs.existsSync(this.cacheFilePath)) {
      const rawdata = fs.readFileSync(this.cacheFilePath).toString();
      this.data = JSON.parse(rawdata);
    } else {
      console.log(chalk.blueBright('Configuration file not found.'));
      this.data = {} as CachedData;
      this.save();
    }
    await this.validate();
  }

  public async validate() : Promise<void> {
    if (!this.data.accounts) this.data.accounts = [];
    
    if (!this.data.config) this.data.config = {} as SSOConfig;

    if (!this.data.last_values) this.data.last_values = {} as LastUsedValues;

    if (!this.data.temp_credentials) this.data.temp_credentials = {};
  }

  public save() {
    fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.data, null, 2));
  }

  public getAccount(search: string): AwsAccount | undefined {
    search = search.toLocaleLowerCase();
    return this.data.accounts.find((x) => {
      return x.account_name.toLocaleLowerCase() == search
        || x.account_alias.toLocaleLowerCase() == search
        || x.account_id.toLocaleLowerCase() == search
    });
  }

  public getConfig(): SSOConfig {
    return this.data.config;
  }

  public setConfig(config: SSOConfig): void {
    this.data.config = config;
    this.save();
  }

  public getCredentials(): any {
    return this.data.temp_credentials;
  }

  public setCredentials(credentials: any): void {
    this.data.temp_credentials = credentials;
    this.save();
  }

  public getAccounts(): Array<AwsAccount> {
    return this.data.accounts || new Array<AwsAccount>();
  }

  public setAccounts(accounts: Array<AwsAccount>) {
    this.data.accounts = accounts.sort((a,b) => (a.account_name > b.account_name) ? 1 : ((b.account_name > a.account_name) ? -1 : 0));
    this.save();
  }

  public getLastValuesUsed(): LastUsedValues {
    return this.data.last_values;
  }

  public setLastValuesUsed(lastUsedValues: LastUsedValues) {
    this.data.last_values = lastUsedValues;
    this.save();
  }
}
