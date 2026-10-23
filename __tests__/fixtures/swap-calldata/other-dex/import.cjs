// Fixture oracle: deliberately independent of src/abi.ts and SDK decoders.
const fs = require("fs");
const path = require("path");
const { gzipSync } = require("zlib");
const { createHash } = require("crypto");
const { Interface } = require("@ethersproject/abi");

const signatures = {
  oneInch: "function swap(address executor,(address srcToken,address dstToken,address srcReceiver,address dstReceiver,uint256 amount,uint256 minReturnAmount,uint256 flags) desc,bytes data)",
  openOcean: "function swap(address caller,(address srcToken,address dstToken,address srcReceiver,address dstReceiver,uint256 amount,uint256 minReturnAmount,uint256 guaranteedAmount,uint256 flags,address referrer,bytes permit) desc,(uint256 target,uint256 gasLimit,uint256 value,bytes data)[] calls)",
  openOceanSimple: "function simpleSwap(address caller,(address srcToken,address dstToken,address srcReceiver,address dstReceiver,uint256 amount,uint256 minReturnAmount,uint256 flags,address referrer,bytes permit) desc,(uint256 target,uint256 gasLimit,uint256 value,bytes data)[] calls)",
  kyber: "function swap((address callTarget,address approveTarget,bytes targetData,(address srcToken,address dstToken,address[] srcReceivers,uint256[] srcAmounts,address[] feeReceivers,uint256[] feeAmounts,address dstReceiver,uint256 amount,uint256 minReturnAmount,uint256 flags,bytes permit) desc,bytes clientData) execution)",
  sushi: "function snwap(address tokenIn,uint256 amountIn,address recipient,address tokenOut,uint256 amountOutMin,address executor,bytes executorData)",
  sushiMultiple: "function snwapMultiple((address token,uint256 amountIn,address transferTo)[] inputTokens,(address token,address recipient,uint256 amountOutMin)[] outputTokens,(address executor,uint256 value,bytes data)[] executors)",
  allowanceHolder: "function exec(address operator,address token,uint256 amount,address target,bytes data)",
  settler: "function execute((address recipient,address buyToken,uint256 minAmountOut) slippage,bytes[] actions,bytes32 affiliate)",
};
const interfaces = Object.fromEntries(
  Object.entries(signatures).map(([name, signature]) => [name, new Interface([signature])])
);
const files = {
  "0xAPIV2": "0xapi-v2",
  "1inch": "1inch",
  Kyberswap: "kyberswap",
  OpenOcean: "openocean",
  Sushi: "sushi",
};
const zero = "0x0000000000000000000000000000000000000000";
const native = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

function normalizeToken(token, record) {
  const value = token.toLowerCase();
  // Native aliases in these recorded router payloads, independent of CHAINS.
  const alias = value === native || value === zero ||
    (record.chain === "POLYGON" && value === "0x0000000000000000000000000000000000001010");
  // CELO's ERC-20 address stays an address; it is the requested ERC-20 here.
  return alias ? record.request.nativeTokenAddress.toLowerCase() : value;
}

function expectedFor(record) {
  const data = record.quote.tx.data;
  const parse = (name) => interfaces[name].parseTransaction({ data }).args;
  let input, amount, output, minimum, recipient;
  if (record.dex === "0xAPIV2") {
    const outer = parse("allowanceHolder");
    const inner = interfaces.settler.parseTransaction({ data: outer.data }).args.slippage;
    [input, amount, output, minimum, recipient] = [outer.token, outer.amount, inner.buyToken, inner.minAmountOut, inner.recipient];
  } else if (record.dex === "Sushi") {
    if (data.startsWith("0xd33721a5")) {
      const args = parse("sushiMultiple");
      if (args.outputTokens.length !== 1 || !args.inputTokens.length ||
          args.inputTokens.some((item) => item.token.toLowerCase() !== args.inputTokens[0].token.toLowerCase())) {
        throw new Error(`Unsupported multi-asset fixture ${record.id}`);
      }
      input = args.inputTokens[0].token;
      amount = args.inputTokens.reduce((sum, item) => sum + BigInt(item.amountIn.toString()), 0n);
      const target = args.outputTokens[0];
      [output, minimum, recipient] = [target.token, target.amountOutMin, target.recipient];
    } else {
      const args = parse("sushi");
      [input, amount, output, minimum, recipient] = [args.tokenIn, args.amountIn, args.tokenOut, args.amountOutMin, args.recipient];
    }
  } else {
    const desc = record.dex === "1inch" ? parse("oneInch").desc :
      record.dex === "Kyberswap" ? parse("kyber").execution.desc :
      parse(data.startsWith("0x0a9704d5") ? "openOceanSimple" : "openOcean").desc;
    [input, amount, output, minimum, recipient] = [desc.srcToken, desc.amount, desc.dstToken, desc.minReturnAmount, desc.dstReceiver];
  }
  return {
    fromToken: normalizeToken(input, record),
    fromTokenAmount: amount.toString(),
    toToken: normalizeToken(output, record),
    minReceiveToTokenAmount: minimum.toString(),
    toTokenReceiver: (recipient.toLowerCase() === zero ? record.request.userAddress : recipient).toLowerCase(),
  };
}

const source = process.argv[2];
if (!source) throw new Error("Usage: node import.cjs <swap-calldata-results.json>");
const bytes = fs.readFileSync(source);
const exported = JSON.parse(bytes);
const sourceMetadata = {
  file: path.basename(source),
  sha256: createHash("sha256").update(bytes).digest("hex"),
  sdkVersion: exported.sdkVersion,
  backendRevision: exported.backendRevision,
  exportedAt: exported.exportedAt,
};
for (const [dex, file] of Object.entries(files)) {
  const samples = exported.records.filter((record) => record.dex === dex).map((record) => {
    const previous = !record.verification.decoded ? "decode-failure" :
      !record.callDataPass || !record.receiverPass ? "validation-failure" : "pass";
    return {
      name: `${dex} ${record.chain} #${record.id} ${record.quote.tx.data.slice(0, 10)} ${record.fromSymbol}->${record.toSymbol} ${record.slippage}% [previous:${previous}]`,
      expected: expectedFor(record),
      record,
    };
  });
  if (!samples.length) throw new Error(`No fixtures for ${dex}`);
  fs.writeFileSync(path.join(__dirname, `${file}.json.gz`), gzipSync(JSON.stringify({ source: sourceMetadata, samples }), { level: 9 }));
  console.log(`${dex}: ${samples.length} records`);
}
