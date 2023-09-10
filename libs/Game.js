"use strict";

module.exports = class Game
{
    constructor(io)
    {
        const players = [];

        io.on("connection", (socket) => {
            console.log(`[${socket.id}]新規接続を受け入れました`);
            // クライアントに通知
            socket.emit("join", players);

            socket.on("disconnect", () => {
                console.log(`[${socket.id}]切断しました`);
            });

            socket.on("join", (nickname) => {
                console.log(`[${nickname} - ${socket.id}]参加しました`);

                players.push({ socketId: socket.id, nickname, teban: players.length });
                console.log(players.length);

                // クライアントに通知
                io.emit("join", players);

                // もし4人揃ったら、gameStartを送る
                if (players.length == 4) io.emit("gameStart");
            });

            socket.on("click", (point) => {
                io.emit("update", point);
            })
        });
    }
}