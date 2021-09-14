/* eslint-disable @typescript-eslint/no-explicit-any */
import { injectable } from "tsyringe";
import { SSOOIDCClient, RegisterClientCommand, StartDeviceAuthorizationCommand, CreateTokenCommand } from "@aws-sdk/client-sso-oidc";
import { DataManager } from './data-manager';
import chalk from 'chalk';
import open from 'open';

@injectable()
export class AccessTokenHelper {

    constructor(private dataManager: DataManager) { }

    private async sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    private dateTimeReviver(key, value) {
        let a;
        if (typeof value === 'string') {
            a = /\/Date\((\d*)\)\//.exec(value);
            if (a) {
                return new Date(+a[1]);
            }
        }
        return value;
    }

    public async LoadAccessToken(): Promise<void> {
        const clientName = "default";
        const clientType = "public";
        const timeout = 60; // Seconds
        let accessToken = null;

        console.log(chalk.gray("# Refreshing Access Token"));
        const client = new SSOOIDCClient({ region: 'eu-west-1' });
        const registerClientCommand = new RegisterClientCommand({
            clientName: clientName,
            clientType: clientType
        });
        const registerClientResponse = await client.send(registerClientCommand);

        const startDeviceAuthorizationCommand = new StartDeviceAuthorizationCommand({
            clientId: registerClientResponse.clientId,
            clientSecret: registerClientResponse.clientSecret,
            startUrl: this.dataManager.getConfig().sso_endpoint
        });

        const deviceAuthorizationResponse = await client.send(startDeviceAuthorizationCommand);

        open(deviceAuthorizationResponse.verificationUriComplete);
        accessToken = null;
        console.log(chalk.gray("# Waiting for SSO login via browser..."));
        const SSOStart = Date.now();

        while (!accessToken && ((SSOStart - Date.now() / 1000) > timeout)) {
            try {
                const createTokenCommand = new CreateTokenCommand({
                    clientId: registerClientResponse.clientId,
                    clientSecret: registerClientResponse.clientSecret,
                    code: deviceAuthorizationResponse.userCode,
                    deviceCode: deviceAuthorizationResponse.deviceCode,
                    grantType: "urn:ietf:params:oauth:grant-type:device_code"
                })
                accessToken = await client.send(createTokenCommand);
            }
            catch (e) {
                await this.sleep(4000);
            }
        }
        if (!accessToken) {
            throw 'No Access Token obtained.'
        }
        // eslint-disable-next-line no-useless-escape
        accessToken.loggedAt = `\/Date(${Date.now()})\/`;
        this.dataManager.setCredentials(accessToken);
    }

    public async LoadCachedAccessToken(): Promise<void> {
        const temp_credentials = this.dataManager.getCredentials();
        if (!temp_credentials || !temp_credentials.accessToken) {
            await this.LoadAccessToken();
            return;
        }
        const accessToken = JSON.parse(JSON.stringify(temp_credentials), this.dateTimeReviver);
        const currentUTC = new Date(new Date().toUTCString());
        if ((currentUTC.getTime() - accessToken.loggedAt.getTime()) / 1000 > accessToken.expiresIn) {
            await this.LoadAccessToken();
        }
    }
}
