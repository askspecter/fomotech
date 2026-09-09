import { createPublicClient, http, getAddress } from 'viem';
const RPC='https://rpc.mainnet.chain.robinhood.com';
const chain={ id:4663, name:'rh', nativeCurrency:{name:'ETH',symbol:'ETH',decimals:18}, rpcUrls:{default:{http:[RPC]}} };
const c=createPublicClient({ chain, transport:http(RPC) });
const CURVE='0x576bd13cc4053Eb91D284302a348769D91a7f068';
const PEA='0xd046a0b73dbe5b4e00f507526c35e5426c873f99';
const latest=await c.getBlockNumber();
// scan from launch block area forward for any logs from the curve
let from=58546508n;
const WIN=100000n;
let all=[];
for(let s=from; s<latest && all.length<40; s+=WIN){
  const to = s+WIN>latest?latest:s+WIN;
  try{ const logs=await c.getLogs({ address:CURVE, fromBlock:s, toBlock:to }); all=all.concat(logs); }catch(e){ console.log('err',String(e.message).slice(0,60)); break; }
}
console.log('curve logs found:', all.length);
const addrs=new Set();
for(const l of all){
  // collect any 20-byte address embedded in data or topics
  const words=[];
  const d=l.data.slice(2);
  for(let i=0;i+64<=d.length;i+=64) words.push(d.slice(i,i+64));
  for(const t of l.topics.slice(1)) words.push(t.slice(2));
  for(const w of words){ if(/^0{24}[0-9a-f]{40}$/.test(w)){ const a='0x'+w.slice(24); if(a.toLowerCase()!=='0x'+'0'.repeat(40) && a.toLowerCase()!==PEA) addrs.add(getAddress(a)); } }
  console.log('topic0', l.topics[0].slice(0,18), 'block', l.blockNumber.toString());
}
console.log('candidate addresses:', [...addrs]);
// for each candidate, check if it holds PEA (=> likely the pool)
const ERC20=[{name:'balanceOf',type:'function',stateMutability:'view',inputs:[{name:'a',type:'address'}],outputs:[{type:'uint256'}]}];
for(const a of addrs){
  try{ const b=await c.readContract({address:PEA,abi:ERC20,functionName:'balanceOf',args:[a]}); const code=await c.getBytecode({address:a}); console.log(a,'PEA=',Number(b)/1e18,'isContract=',!!code); }catch(e){}
}
