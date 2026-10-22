/*
 * REQUIREMENTS: the capability catalog (V1 cap: 10 entries, Etherlink EVM, mainnet).
 *
 * Each entry:
 *   id, title (what the developer needs), short (name used in lists)
 *   status        one of the keys in rules.js
 *   fact          DOCUMENTED: what the primary sources say (paraphrased)
 *   implication   OUR INTERPRETATION: what this likely means for implementation (inference)
 *   sources       [{label, url, pageUpdated}]  pageUpdated = the page's own "Last updated" or null
 *   checkedOn     the date we read the sources (YYYY-MM-DD)
 *   checked       (insufficient only) what we looked at
 *   settle        (insufficient only) a cheap way for the developer to settle it
 *   scopeNote     (not_evaluated only) why there is no verdict
 *
 * Rule of thumb: only set a verdict after reading the primary page directly.
 * Run `node --test preflight/engine.test.js` after editing: it checks every entry against the rules.
 */
(function (root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else (root.Preflight = root.Preflight || {}).requirements = value;
})(typeof self !== 'undefined' ? self : this, function () {
  const CHECKED = '2026-10-22';
  const UPDATED = 'Oct 7, 2026';

  const SRC = {
    endpoints: { label: 'Etherlink docs: Ethereum endpoint support', url: 'https://docs.etherlink.com/evm/developing/endpoint-support', pageUpdated: UPDATED },
    upgrades: { label: 'Etherlink docs: Kernel upgrades', url: 'https://docs.etherlink.com/progress/upgrades', pageUpdated: UPDATED },
    fees: { label: 'Etherlink docs: EVM fees', url: 'https://docs.etherlink.com/evm/developing/fees', pageUpdated: UPDATED },
    compat: { label: 'Etherlink docs: Compatibility with Ethereum', url: 'https://docs.etherlink.com/evm/developing/compatibility', pageUpdated: UPDATED },
    websockets: { label: 'Etherlink docs: WebSockets', url: 'https://docs.etherlink.com/evm/developing/websockets', pageUpdated: UPDATED },
    priceFeeds: { label: 'Etherlink docs: Price feeds', url: 'https://docs.etherlink.com/evm/tools/price-feeds', pageUpdated: UPDATED },
    crossChain: { label: 'Etherlink docs: Cross-chain communication', url: 'https://docs.etherlink.com/evm/tools/cross-chain-comms', pageUpdated: UPDATED },
    devExperience: { label: 'Etherlink docs: Developer experience', url: 'https://docs.etherlink.com/evm/tools/developer-experience', pageUpdated: UPDATED },
    nodeProviders: { label: 'Etherlink docs: Node providers', url: 'https://docs.etherlink.com/evm/tools/node-providers', pageUpdated: UPDATED },
    docsIndex: { label: 'Etherlink docs: page index (llms.txt)', url: 'https://docs.etherlink.com/llms.txt', pageUpdated: null },
  };

  return [
    {
      id: 'evm-fork-features',
      title: 'Newer EVM fork features (Cancun, Prague, Osaka)',
      short: 'Newer EVM fork features',
      status: 'supported',
      fact:
        'The endpoint-support page lists the EVM version as Osaka. The kernel upgrades page says Cancun support went live on mainnet with kernel 4.0 (21 May 2025) and records Prague support in 5.0 and Osaka in 6.0, but gives no go-live date or explicit live statement for those two; the Osaka status rests on the endpoint-support page.',
      implication:
        'Contracts compiled for these fork targets should be accepted. Pin your compiler evmVersion deliberately and confirm with a testnet deploy.',
      sources: [SRC.endpoints, SRC.upgrades],
      checkedOn: CHECKED,
    },
    {
      id: 'eip-7702',
      title: 'EIP-7702 (EOA code delegation, sponsored or batched calls)',
      short: 'EIP-7702',
      status: 'caveat',
      fact:
        'The kernel upgrades page records Prague support, including EIP-7702, in kernel 5.0 (no go-live date given). For EIP-7702 transactions the inclusion fee adds the authorization-list size (125 bytes per authorization). Kernel 6.2 (25 Mar 2026) fixed an EIP-7702 data-availability fee undercharge.',
      implication:
        'Expect each authorization to add to the inclusion fee. If you copied fee or sponsorship budgets from another chain, re-check them for Etherlink.',
      sources: [SRC.fees, SRC.upgrades],
      checkedOn: CHECKED,
    },
    {
      id: 'priority-fee',
      title: 'Priority fees (tips) to get transactions included faster',
      short: 'Priority-fee (tip) ordering',
      status: 'unsupported',
      fact:
        'Etherlink EVM ignores priority fees offered in max_priority_fee_per_gas. The sequencer orders transactions first-come, first-served, so tips do not speed up inclusion. (eth_maxPriorityFeePerGas itself is listed as supported.)',
      implication:
        'Gas-price bidding, tip-based priority and tip auctions will not work as they do on Ethereum. Anything that relies on paying more to jump the queue needs a different design.',
      sources: [SRC.fees, SRC.endpoints],
      checkedOn: CHECKED,
    },
    {
      id: 'fee-market',
      title: 'Dynamic, Ethereum-style base-fee pricing',
      short: 'Dynamic base-fee pricing',
      status: 'insufficient',
      fact:
        'Two primary pages are in tension. The endpoint-support page says the fee market is not implemented yet, though the rollup accepts EIP-1559 transaction types. The fees page documents an Etherlink-specific dynamic execution fee: it rises when demand pushes the backlog past a tolerance and falls back to a 1 gwei minimum. Neither page says whether that counts as Ethereum-style (EIP-1559) base-fee pricing.',
      implication:
        'The pages may use "fee market" in different senses, or one may be stale; the docs do not say. Avoid hard-coding either a constant gas price or Ethereum-style per-block base-fee behaviour until this is settled.',
      checked: 'Endpoint-support page and fees page, both read directly and both showing a last-updated date of Oct 7, 2026.',
      settle:
        'Sample eth_gasPrice and eth_feeHistory on testnet while sending a burst of transactions, or ask in the Etherlink developer Discord which page is current.',
      sources: [SRC.endpoints, SRC.fees],
      checkedOn: CHECKED,
    },
    {
      id: 'state-proofs',
      title: 'Light clients, storage or state proofs, or recomputing block hashes',
      short: 'Proofs and light clients',
      status: 'unsupported',
      fact:
        'eth_getProof is listed as not supported. Block hashes are computed differently, so header data cannot be used to recompute them. The state hash uses a different function from Keccak-256, so Keccak-based EVM light clients (for example Geth\'s) are incompatible.',
      implication:
        'Designs that verify Ethereum-style storage proofs, run an Ethereum light client, or recompute block hashes cannot be ported as-is and need a different verification design.',
      sources: [SRC.endpoints, SRC.compat],
      checkedOn: CHECKED,
    },
    {
      id: 'websocket-subscriptions',
      title: 'Push updates over WebSocket eth_subscribe (new blocks, logs, pending transactions)',
      short: 'WebSocket subscriptions',
      status: 'caveat',
      fact:
        'The endpoint-support page marks eth_subscribe as experimental. The WebSockets page says WebSocket connections are not enabled on the EVM node by default and require running your own node with --ws. It lists newBlockHeaders, logs and pendingTransactions (pending covers only transactions in the connected node\'s memory). It does not mention WebSockets on the public RPC endpoints. Instant Confirmations are experimental and use custom events that ethers.js and web3.js do not support.',
      implication:
        'Plan on running your own node or confirming support with your RPC provider. Polling with eth_getLogs and eth_blockNumber is a listed-supported fallback; the filter methods are not supported.',
      sources: [SRC.endpoints, SRC.websockets],
      checkedOn: CHECKED,
    },
    {
      id: 'oracle-pyth-redstone',
      title: 'On-chain price feeds from Pyth or RedStone',
      short: 'Pyth / RedStone price feeds',
      status: 'caveat',
      fact:
        'The price-feeds page lists Pyth (400+ pull-based feeds, same contract address on mainnet and Shadownet testnet) and RedStone (push-based feeds; the page gives mainnet addresses only for XTZ/USD and URANIUM/USD and points to RedStone\'s docs for others). Pyth testnet prices do not change. The page does not discuss staleness; its RedStone example does not check updatedAt, and its Pyth example uses getPriceUnsafe without a publish-time check.',
      implication:
        'Likely usable, but confirm the specific pair you need exists on mainnet. Add your own staleness checks rather than copying the page\'s examples, and do not test price-dependent logic against Pyth on testnet; use mocks.',
      sources: [SRC.priceFeeds],
      checkedOn: CHECKED,
    },
    {
      id: 'oracle-chainlink',
      title: 'Chainlink Data Feeds or CCIP',
      short: 'Chainlink feeds / CCIP',
      status: 'insufficient',
      fact:
        'None of Etherlink\'s price-feeds, cross-chain or developer-experience pages names Chainlink as a provider (the price-feeds page mentions it only in a code comment about an aggregator interface); they name Pyth, RedStone, LayerZero and Gelato. Absence from those pages is not evidence that Chainlink is unsupported.',
      implication:
        'Do not assume Chainlink is available, and do not assume it is not. If you need it, treat it as an open dependency.',
      checked:
        'Three Etherlink docs pages, read directly. Chainlink\'s own data-feeds page rendered no network list, and the CCIP directory URL tried returned 404, so neither settles it.',
      settle:
        'Look up Etherlink in Chainlink\'s live supported-networks and CCIP directory pages, or ask Chainlink directly. Pyth and RedStone are the documented alternatives.',
      sources: [SRC.priceFeeds, SRC.crossChain, SRC.devExperience],
      checkedOn: CHECKED,
    },
    {
      id: 'erc-4337',
      title: 'ERC-4337 account abstraction (bundlers and paymasters)',
      short: 'ERC-4337 bundlers / paymasters',
      status: 'insufficient',
      fact:
        'None of the 92 page titles in the Etherlink docs index mentions account abstraction, and the developer-experience and node-providers pages do not mention ERC-4337, bundlers, paymasters or smart accounts. They do list Safe multisig, Gelato and Thirdweb. EIP-7702 is documented as supported, which is related but not the same.',
      implication:
        'Do not assume a ready-made bundler or paymaster service exists for Etherlink. If you need one, treat it as an open dependency.',
      checked:
        'Docs index (titles only), developer-experience page and node-providers page, read directly; a partial scan of the full-text docs file (about the first 100k of 600k characters) found no mention. The Pimlico supported-chains URL tried returned 404, so no vendor list settled it.',
      settle:
        'Check your bundler or paymaster vendor\'s supported-chains list for Etherlink, or deploy the EntryPoint on the Shadownet testnet and send a test UserOperation.',
      sources: [SRC.docsIndex, SRC.devExperience, SRC.nodeProviders],
      checkedOn: CHECKED,
    },
    {
      id: 'michelson-nac-bridging',
      title: 'Anything on the Michelson interface, native atomic composability (NAC), or Tezos L1 bridging',
      short: 'Michelson / NAC / L1 bridging',
      status: 'not_evaluated',
      scopeNote:
        'V1 covers the Etherlink EVM interface only. No verdict is given, and none should be inferred.',
    },
  ];
});
