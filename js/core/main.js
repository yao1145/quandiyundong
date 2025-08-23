// 全局变量
let gameEngine;
let inputHandler;


// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    setupEventListeners();
});

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    // 在初始化游戏引擎的地方添加
    gameEngine = new GameEngine();
    window.gameEngine = gameEngine; // 将游戏引擎实例暴露给全局
    gameEngine.init(canvas);
    inputHandler = new InputHandler(gameEngine);
}

function setupEventListeners() {
    // 双玩家颜色选择
    if (typeof colorManager !== 'undefined') {
        colorManager.setupColorSelection();
    }

    // 难度选择
    document.getElementById('difficultySelect').addEventListener('change', function() {
        gameEngine.setDifficulty(this.value);
    });

    // 游戏模式选择
    document.getElementById('gamemodeSelect').addEventListener('change', function() {
        gameEngine.setgamemode(this.value);
    });
    
    // 颜色选择页面按钮
    const colorSelectionBtn = document.getElementById('colorSelectionBtn');
    if (colorSelectionBtn) {
        colorSelectionBtn.addEventListener('click', showColorSelection);
    }
    
    const saveColorBtn = document.getElementById('saveColorBtn');
    if (saveColorBtn) {
        saveColorBtn.addEventListener('click', saveColorSelection);
    }
    
    const backFromColorBtn = document.getElementById('backFromColorBtn');
    if (backFromColorBtn) {
        backFromColorBtn.addEventListener('click', showMainMenu);
    }
}

// 页面导航函数
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showMainMenu() {
    showPage('mainMenu');
    gameEngine.endGame();
    hideOverlays();
    if (gameEngine) {
        gameEngine.gameState = 'menu';
    }
}

function showRules() {
    showPage('rulesPage');
}

function showColorSelection() {
    showPage('colorSelectionPage');
    // 重新设置颜色选择器的事件监听器
    setTimeout(() => {
        if (typeof colorManager !== 'undefined') {
            colorManager.setupColorSelection();
        }
    }, 100);
}

function saveColorSelection() {
    showMainMenu();
}

function startGame() {
    showPage('gamePage');
    
    // 设置玩家颜色
    if (typeof colorManager !== 'undefined') {
        gameEngine.setPlayerColor(1, colorManager.getPlayerColor(1));
        gameEngine.setPlayerColor(2, colorManager.getPlayerColor(2));
    }
    
    // 重新设置难度和游戏模式，确保应用用户的选择
    gameEngine.setDifficulty(document.getElementById('difficultySelect').value);
    gameEngine.setgamemode(document.getElementById('gamemodeSelect').value);
    
    // 开始游戏
    gameEngine.start();
}

// 游戏控制函数
function pauseGame() {
    if (gameEngine && gameEngine.gameState === 'playing') {
        gameEngine.pause();
        document.getElementById('pauseMenu').classList.add('active');
    }
}

function resumeGame() {
    if (gameEngine && gameEngine.gameState === 'paused') {
        gameEngine.resume();
        hideOverlays();
    }
}

function restartGame() {
    hideOverlays();
    if (gameEngine) {
        gameEngine.restart();
    }
}

function hideOverlays() {
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.classList.remove('active');
    });
}

// 键盘事件处理
document.addEventListener('keydown', function(e) {
});

// 防止页面滚动
document.addEventListener('keydown', function(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

// 窗口大小改变时调整画布
window.addEventListener('resize', function() {
});
