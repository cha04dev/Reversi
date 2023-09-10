"use strict";

let context = null;
let socket = null;
let teban = null;
let myTeban = null;
const koma = [
    [ 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 3, 0, 0, 0, 0 ],
    [ 0, 0, 0, 1, 3, 2, 0, 0 ],
    [ 0, 0, 1, 4, 2, 0, 0, 0 ],
    [ 0, 0, 0, 0, 4, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0, 0, 0 ],
];
const colorToKoma = [ "empty", "black", "white", "red", "blue" ];

// 読み込み完了時のイベント
window.onload = () =>
{   
    // Socket接続
    socket = io.connect();

    // Socketイベント定義
    socket.on("join", (obj) => onJoin(obj)); // 参加時
    socket.on("gameStart", () => onGameStart()); // ゲーム開始時
    socket.on("update", (point) => onUpdate(point)); // 更新時

    const canvas = document.getElementById("mainCanvas");
    context = canvas.getContext("2d");

    drawBoard();
    drawKoma();
}

// 参加ボタンの処理
$("#join-screen-joinButton").on("click", () => {
    $("#join-screen-joinButton").prop("disabled", true);
    socket.emit("join", $("#join-screen-nickname").val());
});

// canvasクリックイベントの処理
$("#mainCanvas").on("click", (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 64);
    const y = Math.floor((e.clientY - rect.top) / 64);

    const puttableKoma = isPuttableKoma(x, y, myTeban + 1);
    console.log(puttableKoma);
    if (teban != null && teban == myTeban && puttableKoma.length > 0) socket.emit("click", [x, y]);
});

// canvasタッチ対応
$("#mainCanvas").on("touchend", (e) => {
    // 端末のデフォルト動作をキャンセル
    e.preventDefault();

    // タッチ終了情報を取得
    const touches = e.changedTouches;

    const rect = e.target.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 64);
    const y = Math.floor((e.clientY - rect.top) / 64);

    const puttableKoma = isPuttableKoma(x, y, myTeban + 1);
    console.log(puttableKoma);
    if (teban != null && teban == myTeban && puttableKoma.length > 0) socket.emit("click", [x, y]);
});

function onJoin(obj)
{
    for (let i = 0; i < obj.length; i++) {
        $(`#player-${i}`).children(".member-item-name").text(obj[i].nickname);
        if (obj[i].socketId == socket.id) myTeban = i;
    }
    $("#join-screen-joinNum").text(`${obj.length}/4 人が参加中`);

    if (obj.length == 4) $("#join-screen-joinButton").prop("disabled", true);
}

function onUpdate(point)
{
    isPuttableKoma(point[0], point[1], teban + 1).map((n) => putKoma(n[0], n[1], teban + 1));
    console.log(point);
    drawKoma();
    teban++;
    if (teban == 4) teban = 0;

    $("#infoMessage").text(`${$(`#player-${teban}`).children(".member-item-name").text()} の番です`);
}

function onGameStart()
{
    teban = 0;
    console.log(`${myTeban}, ${teban}`);
    $("#infoMessage").text(`${$(`#player-${teban}`).children(".member-item-name").text()} の番です`);
}

function drawBoard()
{
    context.fillStyle = "#228B22";
    context.fillRect(0, 0, 512, 512);

    // 外枠描画
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.rect(0, 0, 512, 512);
    context.stroke();

    for (let x = 0; x < 8; x++) {
        context.beginPath();
        context.moveTo(x * 64, 0);
        context.lineTo(x * 64, 512);
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.stroke();
    }

    for (let y = 0; y < 8; y++) {
        context.beginPath();
        context.moveTo(0, y * 64);
        context.lineTo(512, y * 64);
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.stroke();
    }
}

function drawKoma()
{
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            const color = colorToKoma[koma[y][x]];
            if (color != "empty")
            {
                context.beginPath();
                context.arc(x * 64 + 32, y * 64 + 32, 30, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
            }
        }
    }
}

function putKoma(x, y, color)
{
    koma[y][x] = color;
}

function isPuttableKomaDirection(x, y, dx, dy, color)
{

    // 1. もし置こうとしてる場所に駒が存在すれば、石は置けない
    if (koma[y][x] != 0) return [];

    // 2. 一つ次の方向に移動し、盤面外 or 空 or 自分の駒であれば、石は置けない
    x += dx; y += dy;
    if (x < 0 || 8 <= x || y < 0 || 8 <= y || koma[y][x] == 0 || koma[y][x] == color) return [];
    const puttable = [[x - dx, y - dy], [x, y]];

    // 3. 一つ次の方向に移動し、盤面外 or 空 であれば、石は置けない。相手の駒であれば、もう一度繰り返し。自分の駒であれば、それまでの座標を返す
    while (true)
    {
        x += dx; y += dy;
        if (x < 0 || 8 <= x || y < 0 || 8 <= y || koma[y][x] == 0) return [];

        if (koma[y][x] != color) {
            puttable.push([x, y]);
            continue;
        } else if (koma[y][x] == color) {
            return puttable;
        }
    }
}

function isPuttableKoma(x, y, color)
{
    const puttable = [];
    puttable.push(...isPuttableKomaDirection(x, y, -1, -1, color));
    puttable.push(...isPuttableKomaDirection(x, y, 0, -1, color));
    puttable.push(...isPuttableKomaDirection(x, y, 1, -1, color));
    puttable.push(...isPuttableKomaDirection(x, y, -1, 0, color));
    puttable.push(...isPuttableKomaDirection(x, y, 1, 0, color));
    puttable.push(...isPuttableKomaDirection(x, y, -1, 1, color));
    puttable.push(...isPuttableKomaDirection(x, y, 0, 1, color));
    puttable.push(...isPuttableKomaDirection(x, y, 1, 1, color));
    return puttable;
}