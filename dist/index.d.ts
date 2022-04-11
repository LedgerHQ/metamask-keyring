import Transport from "@ledgerhq/hw-transport";
import { LedgerEthTransactionResolution } from "@ledgerhq/hw-app-eth/lib/services/types";
import { TypedTransaction } from "@ethereumjs/tx";
declare type SerializationOptions = {
    hdPath?: string;
    accounts?: Account[];
    deviceId?: string;
};
declare type Account = {
    address: string;
    hdPath: string;
};
export interface EthereumApp {
    getAddress(path: string, boolDisplay?: boolean, boolChaincode?: boolean): Promise<{
        publicKey: string;
        address: string;
        chainCode?: string;
    }>;
    signTransaction(path: string, rawTxHex: string, resolution?: LedgerEthTransactionResolution | null): Promise<{
        s: string;
        v: string;
        r: string;
    }>;
    signPersonalMessage(path: string, messageHex: string): Promise<{
        v: number;
        s: string;
        r: string;
    }>;
    signEIP712HashedMessage(path: string, domainSeparatorHex: string, hashStructMessageHex: string): Promise<{
        v: number;
        s: string;
        r: string;
    }>;
}
export default class LedgerKeyring {
    static readonly type = "Ledger";
    readonly type = "Ledger";
    accounts: Account[];
    private name;
    private hdPath;
    private deviceId;
    private app?;
    private transport?;
    constructor(opts?: SerializationOptions);
    getName: () => string;
    serialize: () => Promise<SerializationOptions>;
    deserialize: (opts: SerializationOptions) => Promise<void>;
    getAccounts: () => Promise<string[]>;
    managesAccount: (address: string) => Promise<boolean>;
    unlock: (hdPath: string) => Promise<string>;
    addAccounts: (n?: number) => Promise<string[]>;
    getDefaultAccount: () => Promise<string>;
    signTransaction: (address: string, tx: TypedTransaction) => Promise<TypedTransaction>;
    getAppAndVersion: () => Promise<{
        appName: string;
        version: string;
    }>;
    signMessage: (address: string, message: string) => Promise<string>;
    signPersonalMessage: (address: string, message: string) => Promise<string>;
    signTypedData: (address: string, data: string, { version }: {
        version: string;
    }) => Promise<string>;
    forgetDevice: () => void;
    setTransport: (transport: Transport, deviceId: string) => void;
    setApp: (app: EthereumApp) => void;
    private _getApp;
    private _getHDPathFromAddress;
}
export {};
