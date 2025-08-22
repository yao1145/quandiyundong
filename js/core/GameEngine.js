class GameEngine {
    constructor() {
        this.width = Config.CANVAS.canvas.width;
        this.height = Config.CANVAS.canvas.height;
        this.players = [];
        this.territory = new Territory();
        this.gameState = 'menu';
        this.gameMode = 'explore';
        this.difficulty = 'medium';
        this.gameTime = 0;
        this.maxGameTime = Config.DIFFICULTY_LEVELS.medium.maxTime;
        this.lastUpdate = 0;
        this.P1_startX = Config.CANVAS.P1_startpoint.x * this.width;
        this.P1_startY = Config.CANVAS.P1_startpoint.y * this.height;
        this.P2_startX = Config.CANVAS.P2_startpoint.x * this.width;
        this.P2_startY = Config.CANVAS.P2_startpoint.y * this.height;

        // 倒计时相关
        this.countdown = 0;
        this.countdownActive = false;

        // 物理帧相关设置
        this.PHYSICS_FPS = Config.PHYSICS_SETTINGS.FPS; // 固定物理帧率
        this.PHYSICS_TIMESTEP = 1000 / this.PHYSICS_FPS;
        this.MAX_FRAME_SKIP = Config.PHYSICS_SETTINGS.MAX_FRAME_SKIP;
        this.accumulator = 0;
        this.currentTime = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;

        // 渲染优化相关(静态)
        this.renderFrameCount = 0;
        this.shouldRenderStatic = true;
        this.staticCanvas = null;
        this.staticCtx = null;
        this.staticNeedsUpdate = true;
        this.territoryChanged = false;

        // 渲染优化相关(动态)
        this.dynamicCanvas = null;
        this.dynamicCtx = null;
        this.dynamicNeedsUpdate = true;

        // 其他相关
        this.flagManager = new FlagManager(this.width, this.height);
        this.survivalManager = new SurvivalManager(this.width, this.height);
        this.uiUpdater = new UIManager(this);
    }

    init(canvas) {
        this.canvas = canvas;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = canvas.getContext('2d');
        this.renderer = new Renderer(canvas);
        this.itemManager = new ItemManager(canvas, this.flagManager);
        this.itemManager.init();

        // 创建领土渲染的离屏画布
        this.territoryCanvas = document.createElement('canvas');
        this.territoryCanvas.width = this.width;
        this.territoryCanvas.height = this.height;
        this.territoryCtx = this.territoryCanvas.getContext('2d');
        this.territoryRenderer = new Renderer(this.territoryCanvas);

        // 创建静态元素的离屏画布
        this.staticCanvas = document.createElement('canvas');
        this.staticCanvas.width = this.width;
        this.staticCanvas.height = this.height;
        this.staticCtx = this.staticCanvas.getContext('2d');
        this.staticRenderer = new Renderer(this.staticCanvas);

        // 创建动态元素的离屏画布（轨迹 + 玩家）
        this.dynamicCanvas = document.createElement('canvas');
        this.dynamicCanvas.width = this.width;
        this.dynamicCanvas.height = this.height;
        this.dynamicCtx = this.dynamicCanvas.getContext('2d');
        this.dynamicRenderer = new Renderer(this.dynamicCanvas);

        // 创建玩家
        this.players = [
            new Player(1, this.P1_startX, this.P1_startY, Config.UI_STYLES.playerColors.player1, {
                up: Config.KEY_BINDINGS.player1.up,
                down: Config.KEY_BINDINGS.player1.down,
                left: Config.KEY_BINDINGS.player1.left,
                right: Config.KEY_BINDINGS.player1.right,
                startX: this.P1_startX
            }, this.canvas),
            new Player(2, this.P2_startX, this.P2_startY, Config.UI_STYLES.playerColors.player2, {
                up: Config.KEY_BINDINGS.player2.up,
                down: Config.KEY_BINDINGS.player2.down,
                left: Config.KEY_BINDINGS.player2.left,
                right: Config.KEY_BINDINGS.player2.right,
                startX: this.P2_startX
            }, this.canvas)
        ];

        this.setDifficulty(this.difficulty);

    }

    setgamemode(mode) {
        this.gameMode = mode;
        const settings = Config.GAME_MODES;
        const setting = settings[mode];
        if (this.players) {
            this.players.forEach(player => {
                player.lives = setting.lives;
            });
        }
        if (mode === 'survival') {
            this.survivalManager.init();
            this.survivalManager.setDifficulty(this.difficulty);
        } else if (mode === 'capture') {
            this.flagManager.init();
        }
        this.staticNeedsUpdate = true; // 模式改变时需要更新静态元素
    }

    setDifficulty(level) {
        this.difficulty = level;

        const settings = Config.DIFFICULTY_LEVELS;
        const setting = settings[level];
        this.maxGameTime = setting.maxTime;

        if (this.players) {
            this.players.forEach(player => {
                player.speed = setting.speed;
                player.trailLength = setting.Length;
                player.standarddistance = Config.PLAYER_DEFAULTS.standarddistance;
            });
        }
        this.staticNeedsUpdate = true; // 难度改变时需要更新静态元素
    }

    setPlayerColor(playerId, color) {
        if (this.players[playerId - 1]) {
            this.players[playerId - 1].color = color;
            this.staticNeedsUpdate = true; // 颜色改变时需要更新静态元素
            this.dynamicNeedsUpdate = true; // 颜色改变时需要更新动态元素
        }
    }

    start() {
        this.setDifficulty(this.difficulty);
        this.setgamemode(this.gameMode);

        // 初始化倒计时
        this.countdown = 3; // 3秒倒计时
        this.countdownActive = true;
        this.gameState = 'countdown'; // 新增倒计时状态
        this.gameTime = 0;
        this.currentTime = performance.now();
        this.lastUpdate = this.currentTime;
        this.accumulator = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = this.currentTime;
        this.renderFrameCount = 0; // 重置渲染帧计数器
        this.staticNeedsUpdate = true; // 游戏开始时需要更新静态元素
        this.dynamicNeedsUpdate = true; // 游戏开始时需要更新动态元素

        // 初始化初始栏杆的计时，但实际计时将在倒计时结束后开始
        this.itemManager.initialBarrierStartTime = Date.now();

        // 重置玩家位置
        this.players[0].reset(this.P1_startX, this.P1_startY);
        this.players[1].reset(this.P2_startX, this.P2_startY);

        // 重置领土
        this.territory.reset();
        this.itemManager.reset();
        this.timer = 0;
        
        // 清空领土离屏画布
        if (this.territoryCtx) {
            this.territoryCtx.clearRect(0, 0, this.width, this.height);
        }
        this.territoryChanged = true;

        this.gameLoop();
    }

    restart() {
        this.gameState = 'menu';
        setTimeout(() => {
            this.start();
        }, 100);
    }

    gameLoop() {
        if (this.gameState !== 'playing' && this.gameState !== 'countdown' && this.gameState !== 'paused') return;

        const newTime = performance.now();
        const frameTime = Math.min(newTime - this.currentTime, 250); // 限制最大帧时间为250ms
        this.currentTime = newTime;

        // 只有在非暂停状态下才累积时间
        if (this.gameState !== 'paused') {
            this.accumulator += frameTime;
        }

        // 处理倒计时逻辑
        if (this.gameState === 'countdown') {
            this.countdown -= frameTime / 1000;
            if (this.countdown <= 0) {
                this.countdownActive = false;
                this.gameState = 'playing';
                this.accumulator = 0; // 重置accumulator以避免速度异常
                this.itemManager.initialBarrierStartTime = Date.now();
            }
        }

        // 固定时间步长的物理更新（仅在游戏状态为playing时执行）
        if (this.gameState === 'playing') {
            let updateCount = 0;
            while (this.accumulator >= this.PHYSICS_TIMESTEP && updateCount < this.MAX_FRAME_SKIP) {
                this.fixedUpdate(this.PHYSICS_TIMESTEP);
                this.accumulator -= this.PHYSICS_TIMESTEP;
                updateCount++;
            }
        }

        const interpolation = this.accumulator / this.PHYSICS_TIMESTEP;// 计算插值因子（用于平滑渲染）        
        this.render(interpolation);// 渲染（可变帧率）
        this.updateFPS(); // 更新FPS计数
        this.frameCount++;
        if (this.frameCount % this.PHYSICS_FPS === 0) {
            this.renderer.cleanupExpiredCaches();// 每隔一定帧数清理一次过期缓存
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    // 固定时间步长的更新函数
    fixedUpdate(deltaTime) {
        this.timer += 1;
        if (this.timer % (2 * this.PHYSICS_FPS) === 0) {
            this.timer = 0;
        }
        this.gameTime += deltaTime;

        // 检查游戏时间 (在无限模式下不检查时间)
        if (this.gameMode !== 'infinite' && this.gameTime >= this.maxGameTime) {
            this.endGame();
            return;
        }

        // 模式特定更新
        if (this.gameMode === 'survival' && this.survivalManager) {
            this.survivalManager.update(deltaTime, this.players, this.territory);
        } else if (this.gameMode === 'capture') {
            this.flagManager.update(this.territory, this.players);
        }

        // 更新道具系统
        this.itemManager.update(deltaTime);

        // 检查道具碰撞
        this.players.forEach(player => {
            this.itemManager.checkItemCollision(player);
            this.itemManager.checkObstacleCollision(player);
        });

        // 清理过期道具
        this.itemManager.cleanup();

        // 更新玩家（传入固定的时间步长）
        this.players.forEach(player => player.fixedUpdate ? player.fixedUpdate(deltaTime) : player.update());

        // 玩家更新后，标记动态元素需要更新
        this.dynamicNeedsUpdate = true;

        // 碰撞检测
        if (this.gameMode !== "survival") {
            this.checkCollisions();
        }

        // 检测圈地
        this.players.forEach(player => {
            const newTerritory = this.territory.detectEnclosure(player);
            if (newTerritory) {
                this.territoryChanged = true;
                player.score = this.territory.calculateScore(player.id, this.canvas.width, this.canvas.height);

                // 在无限模式下，检查是否有玩家领土达到60%
                if (this.gameMode === 'infinite' && player.score >= 60) {
                    this.endGame();
                    return;
                }

                if (this.gameMode === 'capture') {
                    this.flagManager.checkCaptureInNewTerritory(newTerritory, player.id);
                }
            }
        });

        // 检查游戏结束条件
        const alivePlayers = this.players.filter(p => p.isAlive);
        if (alivePlayers.length <= 1) {
            this.endGame();
        }
    }

    checkCollisions() {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (!player.isAlive) continue;

            // 检查与其他玩家轨迹的碰撞
            for (let j = 0; j < this.players.length; j++) {
                if (i === j) continue;
                const otherPlayer = this.players[j];

                if (player.checkCollisionWithTrail(otherPlayer.trail, otherPlayer) === 'head-collision') {
                    if (this.gameMode === 'explore') {
                        player.die('与玩家头部碰撞');
                        otherPlayer.die('与玩家头部碰撞');
                        break;
                    } else if (this.gameMode === 'fight' || this.gameMode === 'infinite') {
                        otherPlayer.die('与玩家头部碰撞');
                        player.die('与玩家头部碰撞');
                        break;
                    }
                } else if (player.checkCollisionWithTrail(otherPlayer.trail, otherPlayer) === 'trail-collision') {
                    if (this.gameMode === 'explore') {
                        player.die('碰撞到玩家轨迹');
                        break
                    } else if (this.gameMode === 'fight' || this.gameMode === 'infinite') {
                        otherPlayer.die('碰撞到玩家轨迹');
                        break;
                    }
                }

                // 检查与其他玩家领土的碰撞
                const otherTerritories = this.territory.getPlayerTerritories(otherPlayer.id);
                if (!player.canEnterEnemyTerritory()) {
                    if (player.checkCollisionWithTerritory(otherTerritories)) {
                        player.die('碰撞到玩家领土');
                        break;
                    }
                }
            }
        }
    }

    // 渲染领土
    renderTerritory() {
        if (!this.territoryChanged) return;
        this.territoryCtx.clearRect(0, 0, this.width, this.height);
        this.players.forEach(player => {
            const territories = this.territory.getPlayerTerritories(player.id);
            if (territories && territories.length > 0) {
                this.territoryRenderer.drawTerritories(territories, player.id, player.color);
            }
        });
        this.territoryChanged = false;
    }

    // 渲染静态元素到离屏画布
    renderStaticElements() {
        // 清空静态画布
        this.staticCtx.clearRect(0, 0, this.width, this.height);

        // 绘制生成点
        this.players.forEach(player => {
            this.staticRenderer.drawSpawnPoint(player.startX, this.P1_startY, player.color);
        });

        // 渲染道具和障碍物
        this.staticRenderer.drawItems(this.itemManager);

        // 渲染旗帜
        if (this.gameMode === 'capture') {
            this.flagManager.render(this.staticCtx, this.players);
        }

        this.staticNeedsUpdate = false;
    }

    // 渲染动态元素到离屏画布（轨迹 + 玩家）
    renderDynamicElements(interpolation = 0) {
        // 清空动态画布
        this.dynamicCtx.clearRect(0, 0, this.width, this.height);

        // 渲染轨迹（在玩家下方）
        this.players.forEach(player => {
            if (player.trail && player.trail.length > 0) {
                this.dynamicRenderer.drawTrail(player.trail, player.color);
            }
        });

        // 渲染玩家（在轨迹上方）
        this.players.forEach(player => {
            this.dynamicRenderer.drawPlayer(player);
        });

        // 渲染AI敌人
        if (this.gameMode === 'survival') {
            this.survivalManager.render(this.dynamicCtx);
        }

        this.dynamicNeedsUpdate = false;
    }

    render(interpolation = 0) {
        this.renderer.clear();
        this.ctx.drawImage(this.territoryCanvas, 0, 0); // 第一层：绘制领土
        this.renderTerritory();
        this.ctx.drawImage(this.dynamicCanvas, 0, 0); // 第二层：绘制动态元素        
        this.ctx.drawImage(this.staticCanvas, 0, 0); // 第三层：绘制静态元素        
        this.renderFrameCount++; // 增加渲染帧计数器

        // 判断是否应该更新静态元素（每2帧更新一次，或者有变化时强制更新）
        this.shouldRenderStatic = (this.renderFrameCount % 3 === 0) || this.staticNeedsUpdate;

        // 动态元素每帧都更新
        this.shouldRenderDynamic = this.dynamicNeedsUpdate;

        // 更新静态元素（如果需要的话）
        if (this.shouldRenderStatic) {
            this.renderStaticElements();
        }

        // 更新动态元素（每帧都更新）
        if (this.shouldRenderDynamic) {
            this.renderDynamicElements(interpolation);
        }

        // 如果处于倒计时状态，绘制倒计时界面
        if (this.gameState === 'countdown' && this.countdownActive) {
            this.renderer.drawCountdown(this.countdown);
        }

        // 更新UI（每帧都更新，因为包含实时信息）
        if (this.uiUpdater) {
            this.uiUpdater.updateUI();
        }
    }

    // FPS计算
    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            // 记录暂停开始时间，用于初始栏杆和护盾计时
            if (this.itemManager) {
                this.itemManager.pauseStartTime = Date.now();
            }

            // 暂停所有玩家的护盾计时和封锁时间
            if (this.players) {
                this.players.forEach(player => {
                    if (player.shield && player.shield.isActive()) {
                        // 保存暂停时的剩余时间
                        player.shield.pausedRemainingTime = player.shield.getRemainingTime();
                        // 保存暂停开始时间
                        player.shield.pauseStartTime = Date.now();
                    }

                    // 暂停玩家的封锁时间
                    if (player.lockTime && Date.now() < player.lockTime) {
                        // 保存暂停时的剩余封锁时间
                        player.pausedLockTime = player.lockTime - Date.now();
                    }

                    // 暂停夺旗模式回家倒计时
                    if (this.gameMode === 'capture') {
                        player.pauseHomeCountdown();
                    }
                });
            }
        }
    }

    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';

            // 调整初始栏杆开始时间，以补偿暂停期间的时间
            if (this.itemManager && this.itemManager.pauseStartTime) {
                const pauseDuration = Date.now() - this.itemManager.pauseStartTime;
                this.itemManager.initialBarrierStartTime += pauseDuration;
                this.itemManager.pauseStartTime = null;
            }

            // 恢复所有玩家的护盾计时和封锁时间
            if (this.players) {
                this.players.forEach(player => {
                    if (player.shield && player.shield.pauseStartTime) {
                        // 计算暂停持续时间
                        const pauseDuration = Date.now() - player.shield.pauseStartTime;
                        // 调整护盾开始时间，以补偿暂停期间的时间
                        player.shield.startTime += pauseDuration;
                        // 清除暂停时间记录
                        player.shield.pauseStartTime = null;
                        player.shield.pausedRemainingTime = null;
                    }

                    // 恢复玩家的封锁时间
                    if (player.pausedLockTime) {
                        player.lockTime = Date.now() + player.pausedLockTime;
                        player.pausedLockTime = null;
                    }

                    // 恢复夺旗模式回家倒计时
                    if (this.gameMode === 'capture') {
                        player.resumeHomeCountdown();
                    }
                });
            }
        }
    }

    endGame() {
        this.gameState = 'gameOver';

        if (this.gameMode === 'capture') {
            const result = this.flagManager.checkVictoryCondition(this.players, this.territory);
            if (result.isDraw) {
                this.showCaptureGameOver({ isDraw: true, players: result.winner }, result.scores, result.flagCounts);
                return;
            } else {
                this.showCaptureGameOver(result.winner, result.scores, result.flagCounts);
                return;
            }
        }

        const scores = this.players.map(player => ({
            id: player.id,
            score: this.territory.calculateScore(player.id, this.canvas.width, this.canvas.height),
            isAlive: player.isAlive
        }));

        const alivePlayers = scores.filter(p => p.isAlive);
        // 如果有玩家存活，他们就是潜在的获胜者；否则，所有（已死亡的）玩家都是。
        const potentialWinners = alivePlayers.length > 0 ? alivePlayers : scores;
        // 在潜在获胜者中找到最高分
        const maxScore = Math.max(...potentialWinners.map(p => p.score));
        // 找出所有达到最高分的玩家
        const winners = potentialWinners.filter(p => p.score === maxScore);
        // 根据获胜者数量，显示游戏结束界面
        if (winners.length === 1) {
            this.showGameOver(winners[0], scores);
        } else {
            this.showGameOver({ isDraw: true, players: winners }, scores);
        }
    }

    showGameOver(winner, scores) {
        const gameOverMenu = document.getElementById('gameOverMenu');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverMessage = document.getElementById('gameOverMessage');

        if (winner.isDraw) {
            gameOverTitle.textContent = `平局`;
            gameOverMessage.textContent = `最终分数 - 玩家1: ${Math.round(scores[0].score)}%, 玩家2: ${Math.round(scores[1].score)}%`;
        } else {
            gameOverTitle.textContent = `玩家${winner.id}获胜！`;
            gameOverMessage.textContent = `最终分数 - 玩家1: ${Math.round(scores[0].score)}%, 玩家2: ${Math.round(scores[1].score)}%`;
        }
        gameOverMenu.classList.add('active');
    }

    showCaptureGameOver(winner, scores, flagCounts) {
        const gameOverMenu = document.getElementById('gameOverMenu');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverMessage = document.getElementById('gameOverMessage');

        if (winner.isDraw) {
            gameOverTitle.textContent = `平局`;
            gameOverMessage.textContent = `最终分数 - 玩家1: ${Math.round(scores[0].score)}%, 玩家2: ${Math.round(scores[1].score)}%`;
        } else {
            gameOverTitle.textContent = `玩家${winner.id}获胜！`;
            gameOverMessage.textContent = `最终分数 - 玩家1: ${Math.round(scores[0].score)}%, 玩家2: ${Math.round(scores[1].score)}%`;
            gameOverMessage.textContent += `\n旗帜 - 玩家1: ${flagCounts[1]} 玩家2: ${flagCounts[2]}`;
        }
        gameOverMenu.classList.add('active');
    }
}

// 将游戏引擎实例暴露给全局，以便Player类可以访问
window.gameEngine = null;
