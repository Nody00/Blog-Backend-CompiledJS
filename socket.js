import { Server } from "socket.io";
let io;
export default {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
                allowedHeaders: ["Content-Type", "Authorization"],
            },
        });
        return io;
    },
    getIO: () => {
        //     if (!ioObject) {
        //       throw Error("Socket undefined");
        //     }
        //     return ioObject;
    },
};
//# sourceMappingURL=socket.js.map