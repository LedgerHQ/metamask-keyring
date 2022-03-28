import LedgerKeyring, { EthereumApp } from "./index";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";

jest.mock("@ledgerhq/hw-app-eth/lib/services/ledger", () => ({
  resolveTransaction: () =>
    Promise.resolve({
      erc20Tokens: [],
      nfts: [],
      externalPlugin: [],
      plugin: [],
    }),
}));

const createMockApp = (props: Partial<EthereumApp>): EthereumApp => {
  const mockApp = {
    getAddress: jest.fn(() =>
      Promise.resolve({
        address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
        publicKey:
          "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
      })
    ),
    signTransaction: jest.fn(() =>
      Promise.resolve({
        s: "0x1",
        v: "0x2",
        r: "0x3",
      })
    ),
    signPersonalMessage: jest.fn(() =>
      Promise.resolve({
        s: "0x1",
        v: 2,
        r: "0x3",
      })
    ),
    ...props,
  };

  return mockApp;
};

describe("serialization", () => {
  test("type field is statically assigned", () => {
    const keyring = new LedgerKeyring();

    expect(keyring.type).toBe("Ledger");
    expect(LedgerKeyring.type).toBe("Ledger");
  });

  test("successfully serializes state for default values", async () => {
    const keyring = new LedgerKeyring();
    const serialized = await keyring.serialize();

    expect(serialized).toEqual({
      hdPath: "m/44'/60'/0'/0/0",
      accounts: [],
    });
  });

  test("successfully serializes state for provided values", async () => {
    const keyring = new LedgerKeyring({
      hdPath: "m/44'/60'/0'/0/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
        { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
      ],
    });

    const serialized = await keyring.serialize();

    expect(serialized).toEqual({
      hdPath: "m/44'/60'/0'/0/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
        { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
      ],
    });
  });

  test("successfully de-serializes state", async () => {
    const keyring = new LedgerKeyring();

    await keyring.deserialize({
      hdPath: "m/44'/60'/0'/0/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
        { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
      ],
    });

    const serialized = await keyring.serialize();

    expect(serialized).toEqual({
      hdPath: "m/44'/60'/0'/0/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
        { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
      ],
    });
  });

  test("successfully de-serializes state with no state provided", async () => {
    const keyring = new LedgerKeyring();

    await keyring.deserialize({});

    const serialized = await keyring.serialize();

    expect(serialized).toEqual({
      hdPath: "m/44'/60'/0'/0/0",
      accounts: [],
    });
  });
});

describe("accounts", () => {
  test("successfully returns accounts", async () => {
    const keyring = new LedgerKeyring();

    const accounts = await keyring.getAccounts();

    expect(accounts).toEqual([]);
  });

  test("successfuly returns accounts from restored state", async () => {
    const keyring = new LedgerKeyring();

    await keyring.deserialize({
      hdPath: "m/44'/60'/0'/0/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
        { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
      ],
    });

    const accounts = await keyring.getAccounts();

    expect(accounts).toEqual(["0x1", "0x2"]);
  });

  test("adds an account to the state", async () => {
    const keyring = new LedgerKeyring();

    const mockApp = createMockApp({
      getAddress: jest.fn(() =>
        Promise.resolve({
          address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
          publicKey:
            "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
        })
      ),
    });

    keyring.setApp(mockApp);

    const accounts = await keyring.addAccounts(1);

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toEqual("0xCbA98362e199c41E1864D0923AF9646d3A648451");
  });

  test("throws when trying to add multiple accounts", async () => {
    const keyring = new LedgerKeyring();

    await expect(keyring.addAccounts(2)).rejects.toThrow(
      "LedgerKeyring only supports one account"
    );
  });

  test("throw when trying to add another account", async () => {
    const keyring = new LedgerKeyring();

    const mockApp = createMockApp({
      getAddress: jest.fn(() =>
        Promise.resolve({
          address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
          publicKey:
            "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
        })
      ),
    });

    keyring.setApp(mockApp);

    await keyring.addAccounts(1);

    await expect(keyring.addAccounts(1)).rejects.toThrow(
      "LedgerKeyring only supports one account"
    );
  });

  test("retrieve the default account", async () => {
    const keyring = new LedgerKeyring();

    const mockApp = createMockApp({
      getAddress: jest.fn(() =>
        Promise.resolve({
          address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
          publicKey:
            "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
        })
      ),
    });

    keyring.setApp(mockApp);

    const account = await keyring.getDefaultAccount();

    expect(account).toEqual("0xCbA98362e199c41E1864D0923AF9646d3A648451");
  });
});

describe("unlock", () => {
  test("returns account's address successfully based on HD Path", async () => {
    const keyring = new LedgerKeyring();

    const mockApp = createMockApp({
      getAddress: jest.fn(() =>
        Promise.resolve({
          address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
          publicKey:
            "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
        })
      ),
    });

    keyring.setApp(mockApp);

    const address = await keyring.unlock("m/44'/60'/0'/0/0");

    expect(address).toEqual("0xCbA98362e199c41E1864D0923AF9646d3A648451");
  });

  test("throws error if app is not initialized", async () => {
    const keyring = new LedgerKeyring();

    await expect(keyring.unlock("m/44'/60'/0'/0/0")).rejects.toThrow(
      "Ledger app is not initialized. You must call setTransport first."
    );
  });
});

describe("signTransaction", () => {
  test("should sign transaction successfully", async () => {
    const keyring = new LedgerKeyring();

    const mockApp = createMockApp({
      getAddress: jest.fn(() =>
        Promise.resolve({
          address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
          publicKey:
            "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
        })
      ),
      signTransaction: jest.fn(() =>
        Promise.resolve({
          v: "0x01",
          r: "0xafb6e247b1c490e284053c87ab5f6b59e219d51f743f7a4d83e400782bc7e4b9",
          s: "0x479a268e0e0acd4de3f1e28e4fac2a6b32a4195e8dfa9d19147abe8807aa6f64",
        })
      ),
    });

    await keyring.deserialize({
      hdPath: "m/44'/60'/0'/0/0",
      accounts: [
        {
          address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
          hdPath: "m/44'/60'/0'/0/0",
        },
      ],
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

    const tx = FeeMarketEIP1559Transaction.fromTxData(txData);

    const signedTx = await keyring.signTransaction(
      "0xCbA98362e199c41E1864D0923AF9646d3A648451",
      tx
    );

    expect({
      v: signedTx.v?.toString("hex"),
      r: signedTx.r?.toString("hex"),
      s: signedTx.s?.toString("hex"),
    }).toEqual({
      v: "1",
      r: "afb6e247b1c490e284053c87ab5f6b59e219d51f743f7a4d83e400782bc7e4b9",
      s: "479a268e0e0acd4de3f1e28e4fac2a6b32a4195e8dfa9d19147abe8807aa6f64",
    });
  });
});

describe("forgetDevice", () => {
  test("sets empty account after forget device", async () => {
    const keyring = new LedgerKeyring();

    await keyring.deserialize({
      hdPath: "m/44'/60'/0'/0/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0'/0/0" },
        { address: "0x2", hdPath: "m/44'/60'/1'/0/0" },
      ],
    });

    keyring.forgetDevice();
    const accounts = await keyring.getAccounts();

    expect(accounts).toEqual([]);
  });
});
