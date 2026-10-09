const WALLET="0xee9790cB3960952F585379F831a89b4e00B4029A";
const NETS={base:{chainId:8453,hex:"0x2105",rpc:"https://mainnet.base.org",usdc:"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",exp:"https://basescan.org/tx/"},
 arc:{chainId:5042,hex:"0x13b2",rpc:"https://rpc.mainnet.arc.io",exp:"https://explorer.arc.io/tx/"}};
const KNOWN_ASSETS={"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913":"USDC (Base)","0x036cbd53842c5426634e7929541ec2318f3dcf7e":"USDC (Base Sepolia)"};
const NETWORK_ALIASES={"base":"eip155:8453","base-sepolia":"eip155:84532","avalanche":"eip155:43114","polygon":"eip155:137","solana":"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"};
const $=id=>document.getElementById(id);
function b64(s){s=s.trim().replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";return decodeURIComponent(escape(atob(s)));}
function parse(s){s=s.trim().replace(/^(payment-required|x-payment|payment-signature|payment-response)\s*:\s*/i,"");
 if(s.startsWith("{"))return JSON.parse(s);return JSON.parse(b64(s));}
function lint(o){const L=[];const add=(lv,m)=>L.push([lv,m]);
 if(o.x402Version===undefined)add("err","missing x402Version");else if(![1,2].includes(o.x402Version))add("warn","unexpected x402Version "+o.x402Version);
 const acc=o.accepts||(o.accepted?[o.accepted]:null);
 if(o.payload){add("ok","looks like a payment payload (X-PAYMENT / PAYMENT-SIGNATURE)");const a=o.payload.authorization;
  if(a){const now=Date.now()/1000;if(+a.validBefore<now)add("err","authorization expired (validBefore in the past)");if(+a.validAfter>now)add("warn","authorization not yet valid");
   add("ok",`authorization: ${a.from} → ${a.to}, value ${a.value}`);}
  if(!o.payload.signature)add("err","payload.signature missing");}
 if(o.success!==undefined)add("ok","looks like a settlement response; success="+o.success+(o.transaction?" tx "+o.transaction:""));
 if(acc){if(!acc.length)add("err","accepts[] is empty");
  acc.forEach((r,i)=>{const p=`accepts[${i}]`;
   ["scheme","network","payTo","asset"].forEach(k=>{if(!r[k])add("err",`${p}.${k} missing`)});
   const amt=r.amount??r.maxAmountRequired;if(amt===undefined)add("err",`${p}: no amount / maxAmountRequired`);else if(!/^\d+$/.test(String(amt)))add("err",`${p}: amount must be an integer string in atomic units`);
   if(r.network&&NETWORK_ALIASES[r.network]&&o.x402Version===2)add("warn",`${p}.network "${r.network}": v2 expects CAIP-2 ("${NETWORK_ALIASES[r.network]}")`);
   if(r.payTo&&/^0x/.test(r.payTo)&&!/^0x[0-9a-fA-F]{40}$/.test(r.payTo))add("err",`${p}.payTo is not a valid EVM address`);
   const an=r.asset&&KNOWN_ASSETS[String(r.asset).toLowerCase()];
   if(an&&amt!==undefined)add("ok",`${p}: ${r.scheme} ${Number(amt)/1e6} ${an} → ${r.payTo}`);else if(r.asset)add("warn",`${p}: asset ${r.asset} is not in the built-in list, so the human-readable amount is unknown`);
   if(r.scheme==="exact"&&r.extra&&!(r.extra.name&&r.extra.version))add("warn",`${p}.extra should carry EIP-712 name+version for EIP-3009 assets`);
   if(!r.maxTimeoutSeconds)add("warn",`${p}.maxTimeoutSeconds missing`);
   const res=r.resource||o.resource?.url||o.resource;if(!res)add("warn",`${p}: no resource URL`);});}
 if(!L.length)add("warn","no recognised x402 fields found");return L;}
function render(L){$("lint").innerHTML=L.map(([lv,m])=>`<div class="${lv}">${lv==="ok"?"✓":lv==="warn"?"⚠":"✗"} ${m.replace(/</g,"&lt;")}</div>`).join("");}
let last=[];
function run(){const lines=isPro()?$("in").value.split(/\n+/).filter(x=>x.trim()):[$("in").value];last=[];let outs=[],all=[];
 for(const ln of lines){try{const o=parse(ln);const L=lint(o);last.push({o,L});outs.push(JSON.stringify(o,null,2));all.push(...L);}catch(e){all.push(["err","could not decode: "+e.message]);}}
 if(!isPro()&&$("in").value.trim().split(/\n+/).length>1)all.push(["warn","batch mode (one item per line) needs the Pro pass; only the whole box was parsed"]);
 render(all);$("out").textContent=outs.join("\n\n");}
function sample(){$("in").value=btoa(JSON.stringify({x402Version:2,error:"Payment required",resource:{url:"https://api.example.com/v1/extract"},accepts:[{scheme:"exact",network:"eip155:8453",amount:"10000",asset:"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",payTo:WALLET,maxTimeoutSeconds:300,extra:{name:"USD Coin",version:"2"}}]}));run();}
function exportMd(){if(!isPro()){$("paystat").textContent="Markdown export needs the Pro pass (see below).";$("pro").scrollIntoView();return;}
 if(!last.length)run();const md=last.map((x,i)=>`## Item ${i+1}\n\n${x.L.map(([l,m])=>`- **${l}** ${m}`).join("\n")}\n\n\`\`\`json\n${JSON.stringify(x.o,null,2)}\n\`\`\``).join("\n\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["# x402 Inspector report\n\n"+md],{type:"text/markdown"}));a.download="x402-report.md";a.click();}
function isPro(){return !!localStorage.getItem("lw_pro_tx");}
function setPro(tx,net){localStorage.setItem("lw_pro_tx",net+":"+tx);ui();}
function ui(){if(isPro()){$("paystat").innerHTML='<span class="ok">Pro unlocked ('+localStorage.getItem("lw_pro_tx").slice(0,24)+'…). Thank you!</span>';$("mdbtn").textContent="Export Markdown report";}}
async function rpc(net,method,params){const r=await fetch(NETS[net].rpc,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});const j=await r.json();if(j.error)throw new Error(j.error.message);return j.result;}
const TRANSFER="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
async function checkTx(net,tx){const n=NETS[net];const w=WALLET.toLowerCase();
 if(net==="base"){const r=await rpc(net,"eth_getTransactionReceipt",[tx]);if(!r)return "not found yet";if(r.status!=="0x1")return "transaction failed";
  const ok=r.logs.some(l=>l.address.toLowerCase()===n.usdc.toLowerCase()&&l.topics[0]===TRANSFER&&("0x"+l.topics[2].slice(26)).toLowerCase()===w&&BigInt(l.data)>=50000n);
  return ok?true:"no transfer of ≥0.05 USDC to the Lumen Works wallet in this tx";}
 const t=await rpc(net,"eth_getTransactionByHash",[tx]);if(!t)return "not found yet";const r=await rpc(net,"eth_getTransactionReceipt",[tx]);if(!r)return "pending";if(r.status!=="0x1")return "transaction failed";
 return (t.to||"").toLowerCase()===w&&BigInt(t.value)>=5n*10n**16n?true:"no transfer of ≥0.05 USDC to the Lumen Works wallet in this tx";}
async function verify(tx,net){tx=tx||$("tx").value.trim();net=net||$("net").value;if(!/^0x[0-9a-fA-F]{64}$/.test(tx)){$("paystat").textContent="Enter a valid tx hash";return;}
 $("paystat").textContent="Checking on-chain…";for(let i=0;i<20;i++){try{const r=await checkTx(net,tx);if(r===true){setPro(tx,net);return;}if(r!=="not found yet"&&r!=="pending"){$("paystat").innerHTML='<span class="err">'+r+'</span>';return;}}catch(e){$("paystat").textContent="RPC error: "+e.message;}await new Promise(s=>setTimeout(s,3000));}
 $("paystat").textContent="Still not confirmed. Try Verify again in a minute.";}
async function pay(net){const eth=window.ethereum;if(!eth){$("paystat").innerHTML="No browser wallet detected. Send 0.05 USDC on Base or Arc to <code>"+WALLET+"</code> from any wallet, then paste the tx hash above.";return;}
 const n=NETS[net];try{const [from]=await eth.request({method:"eth_requestAccounts"});
  try{await eth.request({method:"wallet_switchEthereumChain",params:[{chainId:n.hex}]});}catch(e){if(net==="arc")await eth.request({method:"wallet_addEthereumChain",params:[{chainId:n.hex,chainName:"Arc",rpcUrls:[n.rpc],nativeCurrency:{name:"USDC",symbol:"USDC",decimals:18},blockExplorerUrls:["https://explorer.arc.io"]}]});else throw e;}
  let tx;if(net==="base"){const data="0xa9059cbb"+WALLET.slice(2).toLowerCase().padStart(64,"0")+(50000).toString(16).padStart(64,"0");tx=await eth.request({method:"eth_sendTransaction",params:[{from,to:n.usdc,data}]});}
  else tx=await eth.request({method:"eth_sendTransaction",params:[{from,to:WALLET,value:"0x"+(5n*10n**16n).toString(16)}]});
  $("tx").value=tx;$("net").value=net;verify(tx,net);}catch(e){$("paystat").textContent="Payment not sent: "+(e.message||e);}}
ui();
