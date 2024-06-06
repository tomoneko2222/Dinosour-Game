// ==UserScript==
// @name         Chrome Dino Enhanced GUI
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Add a draggable GUI with god mode, auto play, cactus delete, speed control, and invisibility to the Chrome Dino game
// @author       Copilot
// @match        https://chromedino.com/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // GUIのスタイルを定義
    const guiStyle = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 150px;
        height: 400px; /* 高さを調整 */
        background-color: black;
        color: white;
        padding: 10px;
        text-align: center;
        border-radius: 5px;
        z-index: 9999;
        cursor: move;
    `;

    // GUIの要素を作成
    const guiElement = document.createElement('div');
    guiElement.style.cssText = guiStyle;

    // タイトルを作成
    const title = document.createElement('div');
    title.innerText = 'cathub';
    title.style.cssText = 'font-size: 16px; font-weight: bold; margin-bottom: 10px;';

    // Godmodeチェックボックスとラベルのコンテナを作成
    const godmodeContainer = document.createElement('div');
    godmodeContainer.style.cssText = 'margin-bottom: 10px;';

    // Godmodeチェックボックスを作成
    const godmodeCheckbox = document.createElement('input');
    godmodeCheckbox.setAttribute('type', 'checkbox');
    godmodeCheckbox.style.cssText = 'margin-right: 5px;';

    // Godmodeテキストラベルを作成
    const godmodeLabel = document.createElement('label');
    godmodeLabel.innerText = 'godmode';
    godmodeLabel.appendChild(godmodeCheckbox);

    // Autoプレイのチェックボックスとラベルのコンテナを作成
    const autoContainer = document.createElement('div');

    // Autoプレイのチェックボックスを作成
    const autoCheckbox = document.createElement('input');
    autoCheckbox.setAttribute('type', 'checkbox');
    autoCheckbox.style.cssText = 'margin-right: 5px;';

    // Autoプレイのテキストラベルを作成
    const autoLabel = document.createElement('label');
    autoLabel.innerText = 'Auto play';
    autoLabel.appendChild(autoCheckbox);

    // Autoプレイの関数を定義
    let autoPlayId;
    function autoPlayLoop() {
        const instance = window.Runner.instance_;
        const tRex = instance.tRex;
        const currentSpeed = instance.currentSpeed;
        const jumpSpeed = 50;
        const jumpThreshold = 50 + currentSpeed * currentSpeed;

        if (tRex.jumping) {
            autoPlayId = requestAnimationFrame(autoPlayLoop);
            return;
        }

        const tRexPos = tRex.xPos;
        const obstacles = instance.horizon.obstacles;
        const nextObstacle = obstacles.find((o) => o.xPos > tRexPos);

        if (nextObstacle && nextObstacle.xPos - tRexPos <= jumpThreshold) {
            if (nextObstacle.typeConfig.type === 'PTERODACTYL') {
                if (nextObstacle.yPos === 75 && !tRex.ducking) {
                    tRex.setDuck(true);
                } else if (nextObstacle.yPos === 100) {
                    tRex.startJump(jumpSpeed);
                }
            } else {
                tRex.startJump(jumpSpeed);
            }
        } else if (tRex.ducking && obstacles[0].xPos - tRexPos < -40) {
            tRex.setDuck(false);
        }

        autoPlayId = requestAnimationFrame(autoPlayLoop);
    }

    // Godmodeの状態が変更されたときのイベントリスナーを追加
    godmodeCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // ゲームオーバー関数を無効化
            Runner.instance_.gameOver = () => {};
        } else {
            // ゲームオーバー関数を元に戻す
            Runner.instance_.gameOver = Runner.prototype.gameOver;
        }
    });

    // Autoプレイのチェックボックスの状態が変更されたときのイベントリスナーを追加
    autoCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // Autoプレイを開始
            autoPlayId = requestAnimationFrame(autoPlayLoop);
        } else {
            // Autoプレイを停止
            cancelAnimationFrame(autoPlayId);
        }
    });

    // Cactus Deleteのチェックボックスとラベルのコンテナを作成
    const cactusContainer = document.createElement('div');

    // Cactus Deleteのチェックボックスを作成
    const cactusCheckbox = document.createElement('input');
    cactusCheckbox.setAttribute('type', 'checkbox');
    cactusCheckbox.style.cssText = 'margin-right: 5px;';

    // Cactus Deleteのテキストラベルを作成
    const cactusLabel = document.createElement('label');
    cactusLabel.innerText = 'Obstacle delete';
    cactusLabel.appendChild(cactusCheckbox);

    // Cactus Deleteの状態を管理する変数
    let cactusDeleteInterval;

    // Cactus Deleteのチェックボックスの状態が変更されたときのイベントリスナーを追加
    cactusCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // Cactus Deleteを開始
            cactusDeleteInterval = setInterval(function() {
                Runner.instance_.horizon.obstacles.length = 0;
            }, 100); // 100ミリ秒 = 0.1秒
        } else {
            // Cactus Deleteを停止
            clearInterval(cactusDeleteInterval);
        }
    });

    // 速度調整のテキストボックスとラベルのコンテナを作成
    const speedContainer = document.createElement('div');
    speedContainer.style.cssText = 'margin-bottom: 10px;';

    // 速度調整のテキストボックスを作成
    const speedInput = document.createElement('input');
    speedInput.setAttribute('type', 'text');
    speedInput.style.cssText = 'width: 50px; margin-right: 5px;';
    speedInput.value = '1'; // デフォルト値を1に設定

    // 速度調整のテキストラベルを作成
    const speedLabel = document.createElement('label');
    speedLabel.innerText = 'Walk Speed';
    speedLabel.appendChild(speedInput);

    // テキストボックスの値が変更されたときのイベントリスナーを追加
    speedInput.addEventListener('input', function() {
        const value = this.value.trim();
        const numericValue = parseInt(value, 10);

        if (isNaN(numericValue)) {
            // 数字以外の入力の場合、デフォルト値に設定
            Runner.instance_.setSpeed(1);
        } else {
            // 数字の入力の場合、その値に設定
            Runner.instance_.setSpeed(numericValue);
        }
    });

    // Invisibleチェックボックスとラベルのコンテナを作成
    const invisibleContainer = document.createElement('div');

    // Invisibleチェックボックスを作成
    const invisibleCheckbox = document.createElement('input');
    invisibleCheckbox.setAttribute('type', 'checkbox');
    invisibleCheckbox.style.cssText = 'margin-right: 5px;';

    // Invisibleテキストラベルを作成
    const invisibleLabel = document.createElement('label');
    invisibleLabel.innerText = 'Invisible';
    invisibleLabel.appendChild(invisibleCheckbox);

    // Invisibleの状態が変更されたときのイベントリスナーを追加
    invisibleCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // Invisibleを開始
            Runner.instance_.tRex.groundYPos = -100;
        } else {
            // Invisibleを停止
            Runner.instance_.tRex.groundYPos = 100;
        }
    });

    // Godmodeチェックボックスとラベルをコンテナに追加
    godmodeContainer.appendChild(godmodeCheckbox);
    godmodeContainer.appendChild(godmodeLabel);

    // Autoプレイのチェックボックスとラベルをコンテナに追加
    autoContainer.appendChild(autoCheckbox);
    autoContainer.appendChild(autoLabel);

    // Cactus Deleteのチェックボックスとラベルをコンテナに追加
    cactusContainer.appendChild(cactusCheckbox);
    cactusContainer.appendChild(cactusLabel);

    // 速度調整のコンテナをGUIに追加
    speedContainer.appendChild(speedLabel);

    // Invisibleチェックボックスとラベルをコンテナに追加
    invisibleContainer.appendChild(invisibleCheckbox);
    invisibleContainer.appendChild(invisibleLabel);

    // GUIにタイトル、GodmodeとAutoプレイ、Cactus Delete、速度調整、Invisibleのコンテナを追加
    guiElement.appendChild(title);
    guiElement.appendChild(godmodeContainer);
    guiElement.appendChild(autoContainer);
    guiElement.appendChild(cactusContainer);
    guiElement.appendChild(speedContainer);
    guiElement.appendChild(invisibleContainer);

    // GUIをページに追加
    document.body.appendChild(guiElement);

    // GUIをドラッグ可能にする関数
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // カーソルの初期位置を取得
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // カーソルが動くたびに、要素が動くように設定
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // 新しいカーソルの位置を計算
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // 要素の新しい位置を設定
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // 動作を停止
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // GUIをドラッグ可能に
    makeDraggable(guiElement);
})();
