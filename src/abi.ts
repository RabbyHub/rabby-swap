export const OneInchABI = [
  {
    inputs: [
      {
        internalType: "contract IAggregationExecutor",
        name: "executor",
        type: "address",
      },
      {
        components: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address",
          },
          {
            internalType: "contract IERC20",
            name: "dstToken",
            type: "address",
          },
          {
            internalType: "address payable",
            name: "srcReceiver",
            type: "address",
          },
          {
            internalType: "address payable",
            name: "dstReceiver",
            type: "address",
          },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "minReturnAmount", type: "uint256" },
          { internalType: "uint256", name: "flags", type: "uint256" },
        ],
        internalType: "struct GenericRouter.SwapDescription",
        name: "desc",
        type: "tuple",
      },
      { internalType: "bytes", name: "permit", type: "bytes" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "swap",
    outputs: [
      { internalType: "uint256", name: "returnAmount", type: "uint256" },
      { internalType: "uint256", name: "spentAmount", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "minReturn", type: "uint256" },
      { internalType: "uint256[]", name: "pools", type: "uint256[]" },
    ],
    name: "uniswapV3Swap",
    outputs: [
      { internalType: "uint256", name: "returnAmount", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address payable", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "minReturn", type: "uint256" },
      { internalType: "uint256[]", name: "pools", type: "uint256[]" },
    ],
    name: "uniswapV3SwapTo",
    outputs: [
      { internalType: "uint256", name: "returnAmount", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract IERC20", name: "srcToken", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "minReturn", type: "uint256" },
      { internalType: "uint256[]", name: "pools", type: "uint256[]" },
    ],
    name: "unoswap",
    outputs: [
      { internalType: "uint256", name: "returnAmount", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address payable", name: "recipient", type: "address" },
      { internalType: "contract IERC20", name: "srcToken", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "minReturn", type: "uint256" },
      { internalType: "uint256[]", name: "pools", type: "uint256[]" },
    ],
    name: "unoswapTo",
    outputs: [
      { internalType: "uint256", name: "returnAmount", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
];

export const ZeroXABI = [
  {
    inputs: [
      {
        name: "inputToken",
        type: "address",
      },
      {
        name: "outputToken",
        type: "address",
      },
      {
        name: "inputTokenAmount",
        type: "uint256",
      },
      {
        name: "minOutputTokenAmount",
        type: "uint256",
      },
      {
        name: "transformations",
        type: "(uint32,bytes)[]",
        components: [
          {
            name: "deploymentNonce",
            type: "uint32",
          },
          {
            name: "data",
            type: "bytes",
          },
        ],
      },
    ],
    name: "transformERC20",
    outputs: [
      {
        name: "outputTokenAmount",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
];

export const ParaSwapABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "fromToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "toAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expectedAmount",
            type: "uint256",
          },
          {
            internalType: "address payable",
            name: "beneficiary",
            type: "address",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "fromAmountPercent",
                type: "uint256",
              },
              {
                components: [
                  {
                    internalType: "address",
                    name: "to",
                    type: "address",
                  },
                  {
                    internalType: "uint256",
                    name: "totalNetworkFee",
                    type: "uint256",
                  },
                  {
                    components: [
                      {
                        internalType: "address payable",
                        name: "adapter",
                        type: "address",
                      },
                      {
                        internalType: "uint256",
                        name: "percent",
                        type: "uint256",
                      },
                      {
                        internalType: "uint256",
                        name: "networkFee",
                        type: "uint256",
                      },
                      {
                        components: [
                          {
                            internalType: "uint256",
                            name: "index",
                            type: "uint256",
                          },
                          {
                            internalType: "address",
                            name: "targetExchange",
                            type: "address",
                          },
                          {
                            internalType: "uint256",
                            name: "percent",
                            type: "uint256",
                          },
                          {
                            internalType: "bytes",
                            name: "payload",
                            type: "bytes",
                          },
                          {
                            internalType: "uint256",
                            name: "networkFee",
                            type: "uint256",
                          },
                        ],
                        internalType: "struct Utils.Route[]",
                        name: "route",
                        type: "tuple[]",
                      },
                    ],
                    internalType: "struct Utils.Adapter[]",
                    name: "adapters",
                    type: "tuple[]",
                  },
                ],
                internalType: "struct Utils.Path[]",
                name: "path",
                type: "tuple[]",
              },
            ],
            internalType: "struct Utils.MegaSwapPath[]",
            name: "path",
            type: "tuple[]",
          },
          {
            internalType: "address payable",
            name: "partner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "feePercent",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "permit",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "bytes16",
            name: "uuid",
            type: "bytes16",
          },
        ],
        internalType: "struct Utils.MegaSwapSellData",
        name: "data",
        type: "tuple",
      },
    ],
    name: "megaSwap",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "fromToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "toAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expectedAmount",
            type: "uint256",
          },
          {
            internalType: "address payable",
            name: "beneficiary",
            type: "address",
          },
          {
            components: [
              {
                internalType: "address",
                name: "to",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "totalNetworkFee",
                type: "uint256",
              },
              {
                components: [
                  {
                    internalType: "address payable",
                    name: "adapter",
                    type: "address",
                  },
                  {
                    internalType: "uint256",
                    name: "percent",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "networkFee",
                    type: "uint256",
                  },
                  {
                    components: [
                      {
                        internalType: "uint256",
                        name: "index",
                        type: "uint256",
                      },
                      {
                        internalType: "address",
                        name: "targetExchange",
                        type: "address",
                      },
                      {
                        internalType: "uint256",
                        name: "percent",
                        type: "uint256",
                      },
                      {
                        internalType: "bytes",
                        name: "payload",
                        type: "bytes",
                      },
                      {
                        internalType: "uint256",
                        name: "networkFee",
                        type: "uint256",
                      },
                    ],
                    internalType: "struct Utils.Route[]",
                    name: "route",
                    type: "tuple[]",
                  },
                ],
                internalType: "struct Utils.Adapter[]",
                name: "adapters",
                type: "tuple[]",
              },
            ],
            internalType: "struct Utils.Path[]",
            name: "path",
            type: "tuple[]",
          },
          {
            internalType: "address payable",
            name: "partner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "feePercent",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "permit",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "bytes16",
            name: "uuid",
            type: "bytes16",
          },
        ],
        internalType: "struct Utils.SellData",
        name: "data",
        type: "tuple",
      },
    ],
    name: "multiSwap",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "fromToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "toToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "toAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expectedAmount",
            type: "uint256",
          },
          {
            internalType: "address[]",
            name: "callees",
            type: "address[]",
          },
          {
            internalType: "bytes",
            name: "exchangeData",
            type: "bytes",
          },
          {
            internalType: "uint256[]",
            name: "startIndexes",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "values",
            type: "uint256[]",
          },
          {
            internalType: "address payable",
            name: "beneficiary",
            type: "address",
          },
          {
            internalType: "address payable",
            name: "partner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "feePercent",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "permit",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "bytes16",
            name: "uuid",
            type: "bytes16",
          },
        ],
        internalType: "struct Utils.SimpleData",
        name: "data",
        type: "tuple",
      },
    ],
    name: "simpleSwap",
    outputs: [
      {
        internalType: "uint256",
        name: "receivedAmount",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
];

export const OpenOceanABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "srcToken",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IERC20",
        name: "dstToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "dstReceiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "spentAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "returnAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minReturnAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "guaranteedAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "referrer",
        type: "address",
      },
    ],
    name: "Swapped",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract IERC20", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "rescueFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IOpenOceanCaller",
        name: "caller",
        type: "address",
      },
      {
        components: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address",
          },
          {
            internalType: "contract IERC20",
            name: "dstToken",
            type: "address",
          },
          { internalType: "address", name: "srcReceiver", type: "address" },
          { internalType: "address", name: "dstReceiver", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "minReturnAmount", type: "uint256" },
          {
            internalType: "uint256",
            name: "guaranteedAmount",
            type: "uint256",
          },
          { internalType: "uint256", name: "flags", type: "uint256" },
          { internalType: "address", name: "referrer", type: "address" },
          { internalType: "bytes", name: "permit", type: "bytes" },
        ],
        internalType: "struct OpenOceanExchange.SwapDescription",
        name: "desc",
        type: "tuple",
      },
      {
        components: [
          { internalType: "uint256", name: "target", type: "uint256" },
          { internalType: "uint256", name: "gasLimit", type: "uint256" },
          { internalType: "uint256", name: "value", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        internalType: "struct IOpenOceanCaller.CallDescription[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "swap",
    outputs: [
      { internalType: "uint256", name: "returnAmount", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const UniswapABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes",
            name: "path",
            type: "bytes",
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountIn",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountOutMinimum",
            type: "uint256",
          },
        ],
        internalType: "struct ISwapRouter.ExactInputParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInput",
    outputs: [
      {
        internalType: "uint256",
        name: "amountOut",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
    ],
    name: "multicall",
    outputs: [
      {
        internalType: "bytes[]",
        name: "results",
        type: "bytes[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountMinimum",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "unwrapWETH9",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

export const KyberswapABI = [
  {
    inputs: [{ internalType: "address", name: "_WETH", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes",
        name: "clientData",
        type: "bytes",
      },
    ],
    name: "ClientData",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "Error",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "pair",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountOut",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "output",
        type: "address",
      },
    ],
    name: "Exchange",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalFee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "recipients",
        type: "address[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      { indexed: false, internalType: "bool", name: "isBps", type: "bool" },
    ],
    name: "Fee",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "srcToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "dstToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "dstReceiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "spentAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "returnAmount",
        type: "uint256",
      },
    ],
    name: "Swapped",
    type: "event",
  },
  {
    inputs: [],
    name: "WETH",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isWhitelist",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "rescueFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "callTarget", type: "address" },
          { internalType: "address", name: "approveTarget", type: "address" },
          { internalType: "bytes", name: "targetData", type: "bytes" },
          {
            components: [
              {
                internalType: "contract IERC20",
                name: "srcToken",
                type: "address",
              },
              {
                internalType: "contract IERC20",
                name: "dstToken",
                type: "address",
              },
              {
                internalType: "address[]",
                name: "srcReceivers",
                type: "address[]",
              },
              {
                internalType: "uint256[]",
                name: "srcAmounts",
                type: "uint256[]",
              },
              {
                internalType: "address[]",
                name: "feeReceivers",
                type: "address[]",
              },
              {
                internalType: "uint256[]",
                name: "feeAmounts",
                type: "uint256[]",
              },
              { internalType: "address", name: "dstReceiver", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "uint256",
                name: "minReturnAmount",
                type: "uint256",
              },
              { internalType: "uint256", name: "flags", type: "uint256" },
              { internalType: "bytes", name: "permit", type: "bytes" },
            ],
            internalType: "struct MetaAggregationRouterV2.SwapDescriptionV2",
            name: "desc",
            type: "tuple",
          },
          { internalType: "bytes", name: "clientData", type: "bytes" },
        ],
        internalType: "struct MetaAggregationRouterV2.SwapExecutionParams",
        name: "execution",
        type: "tuple",
      },
    ],
    name: "swap",
    outputs: [
      { internalType: "uint256", name: "returnAmount", type: "uint256" },
      { internalType: "uint256", name: "gasUsed", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "callTarget", type: "address" },
          { internalType: "address", name: "approveTarget", type: "address" },
          { internalType: "bytes", name: "targetData", type: "bytes" },
          {
            components: [
              {
                internalType: "contract IERC20",
                name: "srcToken",
                type: "address",
              },
              {
                internalType: "contract IERC20",
                name: "dstToken",
                type: "address",
              },
              {
                internalType: "address[]",
                name: "srcReceivers",
                type: "address[]",
              },
              {
                internalType: "uint256[]",
                name: "srcAmounts",
                type: "uint256[]",
              },
              {
                internalType: "address[]",
                name: "feeReceivers",
                type: "address[]",
              },
              {
                internalType: "uint256[]",
                name: "feeAmounts",
                type: "uint256[]",
              },
              { internalType: "address", name: "dstReceiver", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "uint256",
                name: "minReturnAmount",
                type: "uint256",
              },
              { internalType: "uint256", name: "flags", type: "uint256" },
              { internalType: "bytes", name: "permit", type: "bytes" },
            ],
            internalType: "struct MetaAggregationRouterV2.SwapDescriptionV2",
            name: "desc",
            type: "tuple",
          },
          { internalType: "bytes", name: "clientData", type: "bytes" },
        ],
        internalType: "struct MetaAggregationRouterV2.SwapExecutionParams",
        name: "execution",
        type: "tuple",
      },
    ],
    name: "swapGeneric",
    outputs: [
      { internalType: "uint256", name: "returnAmount", type: "uint256" },
      { internalType: "uint256", name: "gasUsed", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IAggregationExecutor",
        name: "caller",
        type: "address",
      },
      {
        components: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address",
          },
          {
            internalType: "contract IERC20",
            name: "dstToken",
            type: "address",
          },
          {
            internalType: "address[]",
            name: "srcReceivers",
            type: "address[]",
          },
          { internalType: "uint256[]", name: "srcAmounts", type: "uint256[]" },
          {
            internalType: "address[]",
            name: "feeReceivers",
            type: "address[]",
          },
          { internalType: "uint256[]", name: "feeAmounts", type: "uint256[]" },
          { internalType: "address", name: "dstReceiver", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "minReturnAmount", type: "uint256" },
          { internalType: "uint256", name: "flags", type: "uint256" },
          { internalType: "bytes", name: "permit", type: "bytes" },
        ],
        internalType: "struct MetaAggregationRouterV2.SwapDescriptionV2",
        name: "desc",
        type: "tuple",
      },
      { internalType: "bytes", name: "executorData", type: "bytes" },
      { internalType: "bytes", name: "clientData", type: "bytes" },
    ],
    name: "swapSimpleMode",
    outputs: [
      { internalType: "uint256", name: "returnAmount", type: "uint256" },
      { internalType: "uint256", name: "gasUsed", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "addr", type: "address[]" },
      { internalType: "bool[]", name: "value", type: "bool[]" },
    ],
    name: "updateWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];
