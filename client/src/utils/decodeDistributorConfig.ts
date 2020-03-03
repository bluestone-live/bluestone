export interface IDistributorConfig {
  address: string;
}

export const decodeDistributorConfig = (
  configString: string,
): IDistributorConfig => JSON.parse(atob(configString));
