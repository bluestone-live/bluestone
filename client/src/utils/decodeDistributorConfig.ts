export interface IDistributorConfig {
  address: string;
  depositFee: number;
}

export const decodeDistributorConfig = (
  configString: string,
): IDistributorConfig => JSON.parse(atob(configString));
