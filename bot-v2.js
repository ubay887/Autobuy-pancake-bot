const ethers = require('ethers');

var fs = require("fs") ;
var file="botv2.html" ;
const addresses = {
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  recipient: 'your address here'
}

const mnemonic = 'your private keys here';
const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
const wallet = new ethers.Wallet(mnemonic);
const account = wallet.connect(provider);
const factory = new ethers.Contract(
  addresses.factory,
  ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
  account
);
const router = new ethers.Contract(
  addresses.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

function myWriteFile(file, content) {
  fs.appendFile(file, content, function (err) {
    if (err) return console.log(err) ;
  });
} ;

console.log(Date() + '    BOT STARTED');
factory.on('PairCreated', async (token0, token1, pairAddress) => {

    //The quote currency needs to be WBNB (we will pay with WBNB)
    let tokenIn, tokenOut;
    if(token0 == addresses.WBNB) {
      tokenIn = token0;
      tokenOut = token1;
    }

    if(token1 == addresses.WBNB) {
      tokenIn = token1;
      tokenOut = token0;
    }

    //The quote currency is not WBNB
    if(typeof tokenIn === 'undefined') {
      return;
    }

var content = (Date() + `    New pair detected </br>
    ================= </br>
    tokenout: <a href="https://bscscan.com/address/${tokenIn}">https://bscscan.com/address/${tokenIn}</a> </br>
    tokenin: <a href="https://bscscan.com/address/${tokenOut}">https://bscscan.com/address/${tokenOut}</a> </br>
    pairAddress: <a href="https://bscscan.com/address/${pairAddress}">https://bscscan.com/address/${pairAddress}</a> </br>
  `) ;
  myWriteFile(file, content) ;
  console.log(Date() + `    New pair detected

    =================
    tokenIn: ${tokenIn}
    tokenOut: ${tokenOut}
    pairAddress: ${pairAddress}
  `);
  //We buy for 0.015 WBNB of the new token
  const amountIn = ethers.utils.parseUnits('0.005', 'ether');
try {
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
  //Our execution price will be a bit different, we need some flexbility
  const amountOutMin = await amounts[1].sub(amounts[1].div(10));
    console.log(Date() + `    Buying new token
    =================
    tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
    tokenOut: ${amountOutMin.toString()} ${tokenOut}
  `);
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [tokenIn, tokenOut],
    addresses.recipient,
    Date.now() + 1000 * 60 * 10,
   {
        gasLimit: 500000,
        gasPrice: ethers.utils.parseUnits("5", "gwei")
    }
  );
  const receipt = await tx.wait();
  console.log('Transaction receipt');
  console.log(receipt);
} catch(error) {
console.log(Date() + '    Error buying, probably no liquidity');
}
});
