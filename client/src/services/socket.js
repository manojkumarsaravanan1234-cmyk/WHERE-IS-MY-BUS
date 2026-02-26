import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                autoConnect: true,
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to Socket.io server');
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from Socket.io server');
            });

            this.socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

export default new SocketService();
