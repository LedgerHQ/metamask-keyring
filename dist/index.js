"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hw_app_eth_1 = __importDefault(require("@ledgerhq/hw-app-eth"));
const ledger_1 = __importDefault(require("@ledgerhq/hw-app-eth/lib/services/ledger"));
const ethereumjs_util_1 = require("ethereumjs-util");
const tx_1 = require("@ethereumjs/tx");
const eth_sig_util_1 = require("eth-sig-util");
// eslint-disable-next-line
global.Buffer = require("buffer").Buffer;
const hdPathString = `m/44'/60'/0'/0/0`;
const type = "Ledger";
class LedgerKeyring {
    constructor(opts = {}) {
        this.type = type;
        this.accounts = [];
        this.hdPath = hdPathString;
        this.deviceId = "";
        this.getName = () => this.name;
        // eslint-disable-next-line @typescript-eslint/require-await
        this.serialize = () => __awaiter(this, void 0, void 0, function* () {
            return ({
                hdPath: this.hdPath,
                accounts: this.accounts,
                deviceId: this.deviceId,
            });
        });
        // eslint-disable-next-line @typescript-eslint/require-await
        this.deserialize = (opts) => __awaiter(this, void 0, void 0, function* () {
            this.hdPath = opts.hdPath || hdPathString;
            this.accounts = opts.accounts || [];
            this.deviceId = opts.deviceId || "";
        });
        // eslint-disable-next-line @typescript-eslint/require-await
        this.getAccounts = () => __awaiter(this, void 0, void 0, function* () {
            const addresses = this.accounts.map(({ address }) => address);
            return addresses;
        });
        this.managesAccount = (address) => __awaiter(this, void 0, void 0, function* () {
            const accounts = yield this.getAccounts();
            return accounts.some((managedAddress) => managedAddress.toLocaleLowerCase() === address.toLocaleLowerCase());
        });
        this.unlock = (hdPath) => __awaiter(this, void 0, void 0, function* () {
            const app = this._getApp();
            const account = yield app.getAddress(hdPath, false, true);
            return account.address;
        });
        this.addAccounts = (n = 1) => __awaiter(this, void 0, void 0, function* () {
            const address = yield this.unlock(this.hdPath);
            // The current immplemenation of LedgerKeyring only supports one account
            if (n > 1) {
                throw new Error("LedgerKeyring only supports one account");
            }
            if (this.accounts.length > 0) {
                // Just return the already imported account
                return this.getAccounts();
            }
            this.accounts.push({
                address,
                hdPath: this.hdPath,
            });
            return this.getAccounts();
        });
        this.getDefaultAccount = () => __awaiter(this, void 0, void 0, function* () {
            let accounts = yield this.getAccounts();
            if (this.accounts.length === 0) {
                accounts = yield this.addAccounts(1);
            }
            return accounts[0];
        });
        this.signTransaction = (address, tx) => __awaiter(this, void 0, void 0, function* () {
            const app = this._getApp();
            const hdPath = this._getHDPathFromAddress(address);
            // `getMessageToSign` will return valid RLP for all transaction types
            const messageToSign = tx.getMessageToSign(false);
            const rawTxHex = Buffer.isBuffer(messageToSign)
                ? messageToSign.toString("hex")
                : ethereumjs_util_1.rlp.encode(messageToSign).toString("hex");
            const resolution = yield ledger_1.default.resolveTransaction(rawTxHex, {}, {});
            const { r, s, v } = yield app.signTransaction(hdPath, rawTxHex, resolution);
            // Because tx will be immutable, first get a plain javascript object that
            // represents the transaction. Using txData here as it aligns with the
            // nomenclature of ethereumjs/tx.
            const txData = tx.toJSON();
            // The fromTxData utility expects a type to support transactions with a type other than 0
            txData.type = `0x${tx.type}`;
            // The fromTxData utility expects v,r and s to be hex prefixed
            txData.v = (0, ethereumjs_util_1.addHexPrefix)(v);
            txData.r = (0, ethereumjs_util_1.addHexPrefix)(r);
            txData.s = (0, ethereumjs_util_1.addHexPrefix)(s);
            // Adopt the 'common' option from the original transaction and set the
            // returned object to be frozen if the original is frozen.
            const transaction = tx_1.TransactionFactory.fromTxData(txData, {
                common: tx.common,
                freeze: Object.isFrozen(tx),
            });
            return transaction;
        });
        this.getAppAndVersion = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.transport) {
                throw new Error("Ledger transport is not initialized. You must call setTransport first.");
            }
            const response = yield this.transport.send(0xb0, 0x01, 0x00, 0x00);
            let i = 0;
            const format = response[i++];
            if (format !== 1) {
                throw new Error("getAppAndVersion: format not supported");
            }
            const nameLength = response[i++];
            const appName = response.slice(i, (i += nameLength)).toString("ascii");
            const versionLength = response[i++];
            const version = response.slice(i, (i += versionLength)).toString("ascii");
            return {
                appName,
                version,
            };
        });
        this.signMessage = (address, message) => __awaiter(this, void 0, void 0, function* () { return this.signPersonalMessage(address, message); });
        this.signPersonalMessage = (address, message) => __awaiter(this, void 0, void 0, function* () {
            const hdPath = this._getHDPathFromAddress(address);
            const messageWithoutHexPrefix = (0, ethereumjs_util_1.stripHexPrefix)(message);
            const app = this._getApp();
            const { r, s, v } = yield app.signPersonalMessage(hdPath, messageWithoutHexPrefix);
            let modifiedV = (v - 27).toString(16);
            if (modifiedV.length < 2) {
                modifiedV = `0${modifiedV}`;
            }
            const signature = `0x${r}${s}${modifiedV}`;
            const addressSignedWith = (0, eth_sig_util_1.recoverPersonalSignature)({
                data: message,
                sig: signature,
            });
            if ((0, ethereumjs_util_1.toChecksumAddress)(addressSignedWith) !== (0, ethereumjs_util_1.toChecksumAddress)(address)) {
                throw new Error("Ledger: The signature doesn't match the right address");
            }
            return signature;
        });
        this.signTypedData = (address, data, { version }) => __awaiter(this, void 0, void 0, function* () {
            const app = this._getApp();
            const isV4 = version === "V4";
            if (!isV4) {
                throw new Error("Ledger: Only version 4 of typed data signing is supported");
            }
            const { domain, types, primaryType, message } = eth_sig_util_1.TypedDataUtils.sanitizeData(JSON.parse(data));
            const domainSeparatorHex = eth_sig_util_1.TypedDataUtils.hashStruct("EIP712Domain", domain, types, true).toString("hex");
            const hashStructMessageHex = eth_sig_util_1.TypedDataUtils.hashStruct(primaryType, message, types, true).toString("hex");
            const hdPath = this._getHDPathFromAddress(address);
            const { r, s, v } = yield app.signEIP712HashedMessage(hdPath, domainSeparatorHex, hashStructMessageHex);
            let modifiedV = (v - 27).toString(16);
            if (modifiedV.length < 2) {
                modifiedV = `0${modifiedV}`;
            }
            const signature = `0x${r}${s}${modifiedV}`;
            const addressSignedWith = (0, eth_sig_util_1.recoverTypedSignature_v4)({
                data: JSON.parse(data),
                sig: signature,
            });
            if ((0, ethereumjs_util_1.toChecksumAddress)(addressSignedWith) !== (0, ethereumjs_util_1.toChecksumAddress)(address)) {
                throw new Error("Ledger: The signature doesnt match the right address");
            }
            return signature;
        });
        this.forgetDevice = () => {
            this.accounts = [];
            this.deviceId = "";
        };
        this.setTransport = (transport, deviceId) => {
            if (this.deviceId && this.deviceId !== deviceId) {
                throw new Error("LedgerKeyring: deviceId mismatch.");
            }
            this.transport = transport;
            this.app = new hw_app_eth_1.default(transport);
        };
        this.setApp = (app) => {
            this.app = app;
        };
        this._getApp = () => {
            if (!this.app) {
                throw new Error("Ledger app is not initialized. You must call setTransport first.");
            }
            return this.app;
        };
        this._getHDPathFromAddress = (address) => {
            const account = this.accounts.find(({ address: accAddress }) => {
                return accAddress.toLowerCase() === address.toLowerCase();
            });
            if (!account) {
                throw new Error(`Account not found for address: ${address}`);
            }
            return account.hdPath;
        };
        this.name = "Ledger";
        void this.deserialize(opts);
    }
}
exports.default = LedgerKeyring;
LedgerKeyring.type = type;
