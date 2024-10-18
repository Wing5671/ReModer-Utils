// ==UserScript==
// @name         Re:Moder Utils
// @author       mr.kanon
// @description  Плагин расширяющий возможности модерации карт.
// @version      3.3.0
// @match        *://*.remanga.org/*
// @connect      api.remanga.org
// @connect      remanga.org
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let toggle_elements = false;
    let AutoSort = false;
    let autored = false;
    function createToggle(setting) {
        const settingContainer = document.createElement('div');
        settingContainer.className = 'setting';
        settingContainer.style.position = 'relative';

        const infoButton = document.createElement('button');
        infoButton.textContent = '❔';
        infoButton.style.cssText = `
            position: absolute;
            top: 31%;
            left: -12px;
            transform: translateY(-50%);
            background: #444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
            z-index: 1;
        `;
        infoButton.onclick = function(event) {
            showInfoPopup(setting.info, event.clientX, event.clientY);
        };
        settingContainer.appendChild(infoButton);

        const label = document.createElement('label');
        label.textContent = setting.label;
        label.style.marginLeft = '28px';
        settingContainer.appendChild(label);

        const toggle = document.createElement('div');
        toggle.className = 'toggle';
        toggle.id = setting.key;

        if (loadToggleState(setting.key)) {
            toggle.classList.add('active');
        }

        toggle.onclick = function() {
            toggle.classList.toggle('active');
            saveToggleState(setting.key, toggle.classList.contains('active'));
            if (setting.onToggle) {
                setting.onToggle(toggle.classList.contains('active'));
            }
        };

        settingContainer.appendChild(toggle);
        return settingContainer;
    }

    function saveToggleState(key, state) {
        localStorage.setItem(key, state ? "on" : "off");
    }

    function loadToggleState(key) {
        return localStorage.getItem(key) === "on";
    }
    const settings = [
        {
            key: 'autoScroll',
            label: 'Авто-скролл',
            info: 'Данный параметр отвечает за авто-скролл страницы. Можно использовать, на пример, для быстрого перемещения в конец списка.',
            onToggle: (state) => {
                if (state) {
                    AutoScroll();
                } else {
                    AutoScroll();
                }
            }
        },
        {
            key: 'AutoSort',
            label: 'Автоматическая сортировка ⚠ (check "❔") ',
            info: 'Если включить эту опцию, после каждого перехода на /requests (обновление страницы), будут автоматически установлены фильтры по времени (от нового к старому), раскрыто максимальное кол-во карт на странице (200), и тип заявки будет установлен на открытые. <br><hu1>⚠ не используйте данный параметр когда суммарное кол-во заявок превышает 200</hu1>',
            onToggle: (state) => {
                if (state) {
                    AutoSrt();
                } else {
                    AutoSrt();
                }
            }
        },
        {
            key: 'fixElements',
            label: 'Исправление ссылок',
            info: 'Заменяет стандартные ссылки на персонажа и тайтл на странице карточки на ссылки непосредственно на решке. для использования достаточно кликнуть ЛКМ по тайтлу/персонажу.',
            onToggle: (state) => {
                if (state) {
                    fixElements();
                } else {
                    fixElements();
                }
            }
        },
        {
            key: 'elementSize',
            label: 'Размер элемента',
            info: 'Позволяет узнать текущий размер элемента. Вызывается двойным кликом по элементу (иконка в модерке) и в основном сделанно для проверки персонажей (да я знаю что функция бесполезная. но может кому-то зайдет)',
            onToggle: (state) => {
                if (state) {
                    sizeElement();
                } else {
                    sizeElement();
                }
            }
        },
        {
            key: 'autoRedirect',
            label: '❌ Авто-редирект на следующую заявку',
            info: 'После принятия/отклонения заявки вы будете автоматически перенаправлены на следующую заявку в списке.',
            onToggle: (state) => {
                if (state) {
                    AutoRedirect();
                } else {
                    AutoRedirect();
                }
            }
        }
    ];

    // функции
    let autoScrollInterval;

    function AutoScroll() {
        if (autoScrollInterval) {

            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        } else {
            if (
                !window.location.href.includes('https://panel.remanga.org/requests')
            ) {
                return;
            } else {
                const scrollSpeed = 300;
                const scrollInterval = 1;
                autoScrollInterval = setInterval(() => {
                    window.scrollBy(0, scrollSpeed);
                }, scrollInterval);
            }
        }
    };

    // ------------------------------------------------------------------------- fixElements

    function fixElements() {
        toggle_elements = !toggle_elements;
    };

    // ------------------------------------------------------------------------- size

    function sizeElement() {
        sizebtn = !sizebtn;
    };

    // ------------------------------------------------------------------------- Redirect

    function AutoRedirect() {
        autored = !autored;
    };

    // ------------------------------------------------------------------------- AutoSortFunc

    function AutoSrt() {
        AutoSort = !AutoSort;
    };

    // ------------------------------------------------------------------------- characterCards

    function fetchCharacterCards(characterId) {
        if (!characterId || typeof characterId !== 'string' || !characterId.trim()) {
            console.error('Некорректный ID персонажа.');
            alert('Некорректный ID персонажа.');
            return;
        }

        const url = `https://api.remanga.org/api/inventory/character/${characterId}/cards/?page=1&count=20`;

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json"
            },
            onload: function(response) {
                if (response.status !== 200) {
                    console.error(`Ошибка запроса: ${response.status}`);
                    alert('Ошибка при получении данных о картах персонажа.');
                    return;
                }

                let data;
                try {
                    data = JSON.parse(response.responseText);
                } catch (e) {
                    console.error('Ошибка при парсинге ответа:', e);
                    alert('Ошибка при обработке данных.');
                    return;
                }

                if (!data || !Array.isArray(data.results)) {
                    console.error('Неверный формат данных или пустой ответ.');
                    alert('Данные о картах не найдены.');
                    return;
                }

                const rankCards = {
                    rank_a: [],
                    rank_b: [],
                    rank_c: [],
                    rank_d: [],
                    rank_e: [],
                    rank_f: []
                };

                data.results.forEach(card => {
                    const rank = card.rank || 'unknown';
                    const cover = card.cover && card.cover.mid ? `https://remanga.org/media/${card.cover.mid}` : null;

                    let borderColor;
                    switch (rank) {
                        case 'rank_a':
                            borderColor = "linear-gradient(135deg, white, blue)";
                            break;
                        case 'rank_b':
                            borderColor = "#FF0000";
                            break;
                        case 'rank_c':
                            borderColor = "#AFEEEE";
                            break;
                        case 'rank_d':
                            borderColor = "#FFD700";
                            break;
                        case 'rank_e':
                            borderColor = "#4682B4";
                            break;
                        case 'rank_f':
                            borderColor = "#8B4513";
                            break;
                        default:
                            borderColor = "linear-gradient(135deg, gray, darkgray)";
                            break;
                    }

                    if (rankCards.hasOwnProperty(rank)) {
                        rankCards[rank].push({
                            thumbnail: cover || 'https://static.vecteezy.com/system/resources/previews/004/141/669/original/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg',
                            borderColor: borderColor
                        });
                    }
                });

                const hasCards = Object.values(rankCards).some(cards => cards.length > 0);

                if (!hasCards) {
                    showPopup(null);
                } else {
                    showPopup(rankCards);
                }
            },
            onerror: function(error) {
                console.error('Ошибка запроса:', error);
                alert('Ошибка при выполнении запроса.');
            }
        });
    }


    // ------------------------------------------------------------------------- character

    function findCharacterId() {
        const characterLink = document.querySelector('a[href*="/characters/"][href*="/show"]');

        if (characterLink) {
            const match = characterLink.href.match(/\/characters\/(\d+)\/show/);
            if (match && match[1]) {
                const characterId = match[1];
                console.log(`Найден персонаж с ID: ${characterId}`);
                return characterId;
            }
        }

        return null;
    }

    // ------------------------------------------------------------------------- cards

    function getCards() {
        const characterId = findCharacterId();
        if (characterId) {
            fetchCharacterCards(characterId);
        } else {
            alert("Ссылка на персонажа не найдена на странице.");
        }
    };

    // ------------------------------------------------------------------------- rotateGear

    function rotateGearIcon() {
        gearButton.classList.add('rotate');
        setTimeout(() => {
            gearButton.classList.remove('rotate');
        }, 1000);
    }

    // ------------------------------------------------------------------------- fillArrow

    function fillArrow(fillColor) {
        const arrowPath = document.getElementById("SVGRepo_tracerCarrier");
        if (arrowPath) {
            arrowPath.setAttribute("stroke", fillColor);
        }
    }


    // ------------------------------------------------------------------------- infoPopUp

    function showInfoPopup(infoContent, x, y) {
        const infoOverlay = document.createElement("div");
        infoOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const infoModalWindow = document.createElement("div");
        const newX = x - 250;
        infoModalWindow.style.cssText = `
            background-color: #333;
            padding: 20px;
            color: white;
            left: ${newX}px;
            top: ${y}px;
            border-radius: 10px;
            width: 300px;
            max-width: 90%;
            position: absolute;
            animation: popupIn 0.3s forwards;
        `;

        infoModalWindow.innerHTML = `<p>${infoContent}</p>`;
        infoOverlay.appendChild(infoModalWindow);

        // Закрытие попапа при клике за его пределами
        infoOverlay.onclick = function(event) {
            if (event.target === infoOverlay) {
                infoOverlay.style.animation = "popupOut 0.1s forwards";
                setTimeout(() => {
                    document.body.removeChild(infoOverlay);
                }, 500);
            }
        };

        document.body.appendChild(infoOverlay);
    }

    // ------------------------------------------------------------------------- popUp

    function showPopup(rankCards) {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9998;
            opacity: 0;
            animation: fadeIn 0.5s forwards;
    `;

        const popup = document.createElement("div");
        popup.style.cssText = `
            position: relative;
            background-color: #2C2C2C;
            padding: 20px;
            border-radius: 10px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            overflow: auto;
            max-height: 80%;
            transform: scale(0.5);
            animation: popupIn 0.3s forwards;
    `;

        const closeButton = document.createElement("button");
        closeButton.textContent = "✖";
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #fff;
    `;

        const cardsContainer = document.createElement("div");
        cardsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
    `;
        if (!rankCards) {
            const noCardsMessage = document.createElement("p");
            noCardsMessage.textContent = "У персонажа нет карт.";
            noCardsMessage.style.cssText = `
                color: #fff;
                font-size: 18px;
                text-align: center;
            `;
            cardsContainer.appendChild(noCardsMessage);
        }
        else
        {
        Object.keys(rankCards).forEach(rank => {
            const cards = rankCards[rank];
            const lang_keys = {
                1 : 'карточка', 2 : 'карточки', 3 : 'карточки', 4 : 'карточки', 5 : 'карточек'
            }
            let word = 'карточек'

            if (cards.length > 0) {
                if (cards.length === 1) {
                    word = lang_keys[cards.length]
                } else {
                    if (
                        cards.length <= 4 && cards.length != 1
                    ) {
                        word = lang_keys[cards.length]
                    };
                    if (
                        cards.length >= 5
                    ) {
                        word = lang_keys[cards.length]
                    };
                }
                const rankRow = document.createElement("div");
                rankRow.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    margin-bottom: 10px;
            `;

                const rankTitle = document.createElement("p");
                rankTitle.textContent = `${rank.toUpperCase()}: ${cards.length} ${word}`;
                rankTitle.style.cssText = `
                    margin: 0;
                    font-size: 16px;
                    color: #fff;
            `;


                const cardsRow = document.createElement("div");
                cardsRow.style.cssText = `
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
            `;

                cards.forEach(card => {
                    const thumbnail = document.createElement("img");
                    thumbnail.src = card.thumbnail;
                    const borderColor = card.borderColor || "#fff";
                    thumbnail.style.cssText = `
                    width: 40px;
                    height: 65px;
                    object-fit: cover;
                    border-radius: 4px;
                    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                    cursor: pointer;
                    border: none;
                `;
                    thumbnail.onmouseover = function() {
                        thumbnail.style.transform = "scale(1.1)";
                        if (borderColor.startsWith("linear-gradient")) {
                            thumbnail.style.boxShadow = `0 0 10px rgba(255, 255, 255, 0.7)`;
                            thumbnail.style.borderImage = borderColor;
                            thumbnail.style.borderImageSlice = 1;
                        } else {
                            thumbnail.style.boxShadow = `0 0 10px ${borderColor}`;
                            thumbnail.style.borderColor = borderColor;
                        }
                    };

                    thumbnail.onmouseout = function() {
                        thumbnail.style.transform = "scale(1)";
                        thumbnail.style.boxShadow = "none";
                        thumbnail.style.borderImage = "none";
                        thumbnail.style.borderColor = "transparent";
                    };
                thumbnail.onclick = function() {
                showFullImage(card.thumbnail, thumbnail);
                };

                    cardsRow.appendChild(thumbnail);
                });
                rankRow.appendChild(rankTitle);
                rankRow.appendChild(cardsRow);
                cardsContainer.appendChild(rankRow);
            }
    })}

    // ------------------------------------------------------------------------- fullImage

    function showFullImage(src, thumbnail) {
        const thumbnailRect = thumbnail.getBoundingClientRect();

        const fullOverlay = document.createElement("div");
        fullOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            animation: fadeIn 0.5s forwards;
    `;

        const fullImage = document.createElement("img");
            fullImage.src = src;
            fullImage.style.cssText = `
                position: absolute;
                width: ${thumbnailRect.width}px;
                height: ${thumbnailRect.height}px;
                top: ${thumbnailRect.top}px;
                left: ${thumbnailRect.left}px;
                object-fit: cover;
                border-radius: 10px;
                transition: all 0.3s ease-in-out;
    `;

            fullImage.onload = function() {
                const naturalWidth = fullImage.naturalWidth;
                const naturalHeight = fullImage.naturalHeight;

                requestAnimationFrame(() => {
                    fullImage.style.width = `${naturalWidth}px`;
                    fullImage.style.height = `${naturalHeight}px`;
                    fullImage.style.top = "50%";
                    fullImage.style.left = "50%";
                    fullImage.style.transform = "translate(-50%, -50%)";
                });
            };

            const closeFullButton = document.createElement("div");
            closeFullButton.innerHTML = "✖";
            closeFullButton.style.cssText = `
                position: absolute;
                bottom: 180px;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 40px;
                background-color: rgba(4, 0, 0, 0.5);
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 24px;
                color: white;
                cursor: pointer;
                margin-top: 20px;
    `;

            fullOverlay.appendChild(fullImage);
            fullOverlay.appendChild(closeFullButton);
            document.body.appendChild(fullOverlay);
            closeButton.onclick = closePopup;
            fullOverlay.onclick = function(event) {
            if (event.target === fullOverlay) {
                fullImage.style.width = `${thumbnailRect.width}px`;
                fullImage.style.height = `${thumbnailRect.height}px`;
                fullImage.style.top = `${thumbnailRect.top}px`;
                fullImage.style.left = `${thumbnailRect.left}px`;
                fullImage.style.transform = "";

                fullOverlay.style.animation = "fadeOut 0.3s forwards";

                setTimeout(() => {
                    document.body.removeChild(fullOverlay);
                }, 500);
                }
            };
            closeFullButton.onclick = function () {
                fullImage.style.width = `${thumbnailRect.width}px`;
                fullImage.style.height = `${thumbnailRect.height}px`;
                fullImage.style.top = `${thumbnailRect.top}px`;
                fullImage.style.left = `${thumbnailRect.left}px`;
                fullImage.style.transform = "";

                fullOverlay.style.animation = "fadeOut 0.3s forwards";

                setTimeout(() => {
                    document.body.removeChild(fullOverlay);
                }, 500);
            };
        };

        popup.appendChild(closeButton);
        popup.appendChild(cardsContainer);
        overlay.appendChild(popup);

        function closePopup() {
            overlay.style.animation = "fadeOut 0.2s forwards";
            popup.style.animation = "popupOut 0.2s forwards";

            setTimeout(() => {
                document.body.removeChild(overlay);
        }, 300);
    }
        document.body.appendChild(overlay);

        closeButton.onclick = closePopup;
        overlay.onclick = function(event) {
            if (event.target === overlay) {
                closePopup();
            }
        };
    }

    // ------------------------------------------------------------------------- fetchTitle

    function fetchTitleInfo(id) {
        const token = document.cookie.match(/token=(.*?);/)?.[1] || "";
        const url = `https://panel.remanga.org/api/v2/panel/models/titles/${id}/`;

        const headers = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
            "access-control-allow-headers": "*",
            "access-control-allow-origin": "*",
            "authorization": `Bearer ${token}`,
            "Connection": "keep-alive",
            "content-type": "application/json",
            "Cookie": document.cookie,
            "Host": "panel.remanga.org",
            "Priority": "u=4",
            "Referer": "https://panel.remanga.org/requests/81949/show",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": navigator.userAgent
        };

        fetch(url, {
            method: "GET",
            headers: headers
        })
        .then(response => response.json())
        .then(data => {
            const dir = data?.dir;
            if (dir) {
                const newUrl = `https://remanga.org/content/${dir}`;
                window.open(newUrl, "_blank");
                console.log(`Открыта новая страница с dir: ${newUrl}`);
            } else {
                console.log('dir не найден в ответе');
            }
        })
        .catch(error => {
            console.error('Ошибка запроса:', error);
        });
    }

    // ------------------------------------------------------------------------- effect

    function createRippleEffect(button, event) {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple');
        const rect = button.getBoundingClientRect();
        ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
        ripple.style.left = `${event.clientX - rect.left - rect.width / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - rect.height / 2}px`;
        button.appendChild(ripple);
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }

    // ------------------------------------------------------------------------- overlay

    function showOverlay() {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        document.body.appendChild(overlay);

        const modalWindow = document.createElement("div");
        modalWindow.style.cssText = `
            background-color: #2C2C2C;
            padding: 20px;
            color: white;
            border-radius: 10px;
            width: 500px;
            max-width: 90%;
            text-align: center;
            animation: popupIn 0.3s forwards;
        `;

        modalWindow.innerHTML = `<h3>Настройки</h3>`;
        overlay.appendChild(modalWindow);
        settings.forEach(setting => {
            const toggleElement = createToggle(setting);
            modalWindow.appendChild(toggleElement);
        });
        overlay.onclick = function(event) {
            if (event.target === overlay) {
                overlay.style.animation = "popupOut 0.1s forwards";
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 500);
            }
        };
        overlay.style.display = "flex";
    }

    // ------------------------------------------------------------------------- buttons

    let sizebtn = false

    const cardButton = document.createElement("div");
    cardButton.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 10000;
        width: 50px;
        height: 50px;
        background-color: #2f3640;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;
        overflow: hidden;
    `;
    const gearButton = document.createElement("div");
        gearButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        width: 50px;
        height: 50px;
        background-color: #2f3640;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;
        overflow: hidden;
    `;

    const uploadCardButton = document.createElement("div");
        uploadCardButton.style.cssText = `
        position: fixed;
        bottom: 140px;
        right: 20px;
        z-index: 10000;
        width: 50px;
        height: 50px;
        background-color: #2f3640;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;
        overflow: hidden;
    `;

    uploadCardButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 14 14"><g fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 12.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H9L12.5 4z"/><path d="m9 6.5l-2-2l-2 2m2-2V10"/></g></svg>`
    gearButton.innerHTML = `<svg  version="1.0" xmlns="http://www.w3.org/2000/svg"  width="128.000000pt" height="128.000000pt" viewBox="0 0 128.000000 128.000000"  preserveAspectRatio="xMidYMid meet">  <g transform="translate(0.000000,128.000000) scale(0.050000,-0.050000)" fill="#ffffff" stroke="none"> <path d="M1060 2106 c-32 -166 -28 -161 -148 -219 l-109 -54 -116 43 c-135 50 -121 57 -246 -144 l-86 -139 103 -98 c101 -98 102 -100 102 -222 l1 -123 -103 -91 -103 -91 95 -164 c106 -183 99 -179 247 -123 l106 40 90 -44 c116 -59 131 -79 167 -225 l30 -122 189 0 189 0 31 124 c34 137 53 162 168 222 76 40 77 40 188 2 152 -52 145 -55 240 103 107 177 106 187 -15 299 -96 89 -100 97 -100 199 0 103 4 111 100 199 120 111 120 104 21 273 -104 179 -97 174 -217 129 -197 -75 -336 -3 -385 201 l-31 129 -192 6 -193 5 -23 -115z m445 -322 c247 -109 431 -484 238 -484 -75 0 -78 3 -91 80 -68 430 -730 360 -748 -80 -20 -487 653 -584 751 -108 26 121 165 133 165 13 0 -254 -252 -474 -544 -475 -170 0 -224 25 -170 79 18 18 27 47 20 65 -10 26 -19 20 -43 -30 -41 -87 -68 -81 -193 43 -433 433 56 1145 615 897z m-126 -290 c64 -32 141 -146 141 -209 0 -242 -340 -337 -450 -126 -107 207 107 438 309 335z m502 -542 c-19 -24 -16 -27 18 -18 23 6 41 1 41 -12 0 -12 -8 -22 -18 -22 -10 0 -31 -5 -46 -11 -19 -7 -28 6 -28 40 0 31 11 51 28 51 23 0 24 -6 5 -28z"/> </g> </svg> `; // Здесь вставляется SVG код
    cardButton.innerHTML = `
    <svg id="arrowIcon" viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0" transform="translate(2.040000000000001,2.040000000000001), scale(0.83)"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="1.104">
            <path id="arrowPath" fill-rule="evenodd" clip-rule="evenodd" d="M12 15.9853L15.182 12.8033L14.1213 11.7427L12.75 13.114L12.75 5.25L11.25 5.25L11.25 13.114L9.8787 11.7427L8.81804 12.8033L12 15.9853ZM12 13.864L12 13.864L12.0001 13.864L12 13.864Z" fill="#ffffff"></path>
            <path d="M18 17.25L18 18.75L6 18.75L6 17.25L18 17.25Z" fill="#ffffff"></path>
        </g>
        <g id="SVGRepo_iconCarrier"></g>
    </svg>
    `;
    document.body.appendChild(gearButton);
    document.body.appendChild(cardButton);
    document.body.appendChild(uploadCardButton);

    gearButton.onclick = function(event) {
        rotateGearIcon();
        setTimeout(() => {
            showOverlay();
        }, 300);
    };

    cardButton.onclick = function(event) {
        fillArrow('#00FF27');
        getCards();
        setTimeout(() => {
            fillArrow('#FFFFFF');
        }, 500);
    };

    uploadCardButton.onclick = function(event) {
        showCardOverlay();
    };
    
    function showCardOverlay() {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
    
        document.body.appendChild(overlay);
    
        const modalWindow = document.createElement("div");
        modalWindow.style.cssText = `
            background-color: #2C2C2C;
            padding: 20px;
            color: white;
            border-radius: 10px;
            width: 500px;
            max-width: 90%;
            text-align: center;
            animation: popupIn 0.3s forwards;
        `;
    
        overlay.appendChild(modalWindow);
        modalWindow.innerHTML = `<h3>Загрузка изображения</h3>`;
    
        const dropArea = document.createElement("div");
        dropArea.style.cssText = `
            border: 2px dashed #ffffff;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            cursor: pointer;
        `;
        dropArea.innerHTML = "Перетащите изображение сюда или нажмите, чтобы выбрать файл. Доступные форматы: <hu1>.jpg, .gif, .png, .webp, .tiff, mp4</hu1><br>Ограничение размера: <hu1>48 MB.</hu1>";
        modalWindow.appendChild(dropArea);
    
        const imgPreview = document.createElement("img");
        imgPreview.style.cssText = `
            max-width: 100%;
            display: none;
            margin-top: 10px;
        `;
        modalWindow.appendChild(imgPreview);
    
        const buttonStyles = (backgroundColor) => `
            background-color: ${backgroundColor};
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            margin: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        `;
    
        const createStyledButton = (text, onClick, styles) => {
            const button = document.createElement("button");
            button.innerText = text;
            button.style.cssText = styles;
            button.disabled = false;
            button.style.opacity = "1"; 
    
            button.onmouseover = () => {
                if (!button.disabled) {
                    button.style.opacity = "0.8";
                }
            };
            button.onmouseout = () => {
                button.style.opacity = button.disabled ? "0.5" : "1"; 
            };
            button.onclick = () => {
                if (!button.disabled) onClick(); 
            };
            return button;
        };
    
        const cancelButton = createStyledButton("Отменить", () => {
            document.body.removeChild(overlay);
        }, buttonStyles("#f44336"));
    
        const resetButton = createStyledButton("Сбросить", () => {
            imgPreview.style.display = "none";
            dropArea.innerHTML = "Перетащите изображение сюда или нажмите, чтобы выбрать файл. Доступные форматы: <hu1>.jpg, .gif, .png, .webp, .tiff, mp4</hu1><br>Ограничение размера: <hu1>48 MB.</hu1>";
        }, buttonStyles("#9E9E9E"));
    
        const confirmButton = createStyledButton("Подтвердить", () => {
            const file = dropArea.file; 
            uploadImage(file, confirmButton, cancelButton, resetButton);
        }, buttonStyles("#4CAF50")); 
    
        modalWindow.appendChild(cancelButton);
        modalWindow.appendChild(resetButton);
        modalWindow.appendChild(confirmButton);
    
        overlay.onclick = function(event) {
            if (event.target === overlay) {
                overlay.style.animation = "popupOut 0.1s forwards";
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 500);
            }
        };
    
        dropArea.onclick = function() {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (event) => {
                const file = event.target.files[0];
                handleFile(file);
            };
            input.click();
        };
    
        dropArea.ondrop = (event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            handleFile(file);
        };
    
        dropArea.ondragover = (event) => {
            event.preventDefault();
        };
    
        overlay.style.display = "flex";
    
        function handleFile(file) {
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imgPreview.src = e.target.result;
                    imgPreview.style.display = "block";
                    dropArea.innerText = "Изображение загружено. Нажмите 'Подтвердить' для отправки.";
                    dropArea.file = file;
                };
                reader.readAsDataURL(file);
            }
        }
    
        function uploadImage(file, confirmButton, cancelButton, resetButton) {
            const formData = new FormData();
            formData.append("media", file);
            formData.append("key", "00045ded801e46a4f9755c8524c5ea2f");
        
            confirmButton.disabled = true;
            resetButton.disabled = true;
            cancelButton.disabled = true; 
        
            confirmButton.style.opacity = "0.5"; 
            resetButton.style.opacity = "0.5"; 
            cancelButton.style.opacity = "0.5"; 
        
            confirmButton.innerHTML = "Загрузка...";
            confirmButton.classList.add("loading");
        
            fetch("https://thumbsnap.com/api/upload", {
                method: "POST",
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                confirmButton.innerHTML = "Подтвердить";
                confirmButton.classList.remove("loading");
        
                cancelButton.disabled = false; 
                resetButton.disabled = false; 
        
                confirmButton.style.opacity = "1"; 
                resetButton.style.opacity = "1"; 
                cancelButton.style.opacity = "1"; 
        
                if (data.success) {
                    const link = data.data.url;
                    const template = `<a target="_blank" href="${link}"><b style="--r-primary:217 91% 60%;color:hsl(var(--r-primary));transition:color 0.3s;cursor:pointer;" onmouseover="this.style.color='white'" onmouseout="this.style.color='hsl(var(--r-primary))'">Посмотреть пример</b></a>`;
                    replaceContentWithAnimation(modalWindow, template);
                } else {
                    console.error("Ошибка загрузки:", data.error.message);
                    resetButton.disabled = false;
                    cancelButton.disabled = false;
                    confirmButton.disabled = false; 
        
                    resetButton.style.opacity = "1";
                    cancelButton.style.opacity = "1";
                    confirmButton.style.opacity = "1";
                }
            })
            .catch(error => {
                console.error("Ошибка сети:", error);
                resetButton.disabled = false;
                cancelButton.disabled = false;
                confirmButton.disabled = false;
        
                resetButton.style.opacity = "1";
                cancelButton.style.opacity = "1";
                confirmButton.style.opacity = "1";
            });
        }
        function replaceContentWithAnimation(modalWindow, newContent) {
            modalWindow.style.animation = "slideOut 0.3s forwards";
            setTimeout(() => {
                modalWindow.innerHTML = `<h1 style="font-size: 32px; font-weight: bold;">Изображение загружено! Готовый шаблон:</h1>`;
                const linkElement = document.createElement("div");
                linkElement.textContent = newContent;
                modalWindow.appendChild(linkElement);
                modalWindow.style.animation = "slideIn 0.3s forwards";
            }, 300);
        }
    };              
    
    

    // hover-эффекты
    gearButton.onmouseenter = () => gearButton.classList.add('button-hover');
    gearButton.onmouseleave = () => gearButton.classList.remove('button-hover');
    cardButton.onmouseenter = () => cardButton.classList.add('button-hover');
    cardButton.onmouseleave = () => cardButton.classList.remove('button-hover');
    uploadCardButton.onmouseenter = () => uploadCardButton.classList.add('button-hover');
    uploadCardButton.onmouseleave = () => uploadCardButton.classList.remove('button-hover');
    GM_addStyle(`
        .button.loading {
            position: relative;
            position: relative;
            opacity: 0.7;
            pointer-events: none;
        }
        .button:disabled {
            background-color: #ccc; /* Серый цвет */
            cursor: not-allowed; /* Курсор "запрещено" */
            opacity: 0.6;
            }

        .button.loading::after {
            content: "";
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgb(0, 0, 0);
            border-color: rgb(87, 87, 87) transparent rgb(0, 0, 0) transparent;
            border-radius: 50%;
            animation: loading-spin 1.2s linear infinite;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        @keyframes loading-spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes rotateGear {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
                transition: ease-out;
            }
        }

        @keyframes fillArrow {
            from {
                fill: white;
            }
            to {
                fill: green;
            }
        }
        @keyframes slideOut {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); opacity: 0; }
        }
        @keyframes slideIn {
            0% { transform: translateX(50%); opacity: 0; }
            100% { transform: translateX(0); }
        }
        @keyframes rippleEffect {
        from {
            transform: scale(0);
            opacity: 0.5;
            }
        to {
            transform: scale(4);
            opacity: 0;
            }
        }

        .rotate {
            animation: rotateGear 0.5s ease-in-out forwards;
        }

        .fill {
            animation: fillArrow 1s forwards;
        }

        .resetFill {
            animation: fillArrow 5s reverse forwards;
        }
        .ripple {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.5);
            transform: scale(0);
            animation: rippleEffect 1s ease-out forwards;
        }

        .button-hover {
          filter: brightness(1.5); /* Добавляет эффект увеличения яркости */
        }
        .button svg {
         width: 100%;
         height: 100%;
         transition: transform 0.3s ease;
         } /* Плавное увеличение для SVG (если нужно) */
        .setting {
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .toggle {
            width: 40px;
            height: 20px;
            background-color: #3d3a3a;
            border-radius: 20px;
            position: relative;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .toggle:before {
            content: "";
            position: absolute;
            width: 18px;
            height: 18px;
            background-color: white;
            border-radius: 50%;
            top: 1px;
            left: 1px;
            transition: transform 0.3s;
        }
        @media only screen and (max-width: 768px) {
            ${cardButton.style.cssText}
            bottom: 10vw;
            right: 4vw;
            width: 45px;
            height: 45px;
            ${gearButton.style.cssText}
            bottom: 4vw;
            right: 4vw;
            width: 45px;
            height: 45px;
        }
        .toggle.active {
            background-color: #4cd137;
        }
        hu1 {
        color: #FFFF00;
        font-size: 24px;
        }
        .toggle.active:before {
            transform: translateX(20px);
        }
        body.dark-mode {
            background-color: #121212;
            color: white;
        }
            @keyframes popupIn {
        0% {
            transform: scale(0.5);
            opacity: 0;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    @keyframes popupOut {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: scale(1.5);
            opacity: 0;
        }
    }

    @keyframes fadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
    `);

    // ------------------------------------------------------------------------- bypasser

    let isLinkOpened = false;
    const ReactBypass = new MutationObserver(() => {
        document.querySelectorAll('.css-67o4bn a[href*="/titles/"], .css-67o4bn a[href*="/characters/"]').forEach((element) => {
            element.addEventListener('click', function (event) {
                if (isLinkOpened) {
                    return;
                }
                if (!toggle_elements) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                const ChLink = element.href.includes("/characters/");
                const TitleLink = element.href.includes("/titles/");

                if (ChLink) {
                    const match = element.href.match(/\/characters\/(\d+)\/show/);
                    if (match && match[1]) {
                        const characterId = match[1];
                        const newUrl = `https://remanga.org/character/${characterId}?tab=cards`;
                        window.open(newUrl, "_blank");
                        isLinkOpened = true;
                        console.log(`Перенаправление на: ${newUrl}`);
                    }
                } else if (TitleLink) {
                    const match = element.href.match(/\/titles\/(\d+)\/show/);
                    if (match && match[1]) {
                        const titleId = match[1];
                        fetchTitleInfo(titleId);
                        isLinkOpened = true;
                    }
                }

                setTimeout(() => { isLinkOpened = false; }, 500);
            });
        });
    });

    ReactBypass.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("dblclick", function(event) {
        const element = event.target;

        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable) {
            return;
        }

        const targetWithinSelector = document.querySelector('.css-ce1toi');
        const targetWithinSelectorImage = document.querySelector('.css-1domaf0');

        if (sizebtn && targetWithinSelector && targetWithinSelector.contains(element) || sizebtn && targetWithinSelectorImage && targetWithinSelectorImage.contains(element)) {
            const width = element.offsetWidth;
            const height = element.offsetHeight;
            const aspectRatio = (width / height).toFixed(2);
            alert(`Ширина: ${width}px, Высота: ${height}px, Соотношение сторон: ${aspectRatio}`);
        }
    });


    // ------------------------------------------------------------------------- Listeners

    document.addEventListener("click", function(event) {
        if (event.button === 0 && !isLinkOpened) {
            if (toggle_elements) {
                const link = event.target.closest('a[href*="panel.remanga.org/titles/"], a[href*="panel.remanga.org/characters/"]');

                if (link && link.href.includes("panel.remanga.org/titles/")) {
                    const match = link.href.match(/\/titles\/(\d+)\/show/);
                    if (match && match[1]) {
                        const titleId = match[1];
                        event.preventDefault();
                        fetchTitleInfo(titleId);
                        isLinkOpened = true;
                    }
                }
                if (link && link.href.includes("panel.remanga.org/characters/")) {
                    const match = link.href.match(/\/characters\/(\d+)\/show/);
                    if (match && match[1]) {
                        const characterId = match[1];
                        const newUrl = `https://remanga.org/character/${characterId}?tab=cards`;
                        event.preventDefault();
                        window.open(newUrl, "_blank");
                        isLinkOpened = true;
                        console.log(`Перенаправление на: ${newUrl}`);
                    }
                }

                setTimeout(() => { isLinkOpened = false; }, 500);
            }
        }
    });
const str = '?filter=%7B%22status%22%3A%221_open%22%2C%22type%22%3A%5B%22character_update%22%2C%22character_add%22%2C%22card_item_add%22%2C%22card_item_update%22%5D%7D&order=DESC&page=1&perPage=400&sort=created_at'
if (loadToggleState('AutoSort')) {
    if (
        !window.location.href.includes(
            'https://panel.remanga.org/requests'
        ) || window.location.href.includes(
            'https://panel.remanga.org/requests/'
        )
    ) {
        return;
    } else {
        if (
            !window.location.href.includes(str)
            )
        {
            const newUrl = window.location.origin + window.location.pathname + str;
            window.location.href = newUrl;
        }
    }
}
if (loadToggleState('fixElements')) {
    toggle_elements = true;
}
if (loadToggleState('elementSize')) {
    sizebtn = true;
}
if (loadToggleState('autoRedirect')) {
    autored = true;
    fetchRequests()
}
if (loadToggleState('autoScroll')) {
    if (
        !window.location.href.includes('https://panel.remanga.org/requests')
    ) {
        return;
    } else {
        const scrollSpeed = 300;
        const scrollInterval = 1;
        autoScrollInterval = setInterval(() => {
            window.scrollBy(0, scrollSpeed);
        }, scrollInterval);
    }
}
})();
