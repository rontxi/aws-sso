/* eslint-disable no-console */
import {injectable} from "tsyringe";
import chalk from 'chalk';
import { DataManager } from '../data-manager';

@injectable()
export class LogoutCommand {

  constructor(private dataManager: DataManager) {}

  public async run(): Promise<void> {
    console.log(chalk.blueBright("Removing temporal credentials"));
    this.dataManager.setCredentials({});
    console.log(chalk.blueBright("Finished"));
  }
}
