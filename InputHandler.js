class InputHandler {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.pressedKeys = new Set();
        this.keyStates = new Map();
        
        this.init();
    }

    init() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 防止方向键滚动页面
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }

    // 键盘处理方法
    handleKeyDown(e) {
        if (this.keyStates.get(e.code)) return;
        
        this.keyStates.set(e.code, true);
        this.pressedKeys.add(e.code);
        
        if (this.gameEngine.gameState === 'playing') {
            this.updatePlayerMovement();
        }
        
        // ESC键直接退出游戏，关闭HTML页面
        if (e.code === 'Escape') {
            window.close();
            return;
        }
        
        // 空格键暂停/继续游戏
        if (e.code === 'Space') {
            e.preventDefault(); // 防止页面滚动
            if (this.gameEngine.gameState === 'playing') {
                if (typeof pauseGame === 'function') {
                    pauseGame();
                }
            } else if (this.gameEngine.gameState === 'paused') {
                if (typeof resumeGame === 'function') {
                    resumeGame();
                }
            }
            return;
        }
    }

    handleKeyUp(e) {
        this.keyStates.set(e.code, false);
        this.pressedKeys.delete(e.code);
        
        if (this.gameEngine.gameState === 'playing') {
            this.updatePlayerMovement();
        }
    }

    updatePlayerMovement() {
        this.gameEngine.players.forEach(player => {
            if (!player.isAlive) return;

            const controls = player.controls;
            let dx = 0, dy = 0;

            if (this.keyStates.get(controls.left)) dx = -1;
            if (this.keyStates.get(controls.right)) dx = 1;
            if (this.keyStates.get(controls.up)) dy = -1;
            if (this.keyStates.get(controls.down)) dy = 1;

            player.setDirection(dx, dy);
        });
    }

    // 清理方法
    destroy() {
        // 清理数据
        this.pressedKeys.clear();
        this.keyStates.clear();
    }
}
