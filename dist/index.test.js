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
const index_1 = __importDefault(require("./index"));
const tx_1 = require("@ethereumjs/tx");
jest.mock("@ledgerhq/hw-app-eth/lib/services/ledger", () => ({
    resolveTransaction: () => Promise.resolve({
        erc20Tokens: [],
        nfts: [],
        externalPlugin: [],
        plugin: [],
    }),
}));
const createMockApp = (props) => {
    const mockApp = Object.assign({ getAddress: jest.fn(() => Promise.resolve({
            address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
            publicKey: "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
        })), signTransaction: jest.fn(() => Promise.resolve({
            s: "0x1",
            v: "0x2",
            r: "0x3",
        })), signPersonalMessage: jest.fn(() => Promise.resolve({
            s: "0x1",
            v: 2,
            r: "0x3",
        })), signEIP712HashedMessage: jest.fn(() => Promise.resolve({
            s: "0x1",
            v: 2,
            r: "0x3",
        })) }, props);
    return mockApp;
};
describe("serialization", () => {
    test("type field is statically assigned", () => {
        const keyring = new index_1.default();
        expect(keyring.type).toBe("Ledger");
        expect(index_1.default.type).toBe("Ledger");
    });
    test("successfully serializes state for default values", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        const serialized = yield keyring.serialize();
        expect(serialized).toEqual({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [],
            deviceId: "",
        });
    }));
    test("successfully serializes state for provided values", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [
                { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
                { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
            ],
            deviceId: "device_1",
        });
        const serialized = yield keyring.serialize();
        expect(serialized).toEqual({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [
                { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
                { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
            ],
            deviceId: "device_1",
        });
    }));
    test("successfully de-serializes state", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        yield keyring.deserialize({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [
                { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
                { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
            ],
            deviceId: "device_1",
        });
        const serialized = yield keyring.serialize();
        expect(serialized).toEqual({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [
                { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
                { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
            ],
            deviceId: "device_1",
        });
    }));
    test("successfully de-serializes state with no state provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        yield keyring.deserialize({});
        const serialized = yield keyring.serialize();
        expect(serialized).toEqual({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [],
            deviceId: "",
        });
    }));
});
describe("accounts", () => {
    test("successfully returns accounts", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        const accounts = yield keyring.getAccounts();
        expect(accounts).toEqual([]);
    }));
    test("successfuly returns accounts from restored state", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        yield keyring.deserialize({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [
                { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
                { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
            ],
            deviceId: "device_1",
        });
        const accounts = yield keyring.getAccounts();
        expect(accounts).toEqual(["0x1", "0x2"]);
    }));
    test("adds an account to the state", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        const mockApp = createMockApp({
            getAddress: jest.fn(() => Promise.resolve({
                address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
                publicKey: "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
            })),
        });
        keyring.setApp(mockApp);
        const accounts = yield keyring.addAccounts(1);
        expect(accounts).toHaveLength(1);
        expect(accounts[0]).toEqual("0xCbA98362e199c41E1864D0923AF9646d3A648451");
    }));
    test("throws when trying to add multiple accounts", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        const mockApp = createMockApp({
            getAddress: jest.fn(() => Promise.resolve({
                address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
                publicKey: "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
            })),
        });
        keyring.setApp(mockApp);
        yield expect(keyring.addAccounts(2)).rejects.toThrow("LedgerKeyring only supports one account");
    }));
    test("throw when trying to add another account", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        const mockApp = createMockApp({
            getAddress: jest.fn(() => Promise.resolve({
                address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
                publicKey: "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
            })),
        });
        keyring.setApp(mockApp);
        yield keyring.addAccounts(1);
        // Adding repeatedly an account
        const result = yield keyring.addAccounts(1);
        expect(result).toEqual(["0xCbA98362e199c41E1864D0923AF9646d3A648451"]);
    }));
    test("retrieve the default account", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        const mockApp = createMockApp({
            getAddress: jest.fn(() => Promise.resolve({
                address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
                publicKey: "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
            })),
        });
        keyring.setApp(mockApp);
        const account = yield keyring.getDefaultAccount();
        expect(account).toEqual("0xCbA98362e199c41E1864D0923AF9646d3A648451");
    }));
});
describe("unlock", () => {
    test("returns account's address successfully based on HD Path", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        const mockApp = createMockApp({
            getAddress: jest.fn(() => Promise.resolve({
                address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
                publicKey: "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
            })),
        });
        keyring.setApp(mockApp);
        const address = yield keyring.unlock("m/44'/60'/0'/0/0");
        expect(address).toEqual("0xCbA98362e199c41E1864D0923AF9646d3A648451");
    }));
    test("throws error if app is not initialized", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        yield expect(keyring.unlock("m/44'/60'/0'/0/0")).rejects.toThrow("Ledger app is not initialized. You must call setTransport first.");
    }));
});
describe("signTransaction", () => {
    test("should sign transaction successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const keyring = new index_1.default();
        const mockApp = createMockApp({
            getAddress: jest.fn(() => Promise.resolve({
                address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
                publicKey: "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
            })),
            signTransaction: jest.fn(() => Promise.resolve({
                v: "0x01",
                r: "0xafb6e247b1c490e284053c87ab5f6b59e219d51f743f7a4d83e400782bc7e4b9",
                s: "0x479a268e0e0acd4de3f1e28e4fac2a6b32a4195e8dfa9d19147abe8807aa6f64",
            })),
        });
        yield keyring.deserialize({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [
                {
                    address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
                    hdPath: "m/44'/60'/0'/0/0",
                },
            ],
            deviceId: "device_1",
        });
        keyring.setApp(mockApp);
        const txData = {
            data: "0x",
            gasLimit: "0x02625a00",
            maxPriorityFeePerGas: "0x01",
            maxFeePerGas: "0xff",
            nonce: "0x00",
            to: "0xcccccccccccccccccccccccccccccccccccccccc",
            value: "0x0186a0",
            chainId: "0x01",
            accessList: [],
            type: "0x02",
        };
        const tx = tx_1.FeeMarketEIP1559Transaction.fromTxData(txData);
        const signedTx = yield keyring.signTransaction("0xCbA98362e199c41E1864D0923AF9646d3A648451", tx);
        expect({
            v: (_a = signedTx.v) === null || _a === void 0 ? void 0 : _a.toString("hex"),
            r: (_b = signedTx.r) === null || _b === void 0 ? void 0 : _b.toString("hex"),
            s: (_c = signedTx.s) === null || _c === void 0 ? void 0 : _c.toString("hex"),
        }).toEqual({
            v: "1",
            r: "afb6e247b1c490e284053c87ab5f6b59e219d51f743f7a4d83e400782bc7e4b9",
            s: "479a268e0e0acd4de3f1e28e4fac2a6b32a4195e8dfa9d19147abe8807aa6f64",
        });
    }));
});
describe("signMessage", () => {
    test("should sign a message successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        const mockApp = createMockApp({
            getAddress: jest.fn(() => Promise.resolve({
                address: "0x9e10effa844d7399cdc555613b23a8499e04e386",
                publicKey: "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
            })),
            signPersonalMessage: jest.fn(() => Promise.resolve({
                v: 27,
                r: "afb6e247b1c490e284053c87ab5f6b59e219d51f743f7a4d83e400782bc7e4b9",
                s: "479a268e0e0acd4de3f1e28e4fac2a6b32a4195e8dfa9d19147abe8807aa6f64",
            })),
        });
        yield keyring.deserialize({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [
                {
                    address: "0x9e10effa844d7399cdc555613b23a8499e04e386",
                    hdPath: "m/44'/60'/0'/0/0",
                },
            ],
            deviceId: "device_1",
        });
        keyring.setApp(mockApp);
        const signature = yield keyring.signPersonalMessage("0x9e10effa844d7399cdc555613b23a8499e04e386", Buffer.from("Sign Personal Message Test").toString("hex"));
        expect(signature).toEqual("0xafb6e247b1c490e284053c87ab5f6b59e219d51f743f7a4d83e400782bc7e4b9479a268e0e0acd4de3f1e28e4fac2a6b32a4195e8dfa9d19147abe8807aa6f6400");
    }));
});
describe("signTypedMessage", () => {
    test("signs a v4 typed message successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        const mockApp = createMockApp({
            getAddress: jest.fn(() => Promise.resolve({
                address: "0xe908e4378431418759b4f87b4bf7966e8aaa5cf2",
                publicKey: "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
            })),
            signEIP712HashedMessage: jest.fn(() => Promise.resolve({
                v: 27,
                r: "afb6e247b1c490e284053c87ab5f6b59e219d51f743f7a4d83e400782bc7e4b9",
                s: "479a268e0e0acd4de3f1e28e4fac2a6b32a4195e8dfa9d19147abe8807aa6f64",
            })),
        });
        yield keyring.deserialize({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [
                {
                    address: "0xe908e4378431418759b4f87b4bf7966e8aaa5cf2",
                    hdPath: "m/44'/60'/0'/0/0",
                },
            ],
            deviceId: "device_1",
        });
        keyring.setApp(mockApp);
        const signature = yield keyring.signTypedMessage("0xe908e4378431418759b4f87b4bf7966e8aaa5cf2", JSON.stringify({
            domain: {
                // Defining the chain aka Rinkeby testnet or Ethereum Main Net
                chainId: 1,
                // Give a user friendly name to the specific contract you are signing for.
                name: "Ether Mail",
                // If name isn't enough add verifying contract to make sure you are establishing contracts with the proper entity
                verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
                // Just let's you know the latest version. Definitely make sure the field name is correct.
                version: "1",
            },
            // Defining the message signing data content.
            message: {
                /*
                 - Anything you want. Just a JSON Blob that encodes the data you want to send
                 - No required fields
                 - This is DApp Specific
                 - Be as explicit as possible when building out the message schema.
                */
                contents: "Hello, Bob!",
                attachedMoneyInEth: 4.2,
                from: {
                    name: "Cow",
                    wallets: [
                        "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
                        "0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF",
                    ],
                },
                to: [
                    {
                        name: "Bob",
                        wallets: [
                            "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
                            "0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57",
                            "0xB0B0b0b0b0b0B000000000000000000000000000",
                        ],
                    },
                ],
            },
            // Refers to the keys of the *types* object below.
            primaryType: "Mail",
            types: {
                // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
                EIP712Domain: [
                    { name: "name", type: "string" },
                    { name: "version", type: "string" },
                    { name: "chainId", type: "uint256" },
                    { name: "verifyingContract", type: "address" },
                ],
                // Not an EIP712Domain definition
                Group: [
                    { name: "name", type: "string" },
                    { name: "members", type: "Person[]" },
                ],
                // Refer to PrimaryType
                Mail: [
                    { name: "from", type: "Person" },
                    { name: "to", type: "Person[]" },
                    { name: "contents", type: "string" },
                ],
                // Not an EIP712Domain definition
                Person: [
                    { name: "name", type: "string" },
                    { name: "wallets", type: "address[]" },
                ],
            },
        }), { version: "V4" });
        expect(signature).toEqual("0xafb6e247b1c490e284053c87ab5f6b59e219d51f743f7a4d83e400782bc7e4b9479a268e0e0acd4de3f1e28e4fac2a6b32a4195e8dfa9d19147abe8807aa6f6400");
    }));
});
describe("forgetDevice", () => {
    test("sets empty account after forget device", () => __awaiter(void 0, void 0, void 0, function* () {
        const keyring = new index_1.default();
        yield keyring.deserialize({
            hdPath: "m/44'/60'/0'/0/0",
            accounts: [
                { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
                { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
            ],
            deviceId: "device_1",
        });
        keyring.forgetDevice();
        const accounts = yield keyring.getAccounts();
        expect(accounts).toEqual([]);
    }));
});
