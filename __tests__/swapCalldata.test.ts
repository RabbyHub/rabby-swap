import { CHAINS, CHAINS_ENUM } from "@debank/common";
import { defaultAbiCoder, Interface } from "@ethersproject/abi";
import Decimal from "bignumber.js";
import { encodePacked } from "web3-utils";
import {
  DEX_ENUM,
  DEX_ROUTER_WHITELIST,
  decodeCalldata as decodeSdkCalldata,
  isSwapCalldataReceiverAllowed,
  verifyCalldata,
} from "../src";
import type { TxWithChainId } from "../src";
import { UniABI, MagpieABI } from "../src/abi";
import { NULL_ADDRESS, isSameAddress } from "../src/utils";
import { getComparableUniInputAmount } from "../src/calldata/uni/assets";

const decodeCalldata = (dexId: string, tx: TxWithChainId) => {
  const result = decodeSdkCalldata(dexId as DEX_ENUM, tx);
  if (!result) throw new Error(`${dexId} returned no decoded calldata`);
  return result;
};

describe("[Uniswap] Router versions and commands", () => {
  const fromToken = "0x1111111111111111111111111111111111111111";
  const toToken = "0x2222222222222222222222222222222222222222";
  const sender = "0x3333333333333333333333333333333333333333";
  const zero = "0x0000000000000000000000000000000000000000";
  const msgSender = "0x0000000000000000000000000000000000000001";
  const v2Router = "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af";
  const arcRouter = "0x4fca4a51ab4f23a7447b3284fbd7d73289a89fb1";
  const eraRouter = "0x28731bcc616b5f51dd52cf2e4df0e78dd1136c06";
  const universal = new Interface([
    "function execute(bytes commands,bytes[] inputs,uint256 deadline)",
  ]);
  const encode = defaultAbiCoder.encode.bind(defaultAbiCoder);
  const transaction = (data: string, to = v2Router, chainId = 1) => ({
    from: sender,
    to,
    value: "0",
    chainId,
    data,
  });
  const expected = {
    fromToken,
    fromTokenAmount: "100",
    toToken,
    minReceiveToTokenAmount: "90",
    toTokenReceiver: sender,
  };

  // Independent encodings keep the SDK decoder from defining its own expectations.
  const poolKey = "tuple(address,address,uint24,int24,address)";
  const pathKey = "tuple(address,uint24,int24,address,bytes)";
  const v4Input = (
    newVersion: boolean,
    action: number,
    zeroForOne = true,
    prepaid = false
  ) => {
    const single = action === 0x06 || action === 0x08;
    const exactOut = action === 0x08 || action === 0x09;
    const input = single && !zeroForOne ? toToken : fromToken;
    const output = single && !zeroForOne ? fromToken : toToken;
    const schema = single
      ? `tuple(${poolKey},bool,uint128,uint128,${
          newVersion ? "uint256," : ""
        }bytes)`
      : `tuple(address,${pathKey}[],${
          newVersion ? "uint256[]," : ""
        }uint128,uint128)`;
    const amounts = exactOut ? [90, 100] : [100, 90];
    const value = single
      ? [
          [fromToken, toToken, 3000, 60, zero],
          zeroForOne,
          ...amounts,
          ...(newVersion ? [1] : []),
          "0x",
        ]
      : [
          exactOut ? toToken : fromToken,
          [
            [
              "0x4444444444444444444444444444444444444444",
              3000,
              60,
              zero,
              "0x",
            ],
            [exactOut ? fromToken : toToken, 3000, 60, zero, "0x"],
          ],
          ...(newVersion ? [[1, 1]] : []),
          ...amounts,
        ];
    return encode(
      ["bytes", "bytes[]"],
      [
        `0x${action.toString(16).padStart(2, "0")}${prepaid ? "0b" : "0c"}0e`,
        [
          encode([schema], [value]),
          prepaid
            ? encode(["address", "uint256", "bool"], [input, 100, false])
            : encode(["address", "uint256"], [input, 100]),
          // OPEN_DELTA avoids a later payment bound hiding a wrong swap minimum.
          encode(["address", "address", "uint256"], [output, sender, 0]),
        ],
      ]
    );
  };

  const routerVersions = [
    {
      version: "2.0",
      address: v2Router,
      chainId: 1,
      newVersion: false,
    },
    {
      version: "2.1.1",
      address: arcRouter,
      chainId: 5042,
      newVersion: true,
    },
    ...[
      {
        address: "0x23617e59A5925b2A4Bf75d73ff6711cD0b29De85",
        chainId: 1,
      },
      {
        address: "0x8702463e73f74d0b6765aBceb314Ef07aCb92650",
        chainId: 5042,
      },
      {
        address: "0x204FAca1764B154221e35c0d20aBb3c525710498",
        chainId: 4663,
      },
    ].map((profile) => ({ ...profile, version: "2.1.2", newVersion: true })),
  ];

  describe.each(routerVersions)(
    "current Universal Router $version / chain $chainId",
    ({ address, chainId, newVersion }) => {
      it.each([
        { name: "single exact input", action: 0x06 },
        { name: "path exact input", action: 0x07 },
      ])("decodes V4 $name with the correct fields", ({ action }) => {
        const data = universal.encodeFunctionData("execute", [
          "0x10",
          [v4Input(newVersion, action)],
          2000000000,
        ]);
        expect(
          decodeCalldata("Uniswap", transaction(data, address, chainId))
        ).toEqual(expected);
      });

      it("reads both currencies in a zeroForOne=false single swap", () => {
        const data = universal.encodeFunctionData("execute", [
          "0x10",
          [v4Input(newVersion, 0x06, false)],
          2000000000,
        ]);
        expect(
          decodeCalldata("Uniswap", transaction(data, address, chainId))
        ).toEqual({ ...expected, fromToken: toToken, toToken: fromToken });
      });

      it.each([0x08, 0x09])("rejects V4 exact-output action %s", (action) => {
        const data = universal.encodeFunctionData("execute", [
          "0x10",
          [v4Input(newVersion, action)],
          2000000000,
        ]);
        expect(() =>
          decodeCalldata("Uniswap", transaction(data, address, chainId))
        ).toThrow("current exact-input quote flow");
      });
    }
  );

  describe("Universal Router entry points and version selection", () => {
    const ammInput = encode(
      ["address", "uint256", "uint256", "bytes", "bool"],
      [
        msgSender,
        100,
        90,
        encodePacked(
          { type: "address", value: fromToken },
          { type: "uint24", value: "3000" },
          { type: "address", value: toToken }
        )!,
        true,
      ]
    );
    const execute = (commands: string, inputs: string[]) =>
      universal.encodeFunctionData("execute", [commands, inputs, 2000000000]);

    it("decodes V2 exact input without reversing its path", () => {
      const input = encode(
        ["address", "uint256", "uint256", "address[]", "bool"],
        [msgSender, 100, 90, [fromToken, toToken], true]
      );
      expect(
        decodeCalldata("Uniswap", transaction(execute("0x08", [input])))
      ).toEqual(expected);
    });

    it.each([0x01, 0x09])("rejects exact-output command %s", (command) => {
      const data = execute(`0x${command.toString(16).padStart(2, "0")}`, [
        ammInput,
      ]);
      expect(() => decodeCalldata("Uniswap", transaction(data))).toThrow(
        "current exact-input quote flow"
      );
    });

    it("uses the zkSync 1.2 mask despite the SDK 2.0 address alias", () => {
      const data = execute("0x20", [ammInput]);
      const tx = transaction(data, eraRouter, 324);
      expect(decodeCalldata("Uniswap", tx)).toEqual(expected);
      expect(() =>
        decodeCalldata("Uniswap", transaction(data, arcRouter, 5042))
      ).toThrow("Unsupported command 0x20");
    });

    it("strips execution flags before delegating a command to the SDK", () => {
      expect(
        decodeCalldata("Uniswap", transaction(execute("0x80", [ammInput])))
      ).toEqual(expected);
    });

    it("does not interpret a zkSync 1.2 Seaport command as a V4 swap", () => {
      const data = execute("0x10", [v4Input(false, 0x06)]);
      expect(() =>
        decodeCalldata("Uniswap", transaction(data, eraRouter, 324))
      ).toThrow("Seaport, not a V4 swap");
    });

    it.each([
      sender,
      "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b",
      "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
      "0xd92a36b0000531ef3063ded4de20a0783308446c",
      "0x4c82d1fbfe28c977cbb58d8c7ff8fcf9f70a2cca",
      "0x8702463e73f74d0b6765abceb314ef07acb92650", // Arc's 2.1.2 router on Ethereum.
      "0xab863e752bf67d8dcdd929eaae9be9dc83fb3bbb",
    ])(
      "rejects a router outside the current chain configuration: %s",
      (address) => {
        expect(() =>
          decodeCalldata(
            "Uniswap",
            transaction(execute("0x00", [ammInput]), address)
          )
        ).toThrow("Unknown Universal Router version");
      }
    );

    describe.each(routerVersions.filter(({ version }) => version === "2.1.2"))(
      "2.1.2 fee commands / chain $chainId",
      ({ address, chainId }) => {
        it.each([false, true])(
          "deducts full-precision output fees (SwapProxy=%s)",
          (viaProxy) => {
            // Encode independently: a 100-token minimum minus a 10% output fee
            // leaves 90 for the user. V3 in 2.1.2 includes minHopPriceX36.
            const swap = encode(
              ["address", "uint256", "uint256", "bytes", "bool", "uint256[]"],
              [
                "0x0000000000000000000000000000000000000002",
                100,
                100,
                encodePacked(
                  { type: "address", value: fromToken },
                  { type: "uint24", value: "3000" },
                  { type: "address", value: toToken }
                )!,
                !viaProxy,
                [0],
              ]
            );
            const inputs = [
              swap,
              encode(
                ["address", "address", "uint256"],
                [
                  toToken,
                  "0x4444444444444444444444444444444444444444",
                  "100000000000000000",
                ]
              ),
              encode(["address", "address", "uint256"], [toToken, sender, 90]),
            ];
            const proxy = new Interface([
              "function execute(address router,address token,uint256 amount,bytes commands,bytes[] inputs,uint256 deadline)",
            ]);
            const data = viaProxy
              ? proxy.encodeFunctionData("execute", [
                  address,
                  fromToken,
                  100,
                  "0x000704",
                  inputs,
                  2000000000,
                ])
              : execute("0x000704", inputs);
            expect(
              decodeCalldata(
                "Uniswap",
                transaction(
                  data,
                  viaProxy
                    ? "0x02E5be68D46DAc0B524905bfF209cf47EE6dB2a9"
                    : address,
                  chainId
                )
              )
            ).toEqual(expected);
          }
        );
      }
    );

    it("still rejects the full-precision fee command on Router 2.0", () => {
      const fee = encode(
        ["address", "address", "uint256"],
        [toToken, sender, "100000000000000000"]
      );
      expect(() =>
        decodeCalldata("Uniswap", transaction(execute("0x07", [fee])))
      ).toThrow("Unsupported command 0x7");
    });

    it("selects the inner router version for SwapProxy calls", () => {
      const proxy = new Interface([
        "function execute(address router,address token,uint256 amount,bytes commands,bytes[] inputs,uint256 deadline)",
      ]);
      const data = proxy.encodeFunctionData("execute", [
        arcRouter,
        fromToken,
        100,
        "0x10",
        [v4Input(true, 0x07, true, true)], // Spend proxy funds, not another user debit.
        2000000000,
      ]);
      expect(
        decodeCalldata(
          "Uniswap",
          transaction(data, "0x02E5be68D46DAc0B524905bfF209cf47EE6dB2a9", 5042)
        )
      ).toEqual(expected);
    });

    it("rejects executeSigned outside the current quote flow", () => {
      const signed = new Interface([
        "function executeSigned(bytes commands,bytes[] inputs,bytes32 intent,bytes32 data,bool verifySender,bytes32 nonce,bytes signature,uint256 deadline)",
      ]);
      const data = signed.encodeFunctionData("executeSigned", [
        "0x00",
        [ammInput],
        "0x" + "01".padStart(64, "0"),
        "0x" + "02".padStart(64, "0"),
        false,
        "0x" + "03".padStart(64, "0"),
        "0x" + "11".repeat(65),
        2000000000,
      ]);
      expect(() =>
        decodeCalldata("Uniswap", transaction(data, arcRouter, 5042))
      ).toThrow("no matching function");
    });

    it("rejects malformed V4 actions", () => {
      const brokenV4 = encode(["bytes", "bytes[]"], ["0x06", ["0x"]]);
      expect(() =>
        decodeCalldata("Uniswap", transaction(execute("0x10", [brokenV4])))
      ).toThrow();
    });

    it("decodes nested sub-plans using the same router version", () => {
      const nested = encode(
        ["bytes", "bytes[]"],
        ["0x10", [v4Input(true, 0x07)]]
      );
      expect(
        decodeCalldata(
          "Uniswap",
          transaction(execute("0x21", [nested]), arcRouter, 5042)
        )
      ).toEqual(expected);
    });

    it.each(routerVersions)(
      "rejects optional sub-plans on Router $version",
      ({ address, chainId, newVersion }) => {
        const nested = encode(
          ["bytes", "bytes[]"],
          ["0x10", [v4Input(newVersion, 0x07)]]
        );
        for (const data of [
          execute("0xa1", [nested]),
          execute("0x21", [encode(["bytes", "bytes[]"], ["0xa1", [nested]])]),
        ]) {
          expect(() =>
            decodeCalldata("Uniswap", transaction(data, address, chainId))
          ).toThrow("Sub-plans with allow-revert are not supported");
        }
      }
    );

    it("rejects command/input length mismatches", () => {
      expect(() =>
        decodeCalldata("Uniswap", transaction(execute("0x0000", [ammInput])))
      ).toThrow("Commands and inputs lengths differ");
    });

    it("skips balance-check parameters while preserving router version restrictions", () => {
      const data = execute("0x0e00", ["0x", ammInput]);
      expect(decodeCalldata("Uniswap", transaction(data))).toEqual(expected);
      expect(() =>
        decodeCalldata("Uniswap", transaction(data, eraRouter, 324))
      ).toThrow("Unsupported command 0xe");
    });
  });

  describe("traditional Router entry points are outside the current quote flow", () => {
    it.each([
      {
        abi:
          "function swapExactETHForTokens(uint256,address[],address,uint256) payable",
        method: "swapExactETHForTokens",
        args: [90, [fromToken, toToken], sender, 2000000000],
      },
      {
        abi:
          "function exactInputSingle(tuple(address,address,uint24,address,uint256,uint256,uint256,uint160))",
        method: "exactInputSingle",
        args: [[fromToken, toToken, 3000, sender, 2000000000, 100, 90, 0]],
      },
      {
        abi:
          "function exactInputSingle(tuple(address,address,uint24,address,uint256,uint256,uint160))",
        method: "exactInputSingle",
        args: [[fromToken, toToken, 3000, sender, 100, 90, 0]],
      },
    ])("rejects $abi", ({ abi, method, args }) => {
      const legacy = new Interface([abi]);
      expect(() =>
        decodeCalldata(
          "Uniswap",
          transaction(legacy.encodeFunctionData(method, args))
        )
      ).toThrow("no matching function");
    });
  });
});

describe("[Uniswap] local decoder supported formats", () => {
  const fromToken = "0x1111111111111111111111111111111111111111";
  const toToken = "0x2222222222222222222222222222222222222222";
  const sender = "0x3333333333333333333333333333333333333333";
  const transaction = (data: string) => ({
    from: sender,
    to: "0x4444444444444444444444444444444444444444",
    value: "0",
    chainId: 1,
    data,
  });
  const expected = {
    fromToken,
    fromTokenAmount: "100",
    toToken,
    minReceiveToTokenAmount: "90",
    toTokenReceiver: sender,
  };

  it("decodes a Uni V3 exact-input command", () => {
    const router = new Interface([
      "function execute(bytes commands, bytes[] inputs, uint256 deadline)",
    ]);
    const input = defaultAbiCoder.encode(
      ["address", "uint256", "uint256", "bytes", "bool"],
      [
        "0x0000000000000000000000000000000000000001",
        100,
        90,
        encodePacked(
          { type: "address", value: fromToken },
          { type: "uint24", value: "3000" },
          { type: "address", value: toToken }
        )!,
        true,
      ]
    );
    const data = router.encodeFunctionData("execute", ["0x00", [input], 1]);

    expect(
      decodeCalldata("Uniswap", {
        ...transaction(data),
        to: "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af",
      })
    ).toEqual(expected);
  });

  it("sums direct parallel V3 exact-input swaps", () => {
    const router = new Interface([
      "function execute(bytes commands,bytes[] inputs,uint256 deadline)",
    ]);
    const inputs = [
      [40, 36],
      [60, 54],
    ].map(([amountIn, amountOut]) =>
      defaultAbiCoder.encode(
        ["address", "uint256", "uint256", "bytes", "bool"],
        [
          sender,
          amountIn,
          amountOut,
          encodePacked(
            { type: "address", value: fromToken },
            { type: "uint24", value: "3000" },
            { type: "address", value: toToken }
          )!,
          true,
        ]
      )
    );
    expect(
      decodeCalldata("Uniswap", {
        ...transaction(
          router.encodeFunctionData("execute", ["0x0000", inputs, 1])
        ),
        to: "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af",
      })
    ).toEqual(expected);
  });

  it("rejects an unresolved dynamic input instead of returning a zero-amount success", () => {
    const router = new Interface([
      "function execute(bytes commands,bytes[] inputs,uint256 deadline)",
    ]);
    const input = defaultAbiCoder.encode(
      ["address", "uint256", "uint256", "bytes", "bool"],
      [
        sender,
        0,
        90,
        encodePacked(
          { type: "address", value: fromToken },
          { type: "uint24", value: "3000" },
          { type: "address", value: toToken }
        )!,
        false,
      ]
    );
    expect(() =>
      decodeCalldata("Uniswap", {
        ...transaction(
          router.encodeFunctionData("execute", ["0x00", [input], 1])
        ),
        to: "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af",
      })
    ).toThrow("Cannot determine the original input amount");
  });
});

describe("[Uniswap] Routes and payments", () => {
  const inputToken = "0x1111111111111111111111111111111111111111";
  const outputToken = "0x2222222222222222222222222222222222222222";
  const sender = "0x3333333333333333333333333333333333333333";
  const intermediateToken = "0x4444444444444444444444444444444444444444";
  // Ethereum V2 pair for intermediateToken / outputToken, independently derived
  // from the official factory and CREATE2 init-code hash.
  const intermediateV2Pair = "0x1b6af76ac6dd76c3894c665f40a817c02fe70b8a";
  const refundReceiver = "0x5555555555555555555555555555555555555555";
  const router = "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af";
  const addressThis = "0x0000000000000000000000000000000000000002";
  const zero = "0x0000000000000000000000000000000000000000";
  const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const contractBalance = "0x8" + "0".repeat(63);
  const encode = defaultAbiCoder.encode.bind(defaultAbiCoder);
  const universal = new Interface([
    "function execute(bytes commands,bytes[] inputs,uint256 deadline)",
  ]);
  const expected = {
    fromToken: inputToken,
    fromTokenAmount: "100",
    toToken: outputToken,
    minReceiveToTokenAmount: "90",
    toTokenReceiver: sender,
  };

  const decode = (data: string, value = "0") => {
    const result = decodeCalldata("Uniswap", {
      data,
      value,
      from: sender,
      to: router,
      chainId: 1,
    });
    return (
      result && {
        ...result,
        fromToken: result.fromToken.toLowerCase(),
        toToken: result.toToken.toLowerCase(),
        toTokenReceiver: result.toTokenReceiver.toLowerCase(),
      }
    );
  };
  const execute = (commands: string, inputs: string[], value = "0") =>
    decode(
      universal.encodeFunctionData("execute", [commands, inputs, 2000000000]),
      value
    );
  const amm = (
    from = inputToken,
    to = outputToken,
    amountIn = "100",
    minimum = "90",
    recipient = addressThis,
    payerIsUser = true
  ) =>
    encode(
      ["address", "uint256", "uint256", "address[]", "bool"],
      [recipient, amountIn, minimum, [from, to], payerIsUser]
    );
  const payment = (token: string, recipient: string, amount: string) =>
    encode(["address", "address", "uint256"], [token, recipient, amount]);
  const v4Plan = (actions: string, inputs: string[]) =>
    encode(["bytes", "bytes[]"], [actions, inputs]);
  const v4Single = (
    from = inputToken,
    to = outputToken,
    amount = "100",
    minimum = "90"
  ) => {
    const zeroForOne = from.toLowerCase() < to.toLowerCase();
    return encode(
      [
        "tuple(tuple(address,address,uint24,int24,address),bool,uint128,uint128,bytes)",
      ],
      [
        [
          [...(zeroForOne ? [from, to] : [to, from]), 3000, 60, zero],
          zeroForOne,
          amount,
          minimum,
          "0x",
        ],
      ]
    );
  };
  const settle = (currency: string, amount = "0", payerIsUser = true) =>
    encode(["address", "uint256", "bool"], [currency, amount, payerIsUser]);

  // Expected values below are literal payment amounts / independently summed
  // user payouts. No expected field is obtained from a production decoder helper.
  describe("Uni payment semantics and complete decoded results", () => {
    it.each([addressThis, router])(
      "ignores UNWRAP paid back to the router (%s)",
      (recipient) => {
        expect(
          execute("0x08040c", [
            amm(),
            payment(outputToken, sender, "90"),
            encode(["address", "uint256"], [recipient, 0]),
          ])
        ).toEqual(expected);
      }
    );

    it.each([
      { recipient: sender, allowed: true },
      {
        recipient: "0x0000000000000000000000000000000000000001",
        allowed: true,
      },
      { recipient: refundReceiver, allowed: false },
    ])(
      "checks the native input refund recipient $recipient",
      ({ recipient, allowed }) => {
        const decode = () =>
          execute(
            "0x0b08040c",
            [
              encode(["address", "uint256"], [addressThis, 100]),
              amm(weth, outputToken, "95", "90", addressThis, false),
              payment(outputToken, sender, "90"),
              encode(["address", "uint256"], [recipient, 0]),
            ],
            "100"
          );
        if (allowed) {
          expect(decode()).toEqual({ ...expected, fromToken: "eth" });
        } else {
          expect(decode).toThrow("Multiple output assets or recipients");
        }
      }
    );

    it("keeps an actual native output and its final recipient", () => {
      expect(
        execute("0x080c", [
          amm(inputToken, weth),
          encode(["address", "uint256"], [sender, 90]),
        ])
      ).toEqual({ ...expected, toToken: "eth" });
    });

    it.each([
      { amount: "70", minimum: "70" },
      { amount: "0", minimum: "0" },
      { amount: contractBalance, minimum: "90" },
    ])("uses the actual TRANSFER amount: $amount", ({ amount, minimum }) => {
      expect(
        execute("0x0805", [amm(), payment(outputToken, sender, amount)])
      ).toEqual({ ...expected, minReceiveToTokenAmount: minimum });
    });

    it.each(["70", "0"])(
      "distinguishes an explicit V4 TAKE from OPEN_DELTA (%s)",
      (amount) => {
        const swap = encode(
          [
            "tuple(tuple(address,address,uint24,int24,address),bool,uint128,uint128,bytes)",
          ],
          [[[inputToken, outputToken, 3000, 60, zero], true, 100, 90, "0x"]]
        );
        const v4 = encode(
          ["bytes", "bytes[]"],
          [
            "0x060b0e0e",
            [
              swap,
              encode(["address", "uint256", "bool"], [inputToken, 100, true]),
              payment(outputToken, sender, amount),
              payment(outputToken, addressThis, "0"),
            ],
          ]
        );
        expect(execute("0x10", [v4])).toEqual({
          ...expected,
          minReceiveToTokenAmount: amount === "0" ? "90" : amount,
        });
      }
    );

    it.each([false, true])(
      "sums direct output across interleaved split routes (direct first: %s)",
      (directFirst) => {
        const direct = amm(inputToken, outputToken, "40", "36", sender);
        const branch = [
          amm(inputToken, intermediateToken, "60", "50"),
          amm(intermediateToken, outputToken, "50", "54", sender, false),
        ];
        expect(
          execute(
            "0x080808",
            directFirst ? [direct, ...branch] : [...branch, direct]
          )
        ).toEqual(expected);
      }
    );

    it.each(["0", contractBalance])(
      "keeps a V4-to-V2 pair handoff out of the final payout (amountIn %s)",
      (amountIn) => {
        const v4 = encode(
          ["bytes", "bytes[]"],
          [
            "0x060b0e",
            [
              encode(
                [
                  "tuple(tuple(address,address,uint24,int24,address),bool,uint128,uint128,bytes)",
                ],
                [
                  [
                    [inputToken, intermediateToken, 3000, 60, zero],
                    true,
                    100,
                    50,
                    "0x",
                  ],
                ]
              ),
              encode(["address", "uint256", "bool"], [inputToken, 100, true]),
              payment(intermediateToken, intermediateV2Pair, "0"),
            ],
          ]
        );
        expect(
          execute("0x1008", [
            v4,
            amm(intermediateToken, outputToken, amountIn, "90", sender, false),
          ])
        ).toEqual(expected);
      }
    );

    it.each(["0", contractBalance])(
      "retains a real external recipient before V2 (amountIn %s)",
      (amountIn) => {
        expect(() =>
          execute("0x0808", [
            amm(inputToken, intermediateToken, "100", "50", refundReceiver),
            amm(intermediateToken, outputToken, amountIn, "90", sender, false),
          ])
        ).toThrow("Multiple output assets or recipients");
      }
    );

    it("does not consume a different token paid to the matching V2 pair", () => {
      expect(() =>
        execute("0x0808", [
          amm(inputToken, weth, "100", "50", intermediateV2Pair),
          amm(
            intermediateToken,
            outputToken,
            contractBalance,
            "90",
            sender,
            false
          ),
        ])
      ).toThrow("Multiple output assets or recipients");
    });

    it("keeps a directly paid branch separate from a later balance transfer", () => {
      expect(
        execute("0x080805", [
          amm(inputToken, outputToken, "40", "36", sender),
          amm(inputToken, outputToken, "60", "54"),
          payment(outputToken, sender, contractBalance),
        ])
      ).toEqual(expected);
    });

    it("does not count a reused router input as another user debit", () => {
      expect(
        execute("0x080808", [
          amm(inputToken, intermediateToken, "100", "80"),
          amm(intermediateToken, inputToken, "80", "60", addressThis, false),
          amm(inputToken, outputToken, "60", "90", sender, false),
        ])
      ).toEqual(expected);
    });

    it("reports multiple final receivers instead of returning just the last one", () => {
      expect(() =>
        execute("0x0808", [
          amm(inputToken, outputToken, "40", "36", sender),
          amm(inputToken, outputToken, "60", "54", refundReceiver),
        ])
      ).toThrow("Multiple output assets or recipients");
    });
  });

  describe("Uni recipient execution context", () => {
    const msgSender = "0x0000000000000000000000000000000000000001";
    const proxyAddress = "0x02e5be68d46dac0b524905bff209cf47ee6db2a9";
    const proxy = new Interface([
      "function execute(address router,address token,uint256 amount,bytes commands,bytes[] inputs,uint256 deadline)",
    ]);
    const transaction = (
      commands: string,
      inputs: string[],
      proxied: boolean
    ) => ({
      from: sender,
      to: proxied ? proxyAddress : router,
      chainId: 1,
      value: "0",
      data: proxied
        ? proxy.encodeFunctionData("execute", [
            router,
            inputToken,
            100,
            commands,
            inputs,
            2000000000,
          ])
        : universal.encodeFunctionData("execute", [
            commands,
            inputs,
            2000000000,
          ]),
    });

    // SwapProxy's official contract requires explicit user recipients:
    // MSG_SENDER resolves to the proxy inside Universal Router execution.
    // https://github.com/Uniswap/universal-router/blob/main/contracts/SwapProxy.sol
    describe.each([
      {
        name: "direct MSG_SENDER",
        proxied: false,
        recipient: msgSender,
        receiver: sender,
      },
      {
        name: "proxy MSG_SENDER",
        proxied: true,
        recipient: msgSender,
        receiver: proxyAddress,
      },
      {
        name: "proxy explicit user",
        proxied: true,
        recipient: sender,
        receiver: sender,
      },
    ])("$name", ({ proxied, recipient, receiver }) => {
      it.each([
        {
          name: "V2 swap",
          commands: "0x08",
          inputs: [
            amm(inputToken, outputToken, "100", "90", recipient, !proxied),
          ],
          toToken: outputToken,
        },
        {
          name: "V3 swap",
          commands: "0x00",
          inputs: [
            encode(
              ["address", "uint256", "uint256", "bytes", "bool"],
              [
                recipient,
                100,
                90,
                encodePacked(
                  { type: "address", value: inputToken },
                  { type: "uint24", value: "3000" },
                  { type: "address", value: outputToken }
                )!,
                !proxied,
              ]
            ),
          ],
          toToken: outputToken,
        },
        ...["SWEEP", "TRANSFER"].map((name) => ({
          name,
          commands: name === "SWEEP" ? "0x0804" : "0x0805",
          inputs: [
            amm(inputToken, outputToken, "100", "90", addressThis, !proxied),
            payment(outputToken, recipient, "90"),
          ],
          toToken: outputToken,
        })),
        {
          name: "UNWRAP_WETH",
          commands: "0x080c",
          inputs: [
            amm(inputToken, weth, "100", "90", addressThis, !proxied),
            encode(["address", "uint256"], [recipient, 90]),
          ],
          toToken: "eth",
        },
        {
          name: "V4 TAKE",
          commands: "0x10",
          inputs: [
            v4Plan("0x060b0e", [
              v4Single(),
              settle(inputToken, "100", !proxied),
              payment(outputToken, recipient, "0"),
            ]),
          ],
          toToken: outputToken,
        },
      ])(
        "resolves $name and verifies the actual recipient",
        ({ commands, inputs, toToken }) => {
          const tx = transaction(commands, inputs, proxied);
          const decoded = decodeCalldata("Uniswap", tx)!;
          expect(decoded).toEqual({
            ...expected,
            toToken,
            toTokenReceiver: receiver,
          });
          expect(
            isSwapCalldataReceiverAllowed(decoded.toTokenReceiver, sender)
          ).toBe(receiver === sender);
        }
      );
    });

    it.each([false, true])(
      "resolves the implicit V4 TAKE_ALL caller (proxy: %s)",
      (proxied) => {
        const tx = transaction(
          "0x10",
          [
            v4Plan("0x060b0f", [
              v4Single(),
              settle(inputToken, "100", !proxied),
              encode(["address", "uint256"], [outputToken, 90]),
            ]),
          ],
          proxied
        );
        expect(decodeCalldata("Uniswap", tx)).toEqual({
          ...expected,
          toTokenReceiver: proxied ? proxyAddress : sender,
        });
      }
    );

    it.each(["router", "pool"])(
      "does not count a %s portion paid to the proxy as user output",
      (source) => {
        const tx =
          source === "router"
            ? transaction(
                "0x080605",
                [
                  amm(
                    inputToken,
                    outputToken,
                    "100",
                    "100",
                    addressThis,
                    false
                  ),
                  payment(outputToken, msgSender, "1000"),
                  payment(outputToken, sender, contractBalance),
                ],
                true
              )
            : transaction(
                "0x10",
                [
                  v4Plan("0x060b100e", [
                    v4Single(inputToken, outputToken, "100", "100"),
                    settle(inputToken, "100", false),
                    payment(outputToken, msgSender, "1000"),
                    payment(outputToken, sender, "0"),
                  ]),
                ],
                true
              );
        expect(decodeCalldata("Uniswap", tx)).toEqual(expected);
      }
    );

    it("does not merge proxy and user payouts into a single user recipient", () => {
      const tx = transaction(
        "0x0808",
        [
          amm(inputToken, outputToken, "40", "36", msgSender, false),
          amm(inputToken, outputToken, "60", "54", sender, false),
        ],
        true
      );
      expect(() => decodeCalldata("Uniswap", tx)).toThrow(
        "Multiple output assets or recipients"
      );
    });
  });

  describe("funding, intermediate balances and final payments", () => {
    it("does not silently omit a second user-funded input asset", () => {
      expect(() =>
        execute("0x0808", [
          amm(inputToken, outputToken, "40", "36", sender),
          amm(intermediateToken, outputToken, "60", "54", sender),
        ])
      ).toThrow("Multiple user-funded input assets");
    });

    it("rejects another direct user debit after a prepaid native input", () => {
      expect(() =>
        execute(
          "0x0b08",
          [
            encode(["address", "uint256"], [addressThis, 100]),
            amm(weth, outputToken, "100", "90", sender, true),
          ],
          "100"
        )
      ).toThrow("Additional user-funded debit");
    });

    it("retains the complete native input across two separate wraps", () => {
      expect(
        execute(
          "0x0b080b0804",
          [
            encode(["address", "uint256"], [addressThis, 40]),
            amm(weth, outputToken, "40", "36", addressThis, false),
            encode(["address", "uint256"], [addressThis, 60]),
            amm(weth, outputToken, "60", "54", addressThis, false),
            payment(outputToken, sender, "90"),
          ],
          "100"
        )
      ).toEqual({ ...expected, fromToken: "eth" });
    });

    it("subtracts a fee before a router-balance transfer", () => {
      expect(
        execute("0x080605", [
          amm(inputToken, outputToken, "100", "100"),
          payment(outputToken, refundReceiver, "1000"),
          payment(outputToken, sender, contractBalance),
        ])
      ).toEqual(expected);
    });

    it("counts a portion paid to the user as part of the final output", () => {
      expect(
        execute("0x080605", [
          amm(inputToken, outputToken, "100", "100"),
          payment(outputToken, sender, "1000"),
          payment(outputToken, sender, contractBalance),
        ])
      ).toEqual({ ...expected, minReceiveToTokenAmount: "100" });
    });

    it("keeps a portion of the prepaid input returned to the user as a refund", () => {
      const proxy = new Interface([
        "function execute(address router,address token,uint256 amount,bytes commands,bytes[] inputs,uint256 deadline)",
      ]);
      expect(
        decodeCalldata("Uniswap", {
          from: sender,
          to: "0x02E5be68D46DAc0B524905bfF209cf47EE6dB2a9",
          chainId: 1,
          value: "0",
          data: proxy.encodeFunctionData("execute", [
            router,
            inputToken,
            100,
            "0x080604",
            [
              amm(inputToken, outputToken, "80", "90", addressThis, false),
              payment(inputToken, sender, "5000"),
              payment(outputToken, sender, "90"),
            ],
            2000000000,
          ]),
        })
      ).toEqual(expected);
    });

    it.each(["04", "05"])(
      "checks the recipient of proxy input refunds (command 0x%s)",
      (command) => {
        const proxy = new Interface([
          "function execute(address router,address token,uint256 amount,bytes commands,bytes[] inputs,uint256 deadline)",
        ]);
        const decode = (recipient: string) =>
          decodeCalldata("Uniswap", {
            from: sender,
            to: "0x02E5be68D46DAc0B524905bfF209cf47EE6dB2a9",
            chainId: 1,
            value: "0",
            data: proxy.encodeFunctionData("execute", [
              router,
              inputToken,
              100,
              `0x08${command}`,
              [
                amm(inputToken, outputToken, "95", "90", sender, false),
                payment(inputToken, recipient, "5"),
              ],
              2000000000,
            ]),
          });
        expect(decode(sender)).toEqual(expected);
        for (const recipient of [
          refundReceiver,
          "0x0000000000000000000000000000000000000001",
        ]) {
          expect(() => decode(recipient)).toThrow(
            "Multiple output assets or recipients"
          );
        }
      }
    );

    it.each(["0", "5"])(
      "rejects V4 input refunds to a third party (TAKE amount %s)",
      (amount) => {
        expect(() =>
          execute(
            "0x10",
            [
              v4Plan("0x060b0e0e", [
                v4Single(zero, outputToken, "95", "90"),
                settle(zero, "100"),
                payment(zero, refundReceiver, amount),
                payment(outputToken, sender, "0"),
              ]),
            ],
            "100"
          )
        ).toThrow("Multiple output assets or recipients");
      }
    );

    it("does not take the same V4 pool credit twice after moving it to the router", () => {
      expect(
        execute("0x10", [
          v4Plan("0x060b0e0e", [
            v4Single(),
            settle(inputToken, "100"),
            payment(outputToken, addressThis, "0"),
            payment(outputToken, sender, "0"),
          ]),
        ])
      ).toEqual({ ...expected, minReceiveToTokenAmount: "0" });
    });

    it("subtracts a pool-credit portion before taking the remaining output", () => {
      expect(
        execute("0x10", [
          v4Plan("0x060b100e", [
            v4Single(inputToken, outputToken, "100", "100"),
            settle(inputToken, "100"),
            payment(outputToken, refundReceiver, "1000"),
            payment(outputToken, sender, "0"),
          ]),
        ])
      ).toEqual(expected);
    });

    it("retains a fixed prepaid budget when V4 returns and reuses the input asset", () => {
      const plan = v4Plan("0x0606060b0e", [
        v4Single(inputToken, intermediateToken, "100", "80"),
        v4Single(intermediateToken, inputToken, "0", "60"),
        v4Single(inputToken, outputToken, "60", "90"),
        settle(inputToken, "100", false),
        payment(outputToken, sender, "0"),
      ]);
      const proxy = new Interface([
        "function execute(address router,address token,uint256 amount,bytes commands,bytes[] inputs,uint256 deadline)",
      ]);
      expect(
        decodeCalldata("Uniswap", {
          from: sender,
          to: "0x02E5be68D46DAc0B524905bfF209cf47EE6dB2a9",
          chainId: 1,
          value: "0",
          data: proxy.encodeFunctionData("execute", [
            router,
            inputToken,
            100,
            "0x10",
            [plan],
            2000000000,
          ]),
        })
      ).toEqual(expected);
    });

    it("rejects state-dependent net input when V4 returns the input asset without prepayment", () => {
      expect(() =>
        execute("0x10", [
          v4Plan("0x06060b0e", [
            v4Single(inputToken, intermediateToken, "100", "80"),
            v4Single(intermediateToken, inputToken, "0", "60"),
            settle(inputToken, "0"),
            payment(inputToken, sender, "0"),
          ]),
        ])
      ).toThrow("net user input depends on pool deltas");
    });

    it("supports a fixed user settlement before the OPEN_DELTA swap", () => {
      expect(
        execute("0x10", [
          v4Plan("0x0b060e", [
            settle(inputToken, "100"),
            v4Single(inputToken, outputToken, "0", "90"),
            payment(outputToken, sender, "0"),
          ]),
        ])
      ).toEqual(expected);
    });

    it("sums separate user-funded roots even when the first debt was already settled", () => {
      expect(
        execute("0x1005", [
          v4Plan("0x060b0e060b0e", [
            v4Single(inputToken, outputToken, "40", "36"),
            settle(inputToken, "40"),
            payment(outputToken, addressThis, "0"),
            v4Single(inputToken, outputToken, "60", "54"),
            settle(inputToken, "60"),
            payment(outputToken, sender, "0"),
          ]),
          payment(outputToken, sender, contractBalance),
        ])
      ).toEqual(expected);
    });

    it("does not use a router balance as V4 OPEN_DELTA pool credit", () => {
      expect(() =>
        execute("0x0810", [
          amm(inputToken, intermediateToken, "100", "80"),
          v4Plan("0x060b0e", [
            v4Single(intermediateToken, outputToken, "0", "90"),
            settle(intermediateToken, "0", false),
            payment(outputToken, sender, "0"),
          ]),
        ])
      ).toThrow("OPEN_DELTA input has no preceding pool credit");
    });

    it("keeps a real external payout when a later router-funded V3 swap reuses that asset", () => {
      expect(() =>
        execute("0x1000", [
          v4Plan("0x060b0e", [
            v4Single(inputToken, intermediateToken, "100", "50"),
            settle(inputToken, "100"),
            payment(intermediateToken, refundReceiver, "0"),
          ]),
          encode(
            ["address", "uint256", "uint256", "bytes", "bool"],
            [
              sender,
              50,
              90,
              encodePacked(
                { type: "address", value: intermediateToken },
                { type: "uint24", value: "3000" },
                { type: "address", value: outputToken }
              )!,
              false,
            ]
          ),
        ])
      ).toThrow("Multiple output assets or recipients");
    });

    it.each([
      ["0x0d", encode(["address", "address"], [inputToken, outputToken])],
      [
        "0x11",
        encode(
          ["address", "address", "address"],
          [inputToken, outputToken, sender]
        ),
      ],
      ["0x12", encode(["address"], [outputToken])],
      ["0x14", encode(["address", "address"], [outputToken, sender])],
      ["0x16", encode(["uint256"], [0])],
    ])(
      "rejects unmodeled V4 payment action %s instead of ignoring it",
      (action, data) => {
        expect(() =>
          execute("0x10", [
            v4Plan(`0x060b${action.slice(2)}`, [
              v4Single(),
              settle(inputToken, "100"),
              data,
            ]),
          ])
        ).toThrow("Unsupported V4 action");
      }
    );
  });

  describe("Arc native precision", () => {
    it("keeps exact native amounts and limits truncation to Arc native USDC", () => {
      const requested = "19977999999999998249";
      const truncated = "19977999000000000000";
      const decoded = {
        ...expected,
        fromToken: "arc",
        fromTokenAmount: truncated,
      };
      expect(getComparableUniInputAmount(requested, decoded, 5042, "arc")).toBe(
        truncated
      );
      expect(getComparableUniInputAmount(requested, decoded, 1, "arc")).toBe(
        requested
      );
      expect(
        getComparableUniInputAmount(
          requested,
          { ...decoded, fromToken: inputToken },
          5042,
          "arc"
        )
      ).toBe(requested);
      expect(
        getComparableUniInputAmount(
          requested,
          { ...decoded, fromTokenAmount: requested },
          5042,
          "arc"
        )
      ).toBe(requested);
    });
  });
});

describe("Recipients", () => {
  const USER = "0x1111111111111111111111111111111111111111";
  const ATTACKER = "0x2222222222222222222222222222222222222222";
  const TOKEN_IN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const TOKEN_OUT = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const ETH_NATIVE = CHAINS[CHAINS_ENUM.ETH].nativeTokenAddress;
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const MSG_SENDER = "0x0000000000000000000000000000000000000001";
  const ADDRESS_THIS = "0x0000000000000000000000000000000000000002";
  const uniInterface = new Interface(UniABI);
  const magpieInterface = new Interface(MagpieABI);
  const encodeV3Path = (tokenA: string, fee: number, tokenB: string) =>
    "0x" +
    tokenA.replace(/^0x/, "").toLowerCase() +
    fee.toString(16).padStart(6, "0") +
    tokenB.replace(/^0x/, "").toLowerCase();

  const encodeUniV3ExactIn = (recipient: string, from = USER) => {
    const input = defaultAbiCoder.encode(
      ["address", "uint256", "uint256", "bytes", "bool"],
      [recipient, "1000", "900", encodeV3Path(TOKEN_IN, 3000, TOKEN_OUT), true]
    );
    return {
      from,
      to: "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af",
      data: uniInterface.encodeFunctionData("execute(bytes,bytes[],uint256)", [
        "0x00",
        [input],
        9999999999,
      ]),
      value: "0x0",
      chainId: 1,
    };
  };

  const encodeUniUnwrap = (recipient: string) => {
    const swapInput = defaultAbiCoder.encode(
      ["address", "uint256", "uint256", "bytes", "bool"],
      [ADDRESS_THIS, "1000", "900", encodeV3Path(TOKEN_IN, 3000, WETH), true]
    );
    const unwrapInput = defaultAbiCoder.encode(
      ["address", "uint256"],
      [recipient, "800"]
    );
    return {
      from: USER,
      to: "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af",
      data: uniInterface.encodeFunctionData("execute(bytes,bytes[],uint256)", [
        "0x000c",
        [swapInput, unwrapInput],
        9999999999,
      ]),
      value: "0x0",
      chainId: 1,
    };
  };

  const encodeUniSwapProxy = (recipient: string) => {
    const input = defaultAbiCoder.encode(
      ["address", "uint256", "uint256", "bytes", "bool"],
      [recipient, "1000", "900", encodeV3Path(TOKEN_IN, 3000, TOKEN_OUT), false]
    );
    return {
      from: USER,
      to: DEX_ROUTER_WHITELIST[DEX_ENUM.UNI][CHAINS_ENUM.ETH],
      data: uniInterface.encodeFunctionData(
        "execute(address,address,uint256,bytes,bytes[],uint256)",
        [
          "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af",
          TOKEN_IN,
          "1000",
          "0x00",
          [input],
          9999999999,
        ]
      ),
      value: "0x0",
      chainId: 1,
    };
  };

  const encodeUniV4Take = (recipient: string) => {
    const swapParams = defaultAbiCoder.encode(
      [
        "tuple(tuple(address,address,uint24,int24,address),bool,uint128,uint128,bytes)",
      ],
      [
        [
          [TOKEN_IN, TOKEN_OUT, 3000, 60, NULL_ADDRESS],
          true,
          "1000",
          "900",
          "0x",
        ],
      ]
    );
    const takeParams = defaultAbiCoder.encode(
      ["address", "address", "uint256"],
      [TOKEN_OUT, recipient, 0]
    );
    const v4Input = defaultAbiCoder.encode(
      ["bytes", "bytes[]"],
      [
        "0x060b0e",
        [
          swapParams,
          defaultAbiCoder.encode(
            ["address", "uint256", "bool"],
            [TOKEN_IN, "1000", true]
          ),
          takeParams,
        ],
      ]
    );
    return {
      from: USER,
      to: "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af",
      data: uniInterface.encodeFunctionData("execute(bytes,bytes[],uint256)", [
        "0x10",
        [v4Input],
        9999999999,
      ]),
      value: "0x0",
      chainId: 1,
    };
  };

  const encodeMagpieSwap = ({
    toAddress,
    fromAsset = TOKEN_IN,
    toAsset = TOKEN_OUT,
    amountIn = "1000",
    amountOutMin = "900",
    feeAsset,
    feeAmount = "0",
    from = USER,
  }: {
    toAddress: string;
    fromAsset?: string;
    toAsset?: string;
    amountIn?: string;
    amountOutMin?: string;
    feeAsset?: string;
    feeAmount?: string;
    from?: string;
  }) => {
    const packed = Buffer.alloc(feeAsset ? 352 : 320);
    const writeAddr = (offset: number, addr: string) => {
      Buffer.from(addr.replace(/^0x/, "").padStart(40, "0"), "hex").copy(
        packed,
        offset
      );
    };
    const writeU256 = (offset: number, value: string) => {
      Buffer.from(
        new Decimal(value).toString(16).padStart(64, "0"),
        "hex"
      ).copy(packed, offset);
    };
    writeAddr(4, toAddress);
    writeAddr(24, fromAsset);
    writeAddr(44, toAsset);

    // DexAggregator stores amountIn directly at absolute offset 132.
    // The output minimum uses a compact descriptor at offsets 167 / 168.
    writeU256(64, amountIn);
    packed.writeUInt16BE(68 + 224, 100);
    writeU256(224, amountOutMin);

    if (feeAsset) {
      packed[206] = 1; // One fee, followed by asset / receiver / amount descriptors.
      packed[207] = 96;
      packed.writeUInt16BE(68 + 256, 208);
      packed[210] = 96;
      packed.writeUInt16BE(68 + 276, 211);
      packed.writeUInt16BE(68 + 296, 214);
      writeAddr(256, feeAsset);
      writeAddr(276, ATTACKER);
      writeU256(296, feeAmount);
    }

    return {
      from,
      to: "0x20F6ee51340aDEed01A59B0e65cB3703f3dc860c",
      data: magpieInterface.encodeFunctionData("swapWithBackendSignature", [
        "0x" + packed.toString("hex"),
      ]),
      value: isSameAddress(fromAsset, NULL_ADDRESS)
        ? new Decimal(amountIn)
            .plus(isSameAddress(feeAsset || "", NULL_ADDRESS) ? feeAmount : "0")
            .toFixed(0)
        : "0",
      chainId: 1,
    };
  };

  describe("[Uniswap] Uni calldata receiver", () => {
    it("returns the encoded V3 recipient instead of tx.from", () => {
      const res = decodeCalldata(DEX_ENUM.UNI, encodeUniV3ExactIn(ATTACKER));

      expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
      expect(isSameAddress(res!.fromToken, TOKEN_IN)).toBe(true);
      expect(res!.fromTokenAmount).toBe("1000");
      expect(isSameAddress(res!.toToken, TOKEN_OUT)).toBe(true);
      expect(res!.minReceiveToTokenAmount).toBe("900");
      expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
        false
      );
    });

    it("maps MSG_SENDER to tx.from", () => {
      const res = decodeCalldata(DEX_ENUM.UNI, encodeUniV3ExactIn(MSG_SENDER));

      expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
      expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
        true
      );
    });

    it("uses UNWRAP_WETH recipient after a swap to the router", () => {
      const res = decodeCalldata(DEX_ENUM.UNI, encodeUniUnwrap(ATTACKER));

      expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
      expect(isSameAddress(res!.toToken, ETH_NATIVE)).toBe(true);
      expect(res!.minReceiveToTokenAmount).toBe("800");
      expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
        false
      );
    });

    it("keeps native fromToken after WRAP_ETH plus a WETH path swap", () => {
      const wrapInput = defaultAbiCoder.encode(
        ["address", "uint256"],
        [ADDRESS_THIS, "1000"]
      );
      const swapInput = defaultAbiCoder.encode(
        ["address", "uint256", "uint256", "bytes", "bool"],
        [ATTACKER, "1000", "900", encodeV3Path(WETH, 3000, TOKEN_IN), false]
      );
      const res = decodeCalldata(DEX_ENUM.UNI, {
        from: USER,
        to: "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af",
        data: uniInterface.encodeFunctionData(
          "execute(bytes,bytes[],uint256)",
          ["0x0b00", [wrapInput, swapInput], 9999999999]
        ),
        value: "1000",
        chainId: 1,
      });

      expect(isSameAddress(res!.fromToken, ETH_NATIVE)).toBe(true);
      expect(isSameAddress(res!.toToken, TOKEN_IN)).toBe(true);
      expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
      expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
        false
      );
    });

    it("decodes SwapProxy execute the same way", () => {
      const res = decodeCalldata(DEX_ENUM.UNI, encodeUniSwapProxy(ATTACKER));

      expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
      expect(isSameAddress(res!.fromToken, TOKEN_IN)).toBe(true);
      expect(res!.fromTokenAmount).toBe("1000");
      expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
        false
      );
    });

    it("returns the V4 TAKE recipient", () => {
      const res = decodeCalldata(DEX_ENUM.UNI, encodeUniV4Take(ATTACKER));

      expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
      expect(isSameAddress(res!.fromToken, TOKEN_IN)).toBe(true);
      expect(isSameAddress(res!.toToken, TOKEN_OUT)).toBe(true);
      expect(res!.minReceiveToTokenAmount).toBe("900");
      expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
        false
      );
    });
  });

  describe("[Magpie] Magpie fee assets", () => {
    it.each([
      {
        fromAsset: NULL_ADDRESS,
        feeAsset: NULL_ADDRESS,
        feeAmount: "10",
        payment: "1010",
        allowed: true,
      },
      {
        fromAsset: TOKEN_IN,
        feeAsset: TOKEN_IN,
        feeAmount: "10",
        payment: "1010",
        allowed: true,
      },
      {
        fromAsset: NULL_ADDRESS,
        feeAsset: TOKEN_IN,
        feeAmount: "10",
        payment: "1000",
        allowed: false,
      },
      {
        fromAsset: TOKEN_IN,
        feeAsset: NULL_ADDRESS,
        feeAmount: "10",
        payment: "1000",
        allowed: false,
      },
      {
        fromAsset: TOKEN_IN,
        feeAsset: WETH,
        feeAmount: "10",
        payment: "1000",
        allowed: false,
      },
      {
        fromAsset: TOKEN_IN,
        feeAsset: WETH,
        feeAmount: "0",
        payment: "1000",
        allowed: true,
      },
      {
        fromAsset: NULL_ADDRESS,
        feeAsset: TOKEN_IN,
        feeAmount: "0",
        payment: "1000",
        allowed: true,
      },
    ])(
      "checks $feeAmount fee in $feeAsset for input $fromAsset",
      ({ fromAsset, feeAsset, feeAmount, payment, allowed }) => {
        const tx = encodeMagpieSwap({
          toAddress: USER,
          fromAsset,
          feeAsset,
          feeAmount,
        });
        expect(
          verifyCalldata({
            dexId: DEX_ENUM.MAGPIE,
            tx,
            slippage: "0.1",
            data: {
              tx,
              fromToken: fromAsset === NULL_ADDRESS ? ETH_NATIVE : fromAsset,
              fromTokenAmount: payment,
              toToken: TOKEN_OUT,
              toTokenAmount: "1000",
              spender: tx.to,
            },
          })
        ).toBe(allowed);
      }
    );
  });

  describe("[Magpie] Magpie calldata receiver", () => {
    it("returns the packed toAddress instead of tx.from", () => {
      const res = decodeCalldata(
        DEX_ENUM.MAGPIE,
        encodeMagpieSwap({ toAddress: ATTACKER })
      );

      expect(isSameAddress(res!.toTokenReceiver, ATTACKER)).toBe(true);
      expect(isSameAddress(res!.fromToken, TOKEN_IN)).toBe(true);
      expect(res!.fromTokenAmount).toBe("1000");
      expect(isSameAddress(res!.toToken, TOKEN_OUT)).toBe(true);
      expect(res!.minReceiveToTokenAmount).toBe("900");
      expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
        false
      );
    });

    it("returns the current account when it is the packed toAddress", () => {
      const res = decodeCalldata(
        DEX_ENUM.MAGPIE,
        encodeMagpieSwap({ toAddress: USER })
      );

      expect(isSameAddress(res!.toTokenReceiver, USER)).toBe(true);
      expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
        true
      );
    });

    it("preserves the literal zero-address Magpie recipient", () => {
      const res = decodeCalldata(
        DEX_ENUM.MAGPIE,
        encodeMagpieSwap({ toAddress: NULL_ADDRESS })
      );

      expect(isSameAddress(res!.toTokenReceiver, NULL_ADDRESS)).toBe(true);
      expect(isSwapCalldataReceiverAllowed(res!.toTokenReceiver, USER)).toBe(
        true
      );
    });

    it("maps native asset address(0) to the chain native token", () => {
      const res = decodeCalldata(
        DEX_ENUM.MAGPIE,
        encodeMagpieSwap({
          toAddress: USER,
          fromAsset: NULL_ADDRESS,
          toAsset: NULL_ADDRESS,
        })
      );

      expect(isSameAddress(res!.fromToken, ETH_NATIVE)).toBe(true);
      expect(isSameAddress(res!.toToken, ETH_NATIVE)).toBe(true);
    });
  });
});
