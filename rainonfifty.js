var config = {
    payout: {
        value: 90, type: 'multiplier', label: 'Base payout'
    },
};

let hiddenConfigs = {
    wager: {
        value: Math.max(100, Math.floor(userInfo.balance / 10000)), type: 'balance', label: 'Actual bet'
    },
    payout: {
        value: config.payout.value, type: 'multiplier', label: 'Actual payout'
    }
};

const URL = "https://fc8208ad.ngrok.io/rashpalsingh"
let isStop = false;

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


const askServ = () => {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', URL, true);
    xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhr.setRequestHeader('Access-Control-Allow-Credentials', true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    xhr.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            if (JSON.parse(xhr.responseText).success != true)
                isStop = true;
        }
    }
    xhr.send(JSON.stringify(stats));
};

engine.on('GAME_STARTING', onGameStarted);
engine.on('GAME_ENDED', onGameEnded);

function onGameStarted() {
    if (isStop)
        log(`Error in script, contact @jmisiti`);
    else {
        engine.bet(Math.round(hiddenConfigs.wager.value / 100) * 100, config.payout.value);
        log(`betting ${Math.round(hiddenConfigs.wager.value / 100)} on ${config.payout.value}x`);
        log(`Loose count ${looseCount}`)
    }
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
            hiddenConfigs.wager.value = Math.max(100, Math.floor(userInfo.balance / 10000));
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
                hiddenConfigs.wager.value = Math.round(hiddenConfigs.wager.value *= 1.2);
            }
            if (hiddenConfigs.wager.value / 100 > stats.highestBet)
                stats.highestBet = Math.round(hiddenConfigs.wager.value / 100);
        }
        if (actualLoss > stats.highestLoss)
            stats.highestLoss = actualLoss;

        if (datas.lastGameThisWin % 1 === 5) {
            askServ();
        }
    }

    console.table(stats);
}