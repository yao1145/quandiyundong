class DayNightManager {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.initialtime = 10000; // 10秒钟初始时间
        this.cycleTime = 30000; // 30秒一个完整循环
        this.fadeTime = 5000; // 渐变时间5秒
        this.darkTime = 20000; // 黑暗时间20秒
        this.currentTime = 0;
        this.isNight = false;
        this.nightOpacity = 0;
        this.stars = [];
        this.moons = [];
        this.generateStars();
        this.generateMoons();
        this.gameMode = 'day';
    }

    init() {
        this.currentTime = 0;
        this.isNight = false;
        this.nightOpacity = 0;
    }

    generateStars() {
        this.stars = [];
        const starCount = 50;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.gameWidth,
                y: Math.random() * this.gameHeight,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
    }

    generateMoons() {
        this.moons = [
            {
                x: 50,
                y: 50,
                size: 30
            },
            {
                x: this.gameWidth - 50,
                y: this.gameHeight - 50,
                size: 25
            }
        ];
    }

    update(deltaTime) {
        // 检查游戏是否处于暂停状态
        if (window.gameEngine && window.gameEngine.gameState === 'paused') {
            return; // 如果游戏暂停，则不更新任何计时相关的逻辑
        }

        this.currentTime += deltaTime;
        this.gameMode = this.getCurrentPhase();
        
        if (this.gameMode !== 'day') {
            // 计算夜晚透明度
            if (this.gameMode === 'fadeToNight') {
                // 渐变变黑阶段
                const fadeProgress = this.getFadeProgress('fadeToNight');
                this.nightOpacity = Math.min(0.95, fadeProgress * 0.95);
            } else if (this.gameMode === 'fadeToDay') {
                // 渐变变浅阶段
                const fadeProgress = this.getFadeProgress('fadeToDay');
                this.nightOpacity = Math.max(0, 0.95 - fadeProgress * 0.95);
            } else {
                // 完全黑暗阶段
                this.nightOpacity = 0.95;
            }
        } else {
            this.isNight = false;
            this.nightOpacity = 0;
        }
    }

    render(ctx) {
        if (this.nightOpacity > 0) {
            // 绘制夜晚覆盖层
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${this.nightOpacity})`;
            ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

            // 绘制星星
            if (this.nightOpacity > 0.3) {
                const starOpacity = Math.min(1, (this.nightOpacity - 0.3) / 0.5);
                this.stars.forEach(star => {
                    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * starOpacity})`;
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // 绘制月亮
            if (this.nightOpacity > 0.2) {
                const moonOpacity = Math.min(1, (this.nightOpacity - 0.2) / 0.6);
                this.moons.forEach(moon => {
                    ctx.fillStyle = `rgba(255, 255, 200, ${moonOpacity})`;
                    ctx.beginPath();
                    ctx.arc(moon.x, moon.y, moon.size, 0, Math.PI * 2);
                    ctx.fill();

                    // 月亮光晕
                    const gradient = ctx.createRadialGradient(
                        moon.x, moon.y, moon.size,
                        moon.x, moon.y, moon.size * 2
                    );
                    gradient.addColorStop(0, `rgba(255, 255, 200, ${moonOpacity * 0.3})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(moon.x, moon.y, moon.size * 2, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            ctx.restore();
        }
    }

    reset() {
        this.currentTime = 0;
        this.isNight = false;
        this.nightOpacity = 0;
    }

    getCurrentPhase() {

        const cyclingTime = this.currentTime - this.initialtime;
        const cyclingPosition = Math.floor(cyclingTime / this.cycleTime);
        const cyclingDarkPosition = cyclingTime % this.cycleTime;
        if (cyclingPosition % 2 === 1 || cyclingTime < 0) {
            return 'day';
        } else if (cyclingDarkPosition < this.fadeTime) {
            return 'fadeToNight';
        } else if (cyclingDarkPosition < this.fadeTime + this.darkTime){
            return 'night'
        } else {
            return 'fadeToDay';
        }
    }

    getFadeProgress(gameMode) {
        const cyclingTime = this.currentTime - this.initialtime;
        const cyclingDarkPosition = cyclingTime % this.cycleTime;
        if (gameMode === 'fadeToNight') {
            return (cyclingDarkPosition) / this.fadeTime;
        } else if (gameMode === 'fadeToDay') {
            return (cyclingDarkPosition - this.fadeTime - this.darkTime) / this.fadeTime;
        }
    }

    getDayTimeRemaining() {
        const cyclingTime = this.currentTime - this.initialtime;
        const cyclingPosition = Math.floor(cyclingTime / this.cycleTime);
        if (cyclingTime < 0) {
            return Math.floor((this.initialtime - this.currentTime) / 1000);        
        } else if (cyclingPosition % 2 === 1) {
            return Math.floor(((cyclingPosition + 1) * this.cycleTime - cyclingTime) / 1000);
        } else {
            return -1;
        }
    }

    getNightTimeRemaining() {
        const cyclingTime = this.currentTime - this.initialtime;
        const cyclingPosition = Math.floor(cyclingTime / this.cycleTime);

        if (cyclingPosition % 2 === 0) {
            return Math.floor(((cyclingPosition + 1) * this.cycleTime - cyclingTime) / 1000);
        } else {
            return -1;
        }
    }
}

window.DayNightManager = DayNightManager;