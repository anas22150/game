const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// تخزين جميع اللاعبين (غرفة واحدة مشتركة)
let players = new Map(); // socketId -> player

io.on('connection', (socket) => {
    console.log('🟢 لاعب جديد:', socket.id);

    socket.on('join', (data) => {
        const newPlayer = {
            id: socket.id,
            name: data.name || 'مغامر',
            x: 0, z: 0,
            wood: 0,
            iron: 0,
            rawMeat: 0,
            cookedMeat: 0,
            hunger: 100
        };
        players.set(socket.id, newPlayer);
        socket.emit('init', {
            id: socket.id,
            players: Array.from(players.values())
        });
        socket.broadcast.emit('player_joined', newPlayer);
    });

    socket.on('move', ({ x, z }) => {
        if (players.has(socket.id)) {
            const p = players.get(socket.id);
            p.x = x;
            p.z = z;
            socket.broadcast.emit('player_moved', { id: socket.id, x, z });
        }
    });

    socket.on('update_stats', (stats) => {
        if (players.has(socket.id)) {
            const p = players.get(socket.id);
            Object.assign(p, stats);
            socket.broadcast.emit('stats_update', { id: socket.id, ...stats });
        }
    });

    socket.on('give_resource', ({ targetId, type, amount }) => {
        const giver = players.get(socket.id);
        const receiver = players.get(targetId);
        if (giver && receiver && giver[type] >= amount) {
            giver[type] -= amount;
            receiver[type] += amount;
            io.emit('stats_update', { id: socket.id, [type]: giver[type] });
            io.emit('stats_update', { id: targetId, [type]: receiver[type] });
            socket.emit('resource_given', { success: true, targetId, type, amount });
            socket.to(targetId).emit('resource_received', { fromName: giver.name, type, amount });
        }
    });

    socket.on('chat', (msg) => {
        const p = players.get(socket.id);
        if (p) io.emit('chat_message', { name: p.name, msg });
    });

    socket.on('disconnect', () => {
        players.delete(socket.id);
        io.emit('player_left', socket.id);
    });
});

app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ خادم اللعبة يعمل على http://localhost:${PORT}`));