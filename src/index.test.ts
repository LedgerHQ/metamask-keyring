import LedgerKeyring, { EthereumApp } from "./index";

const createMockApp = (props: Partial<EthereumApp>): EthereumApp => {
  const mockApp = {
    getAddress: jest.fn(() =>
      Promise.resolve({
        address: "0xCbA98362e199c41E1864D0923AF9646d3A648451",
        publicKey:
          "04df00ad3869baad7ce54f4d560ba7f268d542df8f2679a5898d78a690c3db8f9833d2973671cb14b088e91bdf7c0ab00029a576473c0e12f84d252e630bb3809b",
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
      hdPath: "m/44'/60'/0",
      accounts: [],
    });
  });

  test("successfully serializes state for provided values", async () => {
    const keyring = new LedgerKeyring({
      hdPath: "m/44'/60'/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0" },
        { address: "0x2", hdPath: "m/44'/60'/1" },
      ],
    });

    const serialized = await keyring.serialize();

    expect(serialized).toEqual({
      hdPath: "m/44'/60'/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0" },
        { address: "0x2", hdPath: "m/44'/60'/1" },
      ],
    });
  });

  test("successfully de-serializes state", async () => {
    const keyring = new LedgerKeyring();

    await keyring.deserialize({
      hdPath: "m/44'/60'/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0" },
        { address: "0x2", hdPath: "m/44'/60'/1" },
      ],
    });

    const serialized = await keyring.serialize();

    expect(serialized).toEqual({
      hdPath: "m/44'/60'/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0" },
        { address: "0x2", hdPath: "m/44'/60'/1" },
      ],
    });
  });

  test("successfully de-serializes state with no state provided", async () => {
    const keyring = new LedgerKeyring();

    await keyring.deserialize({});

    const serialized = await keyring.serialize();

    expect(serialized).toEqual({
      hdPath: "m/44'/60'/0",
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
      hdPath: "m/44'/60'/0",
      accounts: [
        { address: "0x1", hdPath: "m/44'/60'/0" },
        { address: "0x2", hdPath: "m/44'/60'/1" },
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

    const address = await keyring.unlock("m/44'/60'/0");

    expect(address).toEqual("0xCbA98362e199c41E1864D0923AF9646d3A648451");
  });

  test("throws error if app is not initialized", async () => {
    const keyring = new LedgerKeyring();

    await expect(keyring.unlock("m/44'/60'/0")).rejects.toThrow(
      "Ledger app is not initialized. You must call setTransport first."
    );
  });
});
