/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import chalk from 'chalk';

export class ExportCredentialsHelper {

    private static generateLine(key, value) {
        return `[System.Environment]::SetEnvironmentVariable('${key}', '${value}', [System.EnvironmentVariableTarget]::Process)`;
    }

    public static async ExportCredentials(credentials, region, account, role): Promise<void> {

        const isWin = process.platform === "win32";
        if (isWin) {
            console.log(this.generateLine('AWS_SECRET_ACCESS_KEY', credentials.secretAccessKey));
            console.log(this.generateLine('AWS_SESSION_TOKEN', credentials.sessionToken));
            console.log(this.generateLine('AWS_ACCESS_KEY_ID', credentials.accessKeyId));
            console.log(this.generateLine('AWS_DEFAULT_REGION', region));
            console.log(chalk.green(`# Token obtained correctly for role:${role} on account ${account}`));
            console.log(chalk.redBright("# ╭──────────────────────────────────────────────────╮"));
            console.log(chalk.redBright("# │ ALERT, environment variables not set !!!!        │"));
            console.log(chalk.redBright("# │ Only valid on Powershell                         │"));
            console.log(chalk.redBright("# │ Execute '| Invoke-Expression' after the command  │"));
            console.log(chalk.redBright("# ╰──────────────────────────────────────────────────╯"));
        } else {
            console.log(
                `export AWS_SECRET_ACCESS_KEY="${credentials.secretAccessKey}" 
             export AWS_SESSION_TOKEN="${credentials.sessionToken}"
             export AWS_ACCESS_KEY_ID="${credentials.accessKeyId}" 
             export AWS_DEFAULT_REGION="${region}"`);
            console.log(chalk.green(`# Token obtained correctly for role:${role} on account ${account}`));
            console.log(chalk.redBright("# ╭──────────────────────────────────────────────────╮"));
            console.log(chalk.redBright("# │ ALERT, environment variables not set !!!!        │"));
            console.log(chalk.redBright(`# │ Execute inside an eval => eval "$(awssso)"       │`));
            console.log(chalk.redBright("# ╰──────────────────────────────────────────────────╯"));
        }
    }
}

