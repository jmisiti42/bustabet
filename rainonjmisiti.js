let { engine, log, CryptoJS } = require('./stresser.js');

var config = {
    maxpayout: {
        value: 90, type: 'multiplier', label: 'Maximal payout'
    },
    basebet: {
        value: 300, type: 'balance', label: 'Base bet'
    },
    minpayout: {
        value: 5, type: 'multiplier', label: 'Minimal payout'
    },
    mintimemultiplier: {
        value: 2.4, type: 'multiplier', label: 'Ratio a number should have to bet on'
    },
};

let hiddenConfigs = {
    wager: {
        value: config.basebet.value, type: 'balance', label: 'Actual bet'
    },
    payout: {
        value: config.minpayout.value, type: 'multiplier', label: 'Payout'
    },
};

let play = false,
    looseCount = 0,
    datas = { value: 0, payout: 0 },
    actualLoss = 0,
    gameBusts = [],
    stats = {
        totalGames: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        highestBet: 0,
        highestLoss: 0,
        profit: 0,
        startDate: Date.now(),
    };

if (typeof document !== 'undefined' && document.getElementsByClassName('scriptCryptoJs').length <= 0) {
    var s = document.createElement('script');
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js";
    s.className = "scriptCryptoJs";
    document.head.appendChild(s);
}

const gameBestBet = (lastHash) => {
    gameBusts = gameBusts[0] ? gameBusts : gameBustArray(lastHash);
    let res = [];
    let best = { payout: 0, value: 0 };
    for (let i = config.minpayout.value; i <= config.maxpayout.value; i++) {
        for (let x = 0; x < (5 * config.maxpayout.value); x++) {
            if (gameBusts[x].bust >= i) {
                break;
            }
            res[i] = res[i] ? res[i] + 1 : 1;
        }
    }
    res.map((bust, payout) => {
        if (bust) {
            if ((best.value) < (bust / payout))
                best = { payout, value: (bust / payout) };
        }
    });
    return best;
};

const gameBustArray = (lastHash) => {
    let gameValArray = [];
    let prevHash = null;

    for (let i = 0; i < (Math.ceil(config.mintimemultiplier.value) * config.maxpayout.value); i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : lastHash);
        let bust = gameResult(hash, '0000000000000000004d6ec16dafe9d8370958664c1dc422f452892264c59526');
        gameValArray.push({ bust });
        prevHash = hash;
    }
    return gameValArray;
}

const gameResult = (seed, salt) => {
    const nBits = 52; // number of most significant bits to use
  
    // 1. HMAC_SHA256(message=seed, key=salt)
    const hmac = CryptoJS.HmacSHA256(CryptoJS.enc.Hex.parse(seed), salt);
    seed = hmac.toString(CryptoJS.enc.Hex);
  
    // 2. r = 52 most significant bits
    seed = seed.slice(0, nBits / 4);
    const r = parseInt(seed, 16);
  
    // 3. X = r / 2^52
    let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)
  
    // 4. X = 99 / (1-X)
    X = 99 / (1 - X);
  
    // 5. return max(trunc(X), 100)
    const result = Math.floor(X);
    return Math.max(1, result / 100);
};

engine.on('GAME_STARTING', onGameStarted);
engine.on('GAME_ENDED', onGameEnded);

function onGameStarted() {
    if (play) {
        engine.bet(Math.round(hiddenConfigs.wager.value / 100) * 100, hiddenConfigs.payout.value);
        log(`betting ${Math.round(hiddenConfigs.wager.value / 100)} on ${hiddenConfigs.payout.value}x (best is ${datas.value} on ${datas.payout}x)`);
        log(`Loose counter is at ${looseCount} / ${(Math.floor(hiddenConfigs.payout.value / 5))} `);
    } else {
        log(`Not betting, no good number found. (best is ${datas.value} on ${datas.payout}x)`);
    }
}

function onGameEnded() {
    let lastGame = engine.history.first();

    if (gameBusts[0])
        gameBusts.unshift(lastGame);
    datas = gameBestBet(engine.history.first().hash);
    stats.totalGames++;
    if (lastGame.wager) {
        stats.gamesPlayed++;
        if (lastGame.cashedAt) {
            stats.gamesWon++;
            gameBusts = [];
            var profit = Math.round((hiddenConfigs.wager.value * hiddenConfigs.payout.value - hiddenConfigs.wager.value) / 100)
            log('we won', profit, 'bits');
            stats.profit += profit;
            looseCount = 0;
            actualLoss = 0;
            if (datas.value < config.mintimemultiplier.value) {
                hiddenConfigs.wager.value = 0;
                play = false;
            } else {
                hiddenConfigs.wager.value = config.basebet.value;
                hiddenConfigs.payout.value = datas.payout;
            }
        } else {
            stats.gamesLost++;
            log('we lost', Math.round(hiddenConfigs.wager.value / 100), 'bits');
            actualLoss += Math.round(hiddenConfigs.wager.value / 100);
            looseCount++;
            if (looseCount >= Math.floor(hiddenConfigs.payout.value / 5)) {
                looseCount = 0;
                hiddenConfigs.wager.value = Math.ceil(hiddenConfigs.wager.value *= 1.2);
            }
            if (hiddenConfigs.wager.value / 100 > stats.highestBet)
                stats.highestBet = Math.round(hiddenConfigs.wager.value / 100);
        }
        if (actualLoss > stats.highestLoss)
            stats.highestLoss = actualLoss;
    } else {
        if (datas.value < config.mintimemultiplier.value)
            play = false;
        else {
            play = true;
            hiddenConfigs.wager.value = config.basebet.value;
            hiddenConfigs.payout.value = datas.payout;
        }
    }
    console.table(stats);
}