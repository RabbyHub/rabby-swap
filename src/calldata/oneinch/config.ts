import { UNI_V2_PAIR_INIT_CODE_HASH } from "../../consts";

/**
 * 1inch 离线配置：定期核对、手动更新，随 SDK 发布生效。
 * 核对依据：__tests__/fixtures/swap-calldata/swap-parser-regressions.json 的 evidence。
 */
// V3：链 ID → 工厂地址，新增部署须核对 CREATE2 规则。
// https://github.com/Uniswap/sdks/blob/main/sdks/sdk-core/src/addresses.ts
// https://github.com/Uniswap/sdks/blob/main/sdks/v3-sdk/src/utils/computePoolAddress.ts
const defaultV3Factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const V3_FACTORIES: Record<number, string> = {
  1: defaultV3Factory,
  10: defaultV3Factory,
  56: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7",
  137: defaultV3Factory,
  8453: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  42161: defaultV3Factory,
};
export const V3_INIT_CODE_HASH =
  "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";
// V3 费率档位，新增时核对池地址。
export const V3_FEES = [100, 500, 3000, 10000];

// V2：链 ID → [工厂, init-code hash]，新增时用 getPair 核对。
// https://bscscan.com/address/0xbcfccbde45ce874adcb698cc183debcf17952812#readContract
// https://github.com/pancakeswap/pancake-swap-sdk/blob/master/src/constants.ts
// Sushi 官方哈希，已链上核对。
const sushiInitCodeHash =
  "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303";
const sushiFactory = "0xc35dadb65012ec5796536bd9864ed8773abc74c4";
export const EXTRA_V2_FACTORIES: Record<number, readonly [string, string][]> = {
  1: [["0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac", sushiInitCodeHash]],
  56: [
    [sushiFactory, sushiInitCodeHash],
    [
      "0xbcfccbde45ce874adcb698cc183debcf17952812",
      "0xd0d4c4cd0848c93cb4fd1f498d7013ee6bfb25783ea21593d5834f5d250ece66",
    ],
    [
      "0xca143ce32fe78f1f7019d7d551a6402fc5350c73",
      "0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5",
    ],
  ],
  // QuickSwap Polygon，依据见 evidence.blocked。
  137: [
    ["0x5757371414417b8c6caad45baef941abc7d3ab32", UNI_V2_PAIR_INIT_CODE_HASH],
    [sushiFactory, sushiInitCodeHash],
  ],
  42161: [[sushiFactory, sushiInitCodeHash]],
};

// 补充候选币，仅用于解析，不影响币种分类。
export const EXTRA_CANDIDATE_TOKENS: Record<number, readonly string[]> = {
  // Polygon WETH，非 WPOL。
  137: ["0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"],
};

// Curve：链 ID → 池地址 → 币种和接口标志。
// coins 按链上顺序排列；hasReceiver 表示支持带收款人的 exchange。
export const CURVE_POOLS: Record<
  number,
  Record<string, { coins: readonly string[]; hasReceiver: boolean }>
> = {
  1: {
    // crvUSD/USDT、stETH-ng。
    "0x390f3595bca2df7d23783dfd126427cceb997bf4": {
      coins: [
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
      ],
      hasReceiver: true,
    },
    "0x21e27a5e5513d6e65c4f830167390997aa84843a": {
      coins: [
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
      ],
      hasReceiver: false,
    },
    // USAT/USDT
    "0x0bdb2c3af83ee1d3196fa64d3162e54624b5f6b0": {
      coins: [
        "0x07041776f5007aca2a54844f50503a18a72a8b68",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
      ],
      hasReceiver: true,
    },
    // eurs
    "0x0ce6a5ff5217e38315f87032cf90686c96627caa": {
      coins: [
        "0xdb25f211ab05b1c97d595516f45794528a807ad8",
        "0xd71ecff9342a5ced620049e616c5035f1db98620",
      ],
      hasReceiver: false,
    },
    // 2pool
    "0x1005f7406f32a61bd760cfa14accd2737913d546": {
      coins: [
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
      ],
      hasReceiver: false,
    },
    // DUSD/frxUSD
    "0x104d6a1b97a6cef88d905d7b865a378d90be932a": {
      coins: [
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
        "0x63d74d22e689c715a04f2c13962b1f77f443d35b",
      ],
      hasReceiver: true,
    },
    // crvUSD/frxUSD
    "0x13e12bb0e6a2f1a3d6901a59a9d585e89a6243e1": {
      coins: [
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
        "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
      ],
      hasReceiver: true,
    },
    // alUSD/frxUSD
    "0x17f9682c9cd1a448b31c0428f1d0783ed13a9fa3": {
      coins: [
        "0xbc6da0fe9ad5f3b0d58160288917aa56653660e9",
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
      ],
      hasReceiver: true,
    },
    // sUSDx/USDx
    "0x1c9a0b9bff066756c4586cb6711483cfa9f281ee": {
      coins: [
        "0xeb892628d1e58bc475a6dcb7f5dbc4f591632aa4",
        "0xa1fa7777974312f7d801a8880714a218f76233f8",
      ],
      hasReceiver: true,
    },
    // strUSD/trUSD
    "0x25a637c80ad90177d0b3ff28aa2d3f74f7165ccb": {
      coins: [
        "0x280839980a7ed0d7717f64125fe241012e5f5815",
        "0xd0580192e98ea6ceb9c7b6191ed2e27560911697",
      ],
      hasReceiver: true,
    },
    // ETH+/ETH
    "0x2c683fad51da2cd17793219cc86439c1875c353e": {
      coins: [
        "0xe72b141df173b999ae7c1adcbf60cc9833ce56a8",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ],
      hasReceiver: true,
    },
    // USDS/stUSDS
    "0x2c7c98a3b1582d83c43987202aeff638312478ae": {
      coins: [
        "0xdc035d45d973e3ec169d2276ddab16f1e407384f",
        "0x99cd4ec3f88a45940936f469e4bb72a2a701eeb9",
      ],
      hasReceiver: true,
    },
    // PayPool
    "0x383e6b4437b59fff47b619cba855ca29342a8559": {
      coins: [
        "0x6c3ea9036406852006290770bedfcaba0e23a0e8",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ],
      hasReceiver: true,
    },
    // evaUSDC/evaUSDT
    "0x3c0965582db7a0f660d491aa6174b9438f911c21": {
      coins: [
        "0x501ebf66d76a96d4fb26ccead42957653e16b8b8",
        "0x741bd193b6b40f8703d2e116fd1965421f290f58",
      ],
      hasReceiver: true,
    },
    // reUSD/sDola
    "0x48d670d189b4b48757992d36897bca6e3f889040": {
      coins: [
        "0x57ab1e0003f623289cd798b1824be09a793e4bec",
        "0xb45ad160634c528cc3d2926d9807104fa3157305",
      ],
      hasReceiver: true,
    },
    // hbtc
    "0x4ca9b3063ec5866a4b82e437059d2c43d1be596f": {
      coins: [
        "0x0316eb71485b0ab14103307bf65a021042c6d380",
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      ],
      hasReceiver: false,
    },
    // 4pool
    "0x4e0915c88bc70750d68c481540f081fefaf22273": {
      coins: [
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "0xa693b19d2931d498c5b318df961919bb4aee87a5",
        "0x853d955acef822db058eb8505911ed77f175b99e",
      ],
      hasReceiver: false,
    },
    // Curve.fi Strategic USD Reserves
    "0x4f493b7de8aac7d55f71853688b1f7c8f0243c85": {
      coins: [
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
      ],
      hasReceiver: true,
    },
    // USDC/fxUSD
    "0x5018be882dcce5e3f2f3b0913ae2096b9b3fb61f": {
      coins: [
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0x085780639cc2cacd35e474e71f4d000e2405d8f6",
      ],
      hasReceiver: true,
    },
    // Curve Strategic Ethena Reserves
    "0x5b03cccab7ba3010fa5cad23746cbf0794938e96": {
      coins: [
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "0x4c9edd5852cd905f086c759e8383e09bff1e68b3",
      ],
      hasReceiver: true,
    },
    // reUSD/sUSDe
    "0x5c2ab69eb2bf12a2f4572d178687bd4660512972": {
      coins: [
        "0x5086bf358635b81d8c47c66d1c8b9e567db70c72",
        "0x9d39a5de30e57443bff2a8307a4256c8797a3497",
      ],
      hasReceiver: true,
    },
    // FRAXUSDe
    "0x5dc1bf6f1e983c0b21efb003c105133736fa0743": {
      coins: [
        "0x853d955acef822db058eb8505911ed77f175b99e",
        "0x4c9edd5852cd905f086c759e8383e09bff1e68b3",
      ],
      hasReceiver: true,
    },
    // pyUSD/crvUSD
    "0x625e92624bc2d88619accc1788365a69767f6200": {
      coins: [
        "0x6c3ea9036406852006290770bedfcaba0e23a0e8",
        "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
      ],
      hasReceiver: true,
    },
    // GHO/crvUSD
    "0x635ef0056a597d13863b73825cca297236578595": {
      coins: [
        "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
        "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
      ],
      hasReceiver: true,
    },
    // HemiBTC/cbBTC/WBTC
    "0x66039342c66760874047c36943b1e2d8300363bb": {
      coins: [
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
        "0x06ea695b91700071b161a434fed42d1dcbad9f00",
      ],
      hasReceiver: true,
    },
    // OUSD/USDC
    "0x6d18e1a7faeb1f0467a77c0d293872ab685426dc": {
      coins: [
        "0x2a8e1e676ec238d8a992307b495b45b3feaa5e86",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ],
      hasReceiver: true,
    },
    // apxUSD-USDC v3
    "0x6f63deedc9870d6c16fc644c6654748352cdc87c": {
      coins: [
        "0x98a878b1cd98131b271883b390f68d2c90674665",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ],
      hasReceiver: true,
    },
    // USDC/USDf
    "0x72310daaed61321b02b08a547150c07522c6a976": {
      coins: [
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0xfa2b947eec368f42195f24f36d2af29f7c24cec2",
      ],
      hasReceiver: true,
    },
    // DOLA/sUSDe
    "0x744793b5110f6ca9cc7cdfe1ce16677c3eb192ef": {
      coins: [
        "0x865377367054516e17014ccded1e7d814edc9ce4",
        "0x9d39a5de30e57443bff2a8307a4256c8797a3497",
      ],
      hasReceiver: true,
    },
    // SaveDola
    "0x76a962ba6770068bcf454d34dde17175611e6637": {
      coins: [
        "0x0655977feb2f289a4ab78af67bab0d17aab84367",
        "0xb45ad160634c528cc3d2926d9807104fa3157305",
      ],
      hasReceiver: true,
    },
    // USD3/frxUSD
    "0x7ba89bc658c07569cfa6d7947adaa80181a24568": {
      coins: [
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
        "0x056b269eb1f75477a8666ae8c7fe01b64dd55ecc",
      ],
      hasReceiver: true,
    },
    // stLINK/LINK-ng
    "0x7e13876b92f1a62c599c231f783f682e96b91761": {
      coins: [
        "0x514910771af9ca656af840dff83e8264ecf986ca",
        "0xb8b295df2cd735b15be5eb419517aa626fc43cd5",
      ],
      hasReceiver: true,
    },
    // frxUSD/sUSDS
    "0x81a2612f6dea269a6dd1f6deab45c5424ee2c4b7": {
      coins: [
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
        "0xa3931d71877c0e7a3148cb7eb4463524fec27fbd",
      ],
      hasReceiver: true,
    },
    // FIDD/USDT
    "0x8273cb2cf9af3228fd14af25b5b1de2a9676c372": {
      coins: [
        "0x7c135549504245b5eae64fc0e99fa5ebabb8e35d",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
      ],
      hasReceiver: true,
    },
    // cbBTC/wBTC
    "0x839d6bdedff886404a6d7a788ef241e4e28f4802": {
      coins: [
        "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      ],
      hasReceiver: true,
    },
    // DOLA/sUSDS
    "0x8b83c4aa949254895507d09365229bc3a8c7f710": {
      coins: [
        "0x865377367054516e17014ccded1e7d814edc9ce4",
        "0xa3931d71877c0e7a3148cb7eb4463524fec27fbd",
      ],
      hasReceiver: true,
    },
    // alETH/wETH
    "0x8efd02a0a40545f32dba5d664cbbc1570d3fedf6": {
      coins: [
        "0x0100546f2cd4c9d97f798ffc9755e47865ff7ee6",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ],
      hasReceiver: true,
    },
    // frxUSD/msUSD
    "0x9a9e2e70919c75d80aaaa1d483c46cdbb8ac4d1b": {
      coins: [
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
        "0xab5eb14c09d416f0ac63661e57edb7aecdb9befa",
      ],
      hasReceiver: true,
    },
    // frxeth
    "0xa1f8a6807c402e4a15ef4eba36528a3fed24e577": {
      coins: [
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "0x5e8422345238f34275888049021821e8e08caa1f",
      ],
      hasReceiver: false,
    },
    // ankreth
    "0xa96a65c051bf88b4095ee1f2451c2a9d43f53ae2": {
      coins: [
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "0xe95a203b1a91a908f9b9ce46459d101078c2c3cb",
      ],
      hasReceiver: false,
    },
    // fraxusdp
    "0xae34574ac03a15cd58a92dc79de7b1a0800f1ce3": {
      coins: [
        "0x853d955acef822db058eb8505911ed77f175b99e",
        "0x8e870d67f660d95d5be530380d0ec0bd388289e1",
      ],
      hasReceiver: false,
    },
    // reUSD/fxUSD
    "0xb0ef04ace97d350e24efa5139d2590d26a61a8dc": {
      coins: [
        "0x57ab1e0003f623289cd798b1824be09a793e4bec",
        "0x085780639cc2cacd35e474e71f4d000e2405d8f6",
      ],
      hasReceiver: true,
    },
    // pufETH/wstETH
    "0xb3c8ce1ee157b0dcaa96897c9170aee6281706c9": {
      coins: [
        "0xd9a442856c234a39a81a089c06451ebaa4306a72",
        "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
      ],
      hasReceiver: true,
    },
    // FRAX/frxUSD
    "0xbbaf8b2837cbbc7146f5bc978d6f84db0be1cacc": {
      coins: [
        "0x853d955acef822db058eb8505911ed77f175b99e",
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
      ],
      hasReceiver: true,
    },
    // 3pool
    "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7": {
      coins: [
        "0x6b175474e89094c44da98b954eedeac495271d0f",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
      ],
      hasReceiver: false,
    },
    // pmUSD/frxUSD
    "0xbf5047039f2980c21eb5692c790bad8a9533b900": {
      coins: [
        "0xc0c17dd08263c16f6b64e772fb9b723bf1344ddf",
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
      ],
      hasReceiver: true,
    },
    // wbeth
    "0xbfab6fa95e0091ed66058ad493189d2cb29385e6": {
      coins: [
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "0xa2e3356610840701bdf5611a53974510ae27e2e1",
      ],
      hasReceiver: false,
    },
    // USDG/USDC
    "0xc061caa073f3d95f80f8e5428d32d2d76f5e1622": {
      coins: [
        "0xe343167631d89b6ffc58b88d6b7fb0228795491d",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ],
      hasReceiver: true,
    },
    // USDtb-USDC
    "0xc2921134073151490193ac7369313c8e0b08e1e7": {
      coins: [
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0xc139190f447e929f090edeb554d95abb8b18ac1c",
      ],
      hasReceiver: true,
    },
    // reUSD/scrvUSD
    "0xc522a6606bba746d7960404f22a3db936b6f4f50": {
      coins: [
        "0x57ab1e0003f623289cd798b1824be09a793e4bec",
        "0x0655977feb2f289a4ab78af67bab0d17aab84367",
      ],
      hasReceiver: true,
    },
    // seth
    "0xc5424b857f758e906013f3555dad202e4bdb4567": {
      coins: [
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "0x5e74c9036fb86bd7ecdcb084a0673efc32ea31cb",
      ],
      hasReceiver: false,
    },
    // sUSG/reUSD
    "0xc6ac08424ee6d1373f03611b96f5da849594b6d8": {
      coins: [
        "0xf17d6f98a5c6eaa99d149079984119e0a4ef6900",
        "0x5086bf358635b81d8c47c66d1c8b9e567db70c72",
      ],
      hasReceiver: true,
    },
    // OETH/WETH
    "0xcc7d5785ad5755b6164e21495e07adb0ff11c2a8": {
      coins: [
        "0x856c4efb76c1d1ae02e20ceb03a2a6a08b0b8dc3",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ],
      hasReceiver: true,
    },
    // RLUSD/USDC
    "0xd001ae433f254283fece51d4acce8c53263aa186": {
      coins: [
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0x8292bb45bf1ee4d140127049757c2e0ff06317ed",
      ],
      hasReceiver: true,
    },
    // frxUSD/trUSD
    "0xd1d954bc94c843815ec7b8119f2de00af27fa6ff": {
      coins: [
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
        "0xd0580192e98ea6ceb9c7b6191ed2e27560911697",
      ],
      hasReceiver: true,
    },
    // LlamaThena
    "0xd29f8980852c2c76fc3f6e96a7aa06e0bedcc1b1": {
      coins: [
        "0x0655977feb2f289a4ab78af67bab0d17aab84367",
        "0x9d39a5de30e57443bff2a8307a4256c8797a3497",
      ],
      hasReceiver: true,
    },
    // frxUSD/USDT
    "0xd6937ea8d33b0c21348f36f7895fde3054ba4927": {
      coins: [
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
      ],
      hasReceiver: true,
    },
    // weETH/WETH-ng
    "0xdb74dfdd3bb46be8ce6c33dc9d82777bcfc3ded5": {
      coins: [
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee",
      ],
      hasReceiver: true,
    },
    // steth
    "0xdc24316b9ae028f1497c275eb9192a3ea0f67022": {
      coins: [
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
      ],
      hasReceiver: false,
    },
    // fraxusdc
    "0xdcef968d416a41cdac0ed8702fac8128a64241a2": {
      coins: [
        "0x853d955acef822db058eb8505911ed77f175b99e",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ],
      hasReceiver: false,
    },
    // osETH/rETH
    "0xe080027bd47353b5d1639772b4a75e9ed3658a0d": {
      coins: [
        "0xf1c9acdc66974dfb6decb12aa385b9cd01190e38",
        "0xae78736cd615f374d3085123a210448e74fc6393",
      ],
      hasReceiver: true,
    },
    // apyUSD-apxUSD
    "0xe41be7b340f7c2eda4da1e99b42ee1b228b526b7": {
      coins: [
        "0x38eeb52f0771140d10c4e9a9a72349a329fe8a6a",
        "0x98a878b1cd98131b271883b390f68d2c90674665",
      ],
      hasReceiver: true,
    },
    // FIDD/USDC
    "0xe47e8ced9d94aa43c922627782e29b41a93202af": {
      coins: [
        "0x7c135549504245b5eae64fc0e99fa5ebabb8e35d",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ],
      hasReceiver: true,
    },
    // USDx/USDT
    "0xe521ba88837b2726e5343cca91ada6f19f356c45": {
      coins: [
        "0xa1fa7777974312f7d801a8880714a218f76233f8",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
      ],
      hasReceiver: true,
    },
    // pmUSD/crvUSD
    "0xecb0f0d68c19bdaadaebe24f6752a4db34e2c2cb": {
      coins: [
        "0xc0c17dd08263c16f6b64e772fb9b723bf1344ddf",
        "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
      ],
      hasReceiver: true,
    },
    // reUSD/sfrxUSD
    "0xed785af60bed688baa8990cd5c4166221599a441": {
      coins: [
        "0x57ab1e0003f623289cd798b1824be09a793e4bec",
        "0xcf62f905562626cfcdd2261162a51fd02fc9c5b6",
      ],
      hasReceiver: true,
    },
    // pufETH/wstETH
    "0xeeda34a377dd0ca676b9511ee1324974fa8d980d": {
      coins: [
        "0xd9a442856c234a39a81a089c06451ebaa4306a72",
        "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
      ],
      hasReceiver: true,
    },
    // USG/frxUSD
    "0xefc056790bb19702b2164ec6ea6ba3ae01d81195": {
      coins: [
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
        "0xb1c2db5d6ca03fce73dbd304d320bf76c55ae1b1",
      ],
      hasReceiver: true,
    },
    // BOLD/USDC Pool
    "0xefc6516323fbd28e80b85a497b65a86243a54b3e": {
      coins: [
        "0x6440f144b7e50d6a8439336510312d2f54beb01d",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ],
      hasReceiver: true,
    },
    // link
    "0xf178c0b5bb7e7abf4e12a4838c7b7c5ba2c623c0": {
      coins: [
        "0x514910771af9ca656af840dff83e8264ecf986ca",
        "0xbbc455cb4f1b9e4bfc4b73970d360c8f032efee6",
      ],
      hasReceiver: false,
    },
    // sbtc2
    "0xf253f83aca21aabd2a20553ae0bf7f65c755a07f": {
      coins: [
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        "0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6",
      ],
      hasReceiver: false,
    },
    // sfrxUSD/frxUSD
    "0xf292eb6c5dcb693eaaf392d0562a01c3710e5978": {
      coins: [
        "0xcf62f905562626cfcdd2261162a51fd02fc9c5b6",
        "0xcacd6fd266af91b8aed52accc382b4e165586e29",
      ],
      hasReceiver: true,
    },
    // USDC/USDat
    "0xf4d0cf32908b2c7f1021339c43df0f77f06896d7": {
      coins: [
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0x23238f20b894f29041f48d88ee91131c395aaa71",
      ],
      hasReceiver: true,
    },
    // reth
    "0xf9440930043eb3997fc70e1339dbb11f341de7a8": {
      coins: [
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "0x9559aaa82d9649c7a7b220e7c461d2e74c9a3593",
      ],
      hasReceiver: false,
    },
    // eurt
    "0xfd5db7463a3ab53fd211b4af195c5bccc1a03890": {
      coins: [
        "0xc581b735a1688071a1746c968e0798d642ede491",
        "0xd71ecff9342a5ced620049e616c5035f1db98620",
      ],
      hasReceiver: false,
    },
  },
  137: {
    // Polygon USDT0/frxUSD。
    "0x25777cbc3673e7edfb4f4dc4359c5ea6ab07af3e": {
      coins: [
        "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        "0x80eede496655fb9047dd39d9f418d5483ed600df",
      ],
      hasReceiver: true,
    },
    "0x5bc930b8f81f4ceee3e3527159c3bdf453bcaae9": {
      coins: [
        "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        "0x80eede496655fb9047dd39d9f418d5483ed600df",
      ],
      hasReceiver: true,
    },
  },
  10: {
    // 3pool
    "0x1337bedc9d22ecbe766df105c9623922a27963ec": {
      coins: [
        "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
        "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
        "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
      ],
      hasReceiver: false,
    },
    // fraxbp
    "0x29a3d66b30bc4ad674a4fdaf27578b64f6afbfe7": {
      coins: [
        "0x2e3d870790dc77a83dd1d18184acc7439a53f475",
        "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      ],
      hasReceiver: false,
    },
    // wsteth
    "0xb90b9b1f91a01ea22a182cd84c1e22222e39b415": {
      coins: [
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "0x1f32b1c2345538c0c6f582fcb022739c4a194ebb",
      ],
      hasReceiver: false,
    },
  },
  42161: {
    // ren
    "0x3e01dd8a5e1fb3481f0f589056b428fc308af0fb": {
      coins: [
        "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
        "0xdbf31df14b66535af65aac99c32e9ea844e14501",
      ],
      hasReceiver: false,
    },
    // wsteth
    "0x6eb2dc694eb516b16dc9fbc678c60052bbdd7d80": {
      coins: [
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "0x5979d7b546e38e414f7e9822514be443a4800529",
      ],
      hasReceiver: false,
    },
    // 2pool
    "0x7f90122bf0700f9e7e1f688fe926940e8839f353": {
      coins: [
        "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
        "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      ],
      hasReceiver: false,
    },
    // fraxbp
    "0xc9b8a3fdecb9d5b218d02555a8baf332e5b740d5": {
      coins: [
        "0x17fc002b466eec40dae837fc4be5c67993ddbd6f",
        "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      ],
      hasReceiver: false,
    },
  },
};
