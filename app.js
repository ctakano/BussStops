const timetableData = {
    // 【行き】パークタウン入口 ➔ 東松山駅〔東口〕
    "outbound": {
        "departure": "パークタウン入口",
        "destination": "東松山駅〔東口〕行",
        "timetable": {
            "weekday": {
                "6": [15, 40], "7": [3, 15, 27, 45], "8": [0, 18, 38, 50], "9": [9, 30, 51],
                "10": [29, 51], "11": [15, 36, 54], "12": [11, 46], "13": [6, 26, 46],
                "14": [6, 26, 46], "15": [6, 28], "16": [6, 36, 53], "17": [13, 28, 46],
                "18": [9, 33, 51], "19": [11, 38], "20": [2, 25]
            },
            "holiday": {
                "6": [50], "7": [15, 45], "8": [15, 45], "9": [16, 40], "10": [10, 46],
                "11": [6, 26, 46], "12": [6, 26], "13": [6, 46], "14": [26], "15": [6, 26, 46],
                "16": [16, 56], "17": [26, 46], "18": [11, 31, 56], "19": [31, 56],
                "20": [11, 41], "21": [11, 41]
            }
        }
    },
    // 【帰り】東松山駅〔東口〕 ➔ パークタウン五領
    "inbound": {
        "departure": "東松山駅〔東口〕",
        "destination": "パークタウン五領 行",
        "timetable": {
            "weekday": {
                "6": [38, 51], "7": [24, 36, 55], "8": [8, 28, 40], "9": [19, 40],
                "10": [18, 40], "11": [4, 25, 43], "12": [0, 35, 55], "13": [15, 35, 55],
                "14": [15, 35], "15": [17, 55], "16": [25, 42], "17": [2, 17, 35, 58],
                "18": [22, 40], "19": [0, 27, 51]
            },
            "holiday": {
                "7": [4, 34], "8": [4, 34], "9": [5, 29, 59], "10": [35, 55],
                "11": [15, 35, 55], "12": [15, 55], "13": [35], "14": [15, 55],
                "15": [15, 35], "16": [5, 45], "17": [15, 35], "18": [0, 20, 45],
                "19": [20, 45], "20": [0, 30], "21": [0, 30]
            }
        }
    }
};

let currentDirection = "outbound";
let timerId = null; // タイマーを管理するID

// 📱 起動処理
window.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    
    // ⏰ 午前中(12時未満)なら「行き」、午後(12時以降)なら「帰り」を自動選択
    if (now.getHours() < 12) {
        currentDirection = "outbound";
    } else {
        currentDirection = "inbound";
    }

    // ボタンのクリックイベントを接続
    document.getElementById('tab-outbound').addEventListener('click', () => switchDirection('outbound'));
    document.getElementById('tab-inbound').addEventListener('click', () => switchDirection('inbound'));
    document.getElementById('refresh-btn').addEventListener('click', updateCountdown);

    // 🌟 最初に1回計算を行う
    updateCountdown();

    // 🌟 1秒（1000ミリ秒）ごとに自動で再計算するタイマーを始動
    timerId = setInterval(updateCountdown, 1000);
});

function switchDirection(direction) {
    currentDirection = direction;
    updateCountdown();
}

function updateCountdown() {
    // タブの選択状態（見た目）の更新
    document.getElementById('tab-outbound').classList.toggle('active', currentDirection === 'outbound');
    document.getElementById('tab-inbound').classList.toggle('active', currentDirection === 'inbound');

    const activeData = timetableData[currentDirection];
    document.getElementById('departure-station').innerText = activeData.departure;
    document.getElementById('destination-station').innerText = `↓ ${activeData.destination}`;

    const now = new Date();
    const day = now.getDay();
    const isHoliday = (day === 0 || day === 6); 
    const type = isHoliday ? 'holiday' : 'weekday';

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let foundBuses = [];
    let searchHour = currentHour;
    
    while (searchHour <= 23 && foundBuses.length < 2) {
        const mins = activeData.timetable[type][searchHour.toString()];
        if (mins) {
            for (let m of mins) {
                if (searchHour > currentHour || m >= currentMin) {
                    foundBuses.push({ hour: searchHour, min: m });
                    if (foundBuses.length >= 2) break;
                }
            }
        }
        searchHour++;
    }

    const minText = document.getElementById('minutes');
    const detailsText = document.getElementById('schedule-details');

    if (foundBuses.length === 0) {
        minText.innerText = "運行終了";
        minText.style.color = 'var(--text-ended)';
        detailsText.innerText = "本日のバスは終了しました";
        return;
    }

    const nextBus = foundBuses[0];
    const nextBusTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextBus.hour, nextBus.min, 0);
    
    // ⏳ 残り時間の正確な引き算（ミリ秒単位）
    const diffMs = nextBusTime.getTime() - now.getTime();
    
    // 万が一、1秒のズレで過去のバス（マイナス）になったら即座に次のバスへ切り替え
    if (diffMs <= 0) {
        minText.innerText = "まもなく発車";
        return;
    }

    // 総秒数から「分」と「秒」を割り出す
    const totalSeconds = Math.floor(diffMs / 1000);
    const displayMins = Math.floor(totalSeconds / 60);
    const displaySecs = totalSeconds % 60;

    // 🌟 画面表示に「秒」を追加
    minText.innerText = `あと ${displayMins} 分 ${displaySecs} 秒`;
    
    let detailsString = `次発 ${nextBus.hour}:${nextBus.min.toString().padStart(2, '0')}`;
    if (foundBuses[1]) {
        detailsString += `  /  次々発 ${foundBuses[1].hour}:${foundBuses[1].min.toString().padStart(2, '0')}`;
    }
    detailsText.innerText = detailsString;

    // 🎨 残り「総秒数」で文字色を判定
    let textColor = 'var(--text-normal)';
    if (totalSeconds <= 180) {
        textColor = 'var(--text-urgent)'; // 3分（180秒）以内は赤
    } else if (totalSeconds <= 600) {
        textColor = 'var(--text-soon)';   // 10分（600秒）以内は緑
    }
    minText.style.color = textColor;
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log('Service Worker 登録成功'))
    .catch(err => console.error('Service Worker 登録失敗', err));
}