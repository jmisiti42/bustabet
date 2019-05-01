const { values } = require('./1M5');
const process = require('process');
const log = console.log;
const CryptoJS = require("crypto-js");

const NUM_GAMES = 1499999;

const listeners = {
  aListener: null,
  execA: (val) =>{
    listeners.aListener(val);
  },
  registerListenerA: (listener) => {
    listeners.aListener = listener;
    if (listeners.aListener && listeners.bListener) start();
  },

  bListener: null,
  execB: (val) =>{
    listeners.bListener(val);
  },
  registerListenerB: (listener) => {
    listeners.bListener = listener;
    if (listeners.aListener && listeners.bListener) start()
  },
}

const state = {
  currentBet: 0,
  currentPayout: 0,
  didWePlay: false,
  cashedAt: 0,
  wager: null,
  hash: null,
}

let currentIndex = 0;

genHistory = () => values.slice(currentIndex + 1, currentIndex + 51).map(v => ({ bust: v.bust }))
genLastGame = () => ({ bust: values[currentIndex].bust, wager: state.didWePlay, cashedAt: state.cashedAt, hash: values[currentIndex].hash })
resetBet = () => {
  state.didWePlay = false;
  state.wager = null;
  state.cashedAt = 0;
}
genBet = (bet, payout) => {
  state.currentBet = bet;
  state.currentPayout = payout;
  state.didWePlay = true;
  if (values[currentIndex].bust >= payout) {
    state.cashedAt = payout;
  }
}

const engine = {
  on: (str, listener) => str === 'GAME_STARTING' ? listeners.registerListenerA(listener) : listeners.registerListenerB(listener),
  bet: (bet, payout) => genBet(bet, payout),
  history: {
    toArray: () => genHistory(),
    first: () => genLastGame(),
  }
}
start = () => values.forEach((val, key) => {
  if (key >= NUM_GAMES) {
    return;
  }
  resetBet()
  listeners.execA();
  listeners.execB();
  currentIndex++
  console.error(currentIndex);
});

module.exports = {
  engine,
  userInfo: { simulatedBalance: 1000000, balance: 10000 },
  log,
  CryptoJS,
}

