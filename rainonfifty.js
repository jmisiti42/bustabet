let { engine, log, userInfo } = require('./stresser.js');

var config = {
    payout: {
        value: 90, type: 'multiplier', label: 'Base payout'
    },
};

let hiddenConfigs = {
    wager: {
        value: Math.max(100, Math.floor(userInfo.balance / 5000)), type: 'balance', label: 'Actual bet'
    },
    payout: {
        value: config.payout.value, type: 'multiplier', label: 'Actual payout'
    }
};

let {looseCount} = engine.history.toArray().reduce((acc, val, key) => {
    if (acc.blocked === true) return acc
    if (val.bust >= 90) {
      acc.blocked =  true;
      acc.looseCount = key + 2;
    }
    return acc;
  }, { blocked: false, looseCount: 50}),
    actualLoss = 0,
    datas = { lastGameThisWin: 0 },
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

engine.on('GAME_STARTING', onGameStarted);
engine.on('GAME_ENDED', onGameEnded);

function onGameStarted() {
    engine.bet(Math.round(hiddenConfigs.wager.value / 100) * 100, config.payout.value);
    log(`betting ${Math.round(hiddenConfigs.wager.value / 100)} on ${config.payout.value}x`);
    log(`Loose count ${looseCount}`)
}

function onGameEnded() {
    let lastGame = engine.history.first();
    datas.lastGameThisWin++;
    stats.totalGames++;
    if (lastGame.wager) {
        stats.gamesPlayed++;
        if (lastGame.cashedAt) {
            datas.lastGameThisWin = 0;
            stats.gamesWon++;
            var profit = Math.round((hiddenConfigs.wager.value * hiddenConfigs.payout.value - hiddenConfigs.wager.value) / 100)
            log('we won', profit, 'bits');
            stats.profit += profit;
            looseCount = 0;
            actualLoss = 0;
            hiddenConfigs.wager.value = Math.max(100, Math.floor(userInfo.balance / 5000));
            hiddenConfigs.payout.value = config.payout.value;
        } else {
            stats.gamesLost++;
            log('we lost', Math.round(hiddenConfigs.wager.value / 100), 'bits');
            actualLoss += Math.round(hiddenConfigs.wager.value / 100);
            looseCount++;
            if (config.payout.value <= looseCount && datas.lastGameThisWin <= 90) {
                looseCount = 0;
                hiddenConfigs.wager.value *= 2;
            } else if (datas.lastGameThisWin > 90 && looseCount >= Math.round(config.payout.value / 5)) {
                looseCount = 0;
                hiddenConfigs.wager.value = Math.ceil(hiddenConfigs.wager.value *= 1.2);
            }
            if (hiddenConfigs.wager.value / 100 > stats.highestBet)
                stats.highestBet = Math.round(hiddenConfigs.wager.value / 100);
        }
        if (actualLoss > stats.highestLoss)
            stats.highestLoss = actualLoss;
    }

    console.table(stats);
}