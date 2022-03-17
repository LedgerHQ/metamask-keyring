import AppEth from "@ledgerhq/hw-app-eth";
import Transport from "@ledgerhq/hw-transport";

const hdPathString = `m/44'/60'/0`;
const type = "Ledger";

type SerializationOptions = {
  hdPath?: string;
  accounts?: Account[];
};

type Account = {
  address: string;
  hdPath: string;
};

export interface EthereumApp {
  getAddress(
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean
  ): Promise<{
    publicKey: string;
    address: string;
    chainCode?: string;
  }>;
}
export default class LedgerKeyring {
  public static readonly type = type;

  public readonly type = type;

  private hdPath: string = hdPathString;

  private accounts: Account[] = [];

  private app?: EthereumApp;

  constructor(opts: SerializationOptions = {}) {
    void this.deserialize(opts);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  serialize = async (): Promise<SerializationOptions> => ({
    hdPath: this.hdPath,
    accounts: this.accounts,
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  deserialize = async (opts: SerializationOptions): Promise<void> => {
    this.hdPath = opts.hdPath || hdPathString;
    this.accounts = opts.accounts || [];
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  getAccounts = async (): Promise<string[]> => {
    const addresses = this.accounts.map(({ address }) => address);
    return addresses;
  };

  unlock = async (hdPath: string): Promise<string> => {
    const app = this.getApp();
    const account = await app.getAddress(hdPath, false, true);

    return account.address;
  };

  setTransport = (transport: Transport) => {
    this.app = new AppEth(transport);
  };

  getApp = (): EthereumApp => {
    if (!this.app) {
      throw new Error(
        "Ledger app is not initialized. You must call setTransport first."
      );
    }

    return this.app;
  };

  setApp = (app: EthereumApp): void => {
    this.app = app;
  };
}
