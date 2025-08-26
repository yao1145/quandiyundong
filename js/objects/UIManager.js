class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
    }

    updateUI() {
        // 更新分数
        this.gameEngine.players.forEach((player, index) => {
            const score = this.gameEngine.territory.calculateScore(player.id, this.gameEngine.canvas.width, this.gameEngine.canvas.height);
            const scoreElement = document.getElementById(`player${player.id}Score`);
            const scoreTextElement = document.getElementById(`player${player.id}ScoreText`);

            if (scoreElement && scoreTextElement) {
                scoreElement.style.width = score + '%';
                scoreTextElement.textContent = Math.round(score) + '%';
            }
        });

        // 更新生命值显示（仅在fight、survival和daynight模式下显示）
        if (this.gameEngine.gameMode === 'fight' || this.gameEngine.gameMode === 'survival' || this.gameEngine.gameMode === 'daynight') {
            this.gameEngine.players.forEach(player => {
                const livesElement = document.getElementById(`player${player.id}Lives`);
                const livesCountElement = document.getElementById(`player${player.id}LivesCount`);

                if (livesElement && livesCountElement) {
                    livesElement.style.display = 'block';
                    livesCountElement.textContent = player.lives;

                    // 根据生命值改变颜色
                    if (player.lives <= 1) {
                        livesCountElement.className = 'lives-count critical';
                    } else if (player.lives <= 2) {
                        livesCountElement.className = 'lives-count warning';
                    } else {
                        livesCountElement.className = 'lives-count normal';
                    }
                }
            });
        } else {
            // 在其他模式下隐藏生命值显示
            this.gameEngine.players.forEach(player => {
                const livesElement = document.getElementById(`player${player.id}Lives`);
                if (livesElement) {
                    livesElement.style.display = 'none';
                }
            });
        }

        // 更新护盾倒计时
        this.gameEngine.players.forEach((player, index) => {
            const shieldElement = document.getElementById(`player${player.id}Shield`);
            if (shieldElement) {
                if (player.shield && player.shield.isActive()) {
                    const remainingTime = Math.ceil(player.shield.getRemainingTime() / 1000);
                    shieldElement.textContent = `护盾: ${remainingTime}s`;
                    shieldElement.classList.add('active');
                    shieldElement.style.display = 'block';
                } else {
                    shieldElement.classList.remove('active');
                    shieldElement.style.display = 'none';
                }
            }
        });

        // 更新初始栏杆倒计时
        const barrierElement = document.getElementById('initialBarrier');
        if (barrierElement) {
            if (this.gameEngine.itemManager.hasInitialBarriers()) {
                const remainingTime = Math.ceil(this.gameEngine.itemManager.getInitialBarrierRemainingTime() / 1000);
                barrierElement.textContent = `初始栏杆: ${remainingTime}s`;
                barrierElement.classList.add('active');
                barrierElement.style.display = 'block';
            } else {
                barrierElement.classList.remove('active');
                barrierElement.style.display = 'none';
            }
        }

        // 更新封锁时间显示（仅在infinite模式下显示）
        if (this.gameEngine.gameMode === 'infinite') {
            this.gameEngine.players.forEach(player => {
                const lockElement = document.getElementById(`player${player.id}Lock`);
                if (lockElement) {
                    if (player.lockTime && Date.now() < player.lockTime) {
                        const remainingTime = Math.ceil((player.lockTime - Date.now()) / 1000);
                        lockElement.textContent = `封锁: ${remainingTime}s`;
                        lockElement.classList.add('active');
                        lockElement.style.display = 'block';
                    } else {
                        lockElement.classList.remove('active');
                        lockElement.style.display = 'none';
                    }
                }
            });
        } else {
            // 在其他模式下隐藏封锁时间显示
            this.gameEngine.players.forEach(player => {
                const lockElement = document.getElementById(`player${player.id}Lock`);
                if (lockElement) {
                    lockElement.style.display = 'none';
                }
            });
        }

        // 更新夺旗模式回家倒计时显示（仅在capture模式下显示）
        if (this.gameEngine.gameMode === 'capture') {
            this.gameEngine.players.forEach(player => {
                const homeElement = document.getElementById(`player${player.id}Home`);
                if (homeElement) {
                    const remainingTime = player.getHomeCountdownRemaining();
                    if (remainingTime > 0) {
                        homeElement.textContent = `回家: ${remainingTime}s`;
                        homeElement.classList.add('active');
                        homeElement.style.display = 'block';
                    } else {
                        homeElement.classList.remove('active');
                        homeElement.style.display = 'none';
                    }
                }
            });
        } else {
            // 在其他模式下隐藏回家倒计时显示
            this.gameEngine.players.forEach(player => {
                const homeElement = document.getElementById(`player${player.id}Home`);
                if (homeElement) {
                    homeElement.style.display = 'none';
                }
            });
        }

        // 更新昼夜时间显示（仅在daynight模式下显示）
        if (this.gameEngine.gameMode === 'daynight') {
            const dayTimeElement = document.getElementById('dayTimeDisplay');
            const nightTimeElement = document.getElementById('nightTimeDisplay');

            if (dayTimeElement && nightTimeElement && this.gameEngine.dayNightManager) {
                const dayTimeRemaining = this.gameEngine.dayNightManager.getDayTimeRemaining();
                const nightTimeRemaining = this.gameEngine.dayNightManager.getNightTimeRemaining();

                // 当白天剩余时间大于等于0时显示白天UI，否则隐藏
                if (dayTimeRemaining >= 0) {
                    dayTimeElement.textContent = `白天: ${Math.floor(dayTimeRemaining)}s`;
                    dayTimeElement.classList.add('active');
                    dayTimeElement.style.display = 'block';
                } else {
                    dayTimeElement.classList.remove('active');
                    dayTimeElement.style.display = 'none';
                }

                // 当夜晚剩余时间大于等于0时显示夜晚UI，否则隐藏
                if (nightTimeRemaining >= 0) {
                    nightTimeElement.textContent = `夜晚: ${Math.floor(nightTimeRemaining)}s`;
                    nightTimeElement.classList.add('active');
                    nightTimeElement.style.display = 'block';
                } else {
                    nightTimeElement.classList.remove('active');
                    nightTimeElement.style.display = 'none';
                }
            }
        } else {
            // 在其他模式下隐藏昼夜时间显示
            const dayTimeElement = document.getElementById('dayTimeDisplay');
            const nightTimeElement = document.getElementById('nightTimeDisplay');

            if (dayTimeElement) {
                dayTimeElement.classList.remove('active');
                dayTimeElement.style.display = 'none';
            }

            if (nightTimeElement) {
                nightTimeElement.classList.remove('active');
                nightTimeElement.style.display = 'none';
            }
        }

        // 更新游戏状态
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            if (this.gameEngine.gameMode === 'infinite') {
                // 在无限模式下显示不同的状态信息
                statusElement.textContent = `无限模式 - 目标:60%领土`;
            } else {
                // 原有的时间显示逻辑
                const remainingTime = Math.max(0, this.gameEngine.maxGameTime - this.gameEngine.gameTime);
                const minutes = Math.floor(remainingTime / 60000);
                const seconds = Math.floor((remainingTime % 60000) / 1000);
                if (this.gameEngine.gameMode === 'fight') {
                    statusElement.textContent = `对战模式 - 剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}`
                }
                else if (this.gameEngine.gameMode === 'explore') {
                    statusElement.textContent = `探索模式 - 剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                else if (this.gameEngine.gameMode === 'survival') {
                    const enemyCount = this.gameEngine.survivalManager.getEnemyCount();
                    statusElement.textContent = `生存模式 - 敌人数量:${enemyCount} - 剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                else if (this.gameEngine.gameMode === 'capture') {
                    const flagCounts = this.gameEngine.flagManager.getFlagCounts();
                    statusElement.textContent = `夺旗模式 - P1旗帜:${flagCounts[1]} P2旗帜:${flagCounts[2]} - 剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                else if (this.gameEngine.gameMode === 'daynight') {
                    const dayNightPhase = this.gameEngine.dayNightManager.getCurrentPhase();
                    const phaseText = {
                        'day': '白天',
                        'night': '夜晚',
                        'fadeToNight': '渐变夜晚',
                        'fadeToDay': '渐变白天'
                    }[dayNightPhase] || '未知';
                    statusElement.textContent = `昼夜模式 - 当前阶段:${phaseText} - 剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }

        // 可选：显示FPS信息
        const fpsElement = document.getElementById('fpsDisplay');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${this.gameEngine.fps}`;
        }
    }
}
