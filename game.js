class ConsoleGame {
    constructor() {
        this.output = document.getElementById('output');
        this.commandInput = document.getElementById('commandInput');
        this.promptElement = document.getElementById('prompt');
        this.virtualControls = document.getElementById('virtualControls');
        this.headerVersion = document.getElementById('header-version');
        this.gameVersion = "v0.0.3";

        this.gameState = {
            started: false,
            location: 'начало',
            inventory: [],
            health: 100,
            energy: 50,
            level: 1,
            currentUser: null,
            users: {
                'admin': {
                    username: 'admin',
                    isOnline: true,
                    isAdmin: true,
                    registeredAt: new Date().toISOString()
                }
            },
            onlineUsers: ['admin']
        };

        this.commandHistory = [];
        this.historyIndex = -1;
        this.isTyping = false;
        this.typingQueue = [];

        this.commands = {
            'start': this.startGame.bind(this),
            'help': this.showHelp.bind(this),
            'about': this.showAbout.bind(this),
            'status': this.showStatus.bind(this),
            'inventory': this.showInventory.bind(this),
            'clear': this.clearScreen.bind(this),
            'move': this.move.bind(this),
            'look': this.lookAround.bind(this),
            'register': this.registerUser.bind(this),
            'login': this.loginUser.bind(this),
            'logout': this.logoutUser.bind(this),
            'showusers': this.showUsers.bind(this),
            'whoami': this.whoami.bind(this)
        };

        this.init();
    }

    init() {
        // Фокус на поле ввода
        this.commandInput.focus();

        this.headerVersion.textContent = this.gameVersion;
        document.title = `Console ${this.gameVersion}`

        // Обработчик ввода команд
        this.commandInput.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Enter':
                    if (!e.shiftKey) {
                        e.preventDefault();
                        this.processCommand(this.commandInput.value.trim());
                        this.commandInput.value = '';
                        this.autoResize();
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateHistory(-1);
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateHistory(1);
                    break;

                case ' ': // Пробел
                    if (e.ctrlKey || e.altKey || e.shiftKey) {
                        e.preventDefault();
                        this.processCommand('look');
                    }
                    break;
            }
        });

        // Автоматическое изменение размера textarea
        this.commandInput.addEventListener('input', () => {
            this.autoResize();
        });

        // Обработчик виртуальных кнопок
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                this.handleVirtualControl(action);
            });

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = e.target.getAttribute('data-action');
                this.handleVirtualControl(action);
            });
        });

        // Автофокус при клике в любое место
        document.addEventListener('click', () => {
            this.commandInput.focus();
        });

        // Инициализация размера textarea
        this.autoResize();

        this.updatePrompt();
        this.print('Введите <span class="command">help</span> для списка команд.', 'system');
        this.print('Для начала работы введите <span class="command">register имя_пользователя</span>', 'system');
    }

    updatePrompt() {
        const username = this.gameState.currentUser ? this.gameState.currentUser : 'user';
        this.promptElement.textContent = `${username}@terminal:~$ `;
    }

    autoResize() {
        this.commandInput.style.height = 'auto';
        this.commandInput.style.height = this.commandInput.scrollHeight + 'px';
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        this.historyIndex += direction;

        if (this.historyIndex < 0) {
            this.historyIndex = -1;
            this.commandInput.value = '';
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length - 1;
        } else {
            this.commandInput.value = this.commandHistory[this.historyIndex];
        }

        this.autoResize();
    }

    processCommand(input) {
        if (!input) return;

        // Добавляем команду в историю
        this.commandHistory.push(input);
        this.historyIndex = this.commandHistory.length;

        // Добавляем команду в историю вывода с правильным промптом
        const username = this.gameState.currentUser ? this.gameState.currentUser : 'user';
        this.print(`<span class="prompt">${username}@terminal:~$ </span> ${input}`);

        const parts = input.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (this.commands[command]) {
            this.commands[command](args);
        } else {
            this.print(`Ошибка: команда '${command}' не найдена. Введите 'help' для справки.`, 'error');
        }
    }

    handleVirtualControl(action) {
        const actions = {
            'up': 'move север',
            'down': 'move юг',
            'left': 'move запад',
            'right': 'move восток',
            'action': 'look'
        };

        if (actions[action]) {
            this.processCommand(actions[action]);
        }

        this.commandInput.focus();
    }

    // === СИСТЕМА ПОЛЬЗОВАТЕЛЕЙ ===

    registerUser(args) {
        if (args.length === 0) {
            this.print('Использование: register [имя_пользователя]', 'error');
            return;
        }

        const username = args[0].toLowerCase();

        // Проверка валидности имени пользователя
        if (!/^[a-z0-9_]{3,15}$/.test(username)) {
            this.print('Ошибка: имя пользователя должно содержать только латинские буквы, цифры и подчеркивания, длиной от 3 до 15 символов.', 'error');
            return;
        }

        if (this.gameState.users[username]) {
            this.print(`Ошибка: пользователь '${username}' уже существует.`, 'error');
            return;
        }

        // Регистрация нового пользователя
        this.gameState.users[username] = {
            username: username,
            isOnline: false,
            isAdmin: false,
            registeredAt: new Date().toISOString()
        };

        this.print(`Пользователь '${username}' успешно зарегистрирован.`, 'success');
        this.print(`Теперь вы можете войти командой: <span class="command">login ${username}</span>`, 'system');
    }

    loginUser(args) {
        if (args.length === 0) {
            this.print('Использование: login [имя_пользователя]', 'error');
            return;
        }

        const username = args[0].toLowerCase();

        if (!this.gameState.users[username]) {
            this.print(`Ошибка: пользователь '${username}' не найден.`, 'error');
            this.print(`Зарегистрируйтесь командой: <span class="command">register ${username}</span>`, 'system');
            return;
        }

        // Выход из текущего пользователя
        if (this.gameState.currentUser) {
            this.gameState.users[this.gameState.currentUser].isOnline = false;
            const index = this.gameState.onlineUsers.indexOf(this.gameState.currentUser);
            if (index > -1) {
                this.gameState.onlineUsers.splice(index, 1);
            }
        }

        // Вход под новым пользователем
        this.gameState.currentUser = username;
        this.gameState.users[username].isOnline = true;

        if (!this.gameState.onlineUsers.includes(username)) {
            this.gameState.onlineUsers.push(username);
        }

        this.updatePrompt();
        this.print(`Вход выполнен как: <span class="current-user">${username}</span>`, 'success');

        if (username === 'admin') {
            this.print('<span class="admin-badge">⚡ АДМИНИСТРАТОР СИСТЕМЫ</span>', 'system');
        }
    }

    logoutUser() {
        if (!this.gameState.currentUser) {
            this.print('Ошибка: вы не вошли в систему.', 'error');
            return;
        }

        const username = this.gameState.currentUser;
        this.gameState.users[username].isOnline = false;

        const index = this.gameState.onlineUsers.indexOf(username);
        if (index > -1) {
            this.gameState.onlineUsers.splice(index, 1);
        }

        this.print(`Выход из пользователя: <span class="current-user">${username}</span>`, 'success');
        this.gameState.currentUser = null;
        this.updatePrompt();
    }

    showUsers() {
        const users = Object.values(this.gameState.users);

        if (users.length === 0) {
            this.print('В системе нет зарегистрированных пользователей.', 'system');
            return;
        }

        let output = '<div class="user-system">';
        output += '<span class="title">=== ЗАРЕГИСТРИРОВАННЫЕ ПОЛЬЗОВАТЕЛИ ===</span><br>';

        users.forEach(user => {
            const status = user.isOnline ?
                `<span class="user-online">● онлайн</span>` :
                `<span class="user-offline">● оффлайн</span>`;

            const adminBadge = user.isAdmin ?
                '<span class="admin-badge">[ADMIN]</span>' : '';

            const currentIndicator = user.username === this.gameState.currentUser ?
                '<span class="current-user"> ← ВЫ</span>' : '';

            const regDate = new Date(user.registeredAt).toLocaleDateString();

            output += `• <strong>${user.username}</strong> ${adminBadge} ${status} ${currentIndicator}<br>`;
            output += `&nbsp;&nbsp;Зарегистрирован: ${regDate}<br>`;
        });

        output += `</div>`;
        output += `<div class="system-message">Всего пользователей: ${users.length} | Онлайн: ${this.gameState.onlineUsers.length}</div>`;

        this.print(output, 'system');
    }

    whoami() {
        if (this.gameState.currentUser) {
            const user = this.gameState.users[this.gameState.currentUser];
            const regDate = new Date(user.registeredAt).toLocaleDateString();

            let output = `<div class="user-system">`;
            output += `<span class="title">=== ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ ===</span><br>`;
            output += `Имя: <span class="current-user">${user.username}</span><br>`;
            output += `Статус: <span class="user-online">● онлайн</span><br>`;
            output += `Роль: ${user.isAdmin ? '<span class="admin-badge">Администратор</span>' : 'Пользователь'}<br>`;
            output += `Зарегистрирован: ${regDate}<br>`;
            output += `</div>`;

            this.print(output, 'system');
        } else {
            this.print('Вы не вошли в систему. Используйте <span class="command">login</span> или <span class="command">register</span>.', 'error');
        }
    }

    // === ОСНОВНЫЕ КОМАНДЫ ===

    startGame() {
        if (!this.gameState.currentUser) {
            this.print('Ошибка: для начала игры необходимо войти в систему.', 'error');
            this.print('Используйте команды: <span class="command">register имя_пользователя</span> или <span class="command">login имя_пользователя</span>', 'system');
            return;
        }

        this.gameState.started = true;
        this.print('=== ЗАПУСК ИГРОВОГО МОДУЛЯ ===', 'system');
        this.print(`Добро пожаловать, <span class="current-user">${this.gameState.currentUser}</span>!`, 'game');
        this.print('Вы оказываетесь в темной комнате. Вокруг тишина...', 'game');
        this.print('Что будете делать?', 'game');
        this.gameState.location = 'темная комната';
        this.showStatus();
    }

    showHelp() {
        const userCommands = this.gameState.currentUser ? `
<span class="command">whoami</span>    - Показать информацию о текущем пользователе
<br>
<span class="command">logout</span>    - Выйти из системы
<br>
<span class="command">showusers</span> - Показать всех пользователей
` : `<br>
<span class="command">register [имя]</span> - Зарегистрировать нового пользователя
<br>
<span class="command">login [имя]</span>    - Войти под пользователем
`;

        const helpText = `
<span class="title">=== ДОСТУПНЫЕ КОМАНДЫ ===</span>
<br>
<span class="system-message">СИСТЕМНЫЕ КОМАНДЫ:</span>
<br>
${userCommands}
<span class="command">start</span>      - Начать игру (требуется вход)
<br>
<span class="command">status</span>     - Показать состояние
<br>
<span class="command">inventory</span>  - Показать инвентарь
<br>
<span class="command">move [направление]</span> - Перемещение
<br>
<span class="command">look</span>       - Осмотреться вокруг
<br>
<span class="command">clear</span>      - Очистить экран
<br>
<span class="command">about</span>      - Информация о системе
<br>
<span class="command">help</span>       - Эта справка
<br><br>

<span class="system-message">Управление:</span>
<br>
- Стрелки вверх/вниз: история команд
<br>
- Пробел: обычный ввод (Ctrl+Пробел(Shift+Пробел) для осмотра)
<br>
- Виртуальные кнопки на мобильных
<br>

<span class="system-message">Текущий пользователь: ${this.gameState.currentUser ? this.gameState.currentUser : 'не авторизован'}</span>
        `;
        this.print(helpText, 'system');
    }

    showAbout() {
        const aboutText = `
<span class="title">=== КОНСОЛЬНЫЙ ТЕРМИНАЛ ${this.gameVersion} ===</span>
<br>
<span class="system-message">Добавлена система пользователей:</span>
<br>
- Регистрация и вход без паролей
<br>
- Отслеживание онлайн-пользователей
<br>
- Информация о зарегистрированных пользователях
<br>
- Динамическое изменение приглашения
<br>
<span class="system-message">Команды пользователей:</span>
<br>
• register, login, logout, whoami, showusers
<br>
<span class="system-message">Идея: текстовая приключенческая игра в виде консоли.
<br>
Автор идеи, создатель: Влад Кусь (vk.com/id284185443).
<br>
<br>
P.S.
<br>
Ещё совсем ничего не готово :)
</span>

        `;
        this.print(aboutText, 'system');
    }

    showStatus() {
        if (!this.gameState.started) {
            this.print('Сначала запустите игру командой <span class="command">start</span>', 'error');
            return;
        }

        const userInfo = this.gameState.currentUser ?
            `Пользователь: <span class="current-user">${this.gameState.currentUser}</span>` :
            'Пользователь: не авторизован';

        const status = `
<span class="title">=== СОСТОЯНИЕ СИСТЕМЫ ===</span>
${userInfo}
Локация: <span class="location">${this.gameState.location}</span>
Здоровье: ${this.gameState.health}%
Энергия: ${this.gameState.energy}%
Уровень: ${this.gameState.level}
Предметов: ${this.gameState.inventory.length}
        `;
        this.print(status, 'system');
    }

    showInventory() {
        if (!this.gameState.started) {
            this.print('Сначала запустите игру командой <span class="command">start</span>', 'error');
            return;
        }

        if (this.gameState.inventory.length === 0) {
            this.print('Инвентарь пуст.', 'system');
        } else {
            this.print('<span class="title">=== ИНВЕНТАРЬ ===</span>', 'system');
            this.gameState.inventory.forEach(item => {
                this.print(`• ${item}`, 'game');
            });
        }
    }

    clearScreen() {
        this.output.innerHTML = '';
        this.print('Экран очищен.', 'system');
    }

    move(args) {
        if (!this.gameState.started) {
            this.print('Сначала запустите игру командой <span class="command">start</span>', 'error');
            return;
        }

        const directions = ['север', 'юг', 'запад', 'восток'];
        const direction = args[0];

        if (!direction || !directions.includes(direction)) {
            this.print('Использование: move [север|юг|запад|восток]', 'error');
            return;
        }

        const locations = {
            'темная комната': {
                'север': 'коридор',
                'юг': 'склад',
                'восток': 'лаборатория',
                'запад': 'тупик'
            },
            'коридор': {
                'юг': 'темная комната',
                'север': 'выход'
            }
        };

        const currentLocation = locations[this.gameState.location];
        if (currentLocation && currentLocation[direction]) {
            const newLocation = currentLocation[direction];
            this.gameState.location = newLocation;
            this.print(`Вы переместились ${direction}. Теперь вы в: <span class="location">${newLocation}</span>`, 'success');
            this.lookAround();
        } else {
            this.print(`Вы не можете пойти ${direction}.`, 'error');
        }
    }

    lookAround() {
        if (!this.gameState.started) {
            this.print('Сначала запустите игру командой <span class="command">start</span>', 'error');
            return;
        }

        const descriptions = {
            'темная комната': 'Вы в темной комнате. На стенах видны странные символы. На полу пыль.',
            'коридор': 'Длинный коридор с тусклым освещением. В воздухе пахнет озоном.',
            'склад': 'Запыленное помещение с старыми ящиками. Кажется, здесь что-то есть...',
            'лаборатория': 'Комната с научным оборудованием. На столе лежат какие-то бумаги.',
            'тупик': 'Тупик. Стена покрыта мхом. Пути дальше нет.',
            'выход': 'ПОЗДРАВЛЯЕМ! Вы нашли выход! Игра завершена.'
        };

        const desc = descriptions[this.gameState.location] || 'Неизвестное место...';
        this.print(`<span class="location">${this.gameState.location}</span>: ${desc}`, 'game');
    }

    // === УЛУЧШЕННЫЙ МЕТОД PRINT С АНИМАЦИЕЙ ===

    print(message, type = 'normal', animate = true) {
        if (!animate) {
            // Вывод без анимации
            const line = this.createLine(message, type);
            this.output.appendChild(line);
            this.output.scrollTop = this.output.scrollHeight;
            return;
        }

        // Добавляем в очередь анимации
        this.typingQueue.push({ message, type });

        // Запускаем обработку очереди, если не запущена
        if (!this.isTyping) {
            this.processTypingQueue();
        }
    }

    processTypingQueue() {
        if (this.typingQueue.length === 0) {
            this.isTyping = false;
            return;
        }

        this.isTyping = true;
        const { message, type } = this.typingQueue.shift();

        // Создаем элемент для анимации
        const line = this.createLine('', type);
        line.classList.add('typing-animation');
        this.output.appendChild(line);

        // Начинаем анимацию
        this.typeText(line, message, () => {
            // Убираем анимацию курсора после завершения
            line.classList.remove('typing-animation');

            // Прокрутка вниз
            this.output.scrollTop = this.output.scrollHeight;

            // Обрабатываем следующее сообщение в очереди
            setTimeout(() => {
                this.processTypingQueue();
            }, 50);
        });
    }

    createLine(message, type) {
        const line = document.createElement('div');

        switch(type) {
            case 'system':
                line.className = 'system-message';
                break;
            case 'error':
                line.className = 'error-message';
                break;
            case 'success':
                line.className = 'success-message';
                break;
            case 'game':
                line.className = 'game-output';
                break;
            default:
                line.className = 'output-line';
        }

        // Не устанавливаем innerHTML здесь - это сделает анимация
        line.textContent = ''; // Начинаем с пустого содержимого
        return line;
    }

    typeText(element, html, callback) {
        // Парсим HTML на токены: текст и теги
        const tokens = this.parseHTML(html);
        let tokenIndex = 0;
        let currentElement = element;
        const speed = 5; // 5ms между символами
        let lastScrollTime = 0;
        const scrollInterval = 100; // Прокручиваем каждые 100ms

        const processTokens = () => {
            if (tokenIndex >= tokens.length) {
                callback();
                return;
            }

            const token = tokens[tokenIndex];

            if (token.type === 'tag') {
                // Обработка HTML-тега
                if (token.tag === 'br') {
                    // Перенос строки
                    currentElement = element; // Возвращаемся к основному элементу
                    const br = document.createElement('br');
                    element.appendChild(br);
                } else if (token.isStartTag) {
                    // Открывающий тег - создаем элемент
                    const newElement = document.createElement(token.tag);

                    // Добавляем атрибуты
                    if (token.attributes) {
                        for (const [key, value] of Object.entries(token.attributes)) {
                            newElement.setAttribute(key, value);
                        }
                    }

                    // Добавляем классы
                    if (token.className) {
                        newElement.className = token.className;
                    }

                    element.appendChild(newElement);
                    currentElement = newElement;
                } else {
                    // Закрывающий тег - возвращаемся к родителю
                    currentElement = element;
                }

                // Прокрутка после тега
                this.autoScroll();

                tokenIndex++;
                setTimeout(processTokens, speed);
            } else {
                // Обычный текст - выводим посимвольно
                const text = token.content;
                let charIndex = 0;

                const typeChars = () => {
                    if (charIndex < text.length) {
                        // Добавляем символ к текущему элементу
                        if (currentElement === element) {
                            // Если текущий элемент - основной, добавляем текстовый узел
                            const textNode = document.createTextNode(text[charIndex]);
                            element.appendChild(textNode);
                        } else {
                            // Если внутри span, добавляем к его содержимому
                            currentElement.textContent += text[charIndex];
                        }

                        // Прокручиваем с определенным интервалом, чтобы не нагружать производительность
                        const now = Date.now();
                        if (now - lastScrollTime > scrollInterval) {
                            this.autoScroll();
                            lastScrollTime = now;
                        }

                        charIndex++;
                        setTimeout(typeChars, speed);
                    } else {
                        // Финальная прокрутка после завершения токена
                        this.autoScroll();
                        tokenIndex++;
                        setTimeout(processTokens, speed);
                    }
                };

                typeChars();
            }
        };

        processTokens();
    }

    // Метод для автоматической прокрутки к низу
    autoScroll() {
        // Небольшая задержка чтобы дать браузеру обновить DOM
        setTimeout(() => {
            this.output.scrollTop = this.output.scrollHeight;
        }, 0);
    }

    parseHTML(html) {
        const tokens = [];
        let i = 0;

        while (i < html.length) {
            if (html[i] === '<') {
                // Нашли тег
                const endIndex = html.indexOf('>', i);
                if (endIndex === -1) break;

                const tagContent = html.substring(i + 1, endIndex);

                if (tagContent.startsWith('/')) {
                    // Закрывающий тег
                    tokens.push({
                        type: 'tag',
                        tag: tagContent.substring(1).split(' ')[0],
                        isStartTag: false
                    });
                } else if (tagContent.endsWith('/')) {
                    // Одиночный тег (например, <br/>)
                    tokens.push({
                        type: 'tag',
                        tag: tagContent.substring(0, tagContent.length - 1).split(' ')[0],
                        isStartTag: true,
                        isSelfClosing: true
                    });
                } else {
                    // Открывающий тег
                    const tagParts = tagContent.split(' ');
                    const tagName = tagParts[0];
                    const attributes = {};
                    let className = '';

                    // Парсим атрибуты
                    for (let j = 1; j < tagParts.length; j++) {
                        const part = tagParts[j];
                        if (part.includes('=')) {
                            const [key, value] = part.split('=');
                            let cleanValue = value;
                            if (value.startsWith('"') && value.endsWith('"')) {
                                cleanValue = value.substring(1, value.length - 1);
                            } else if (value.startsWith("'") && value.endsWith("'")) {
                                cleanValue = value.substring(1, value.length - 1);
                            }
                            attributes[key] = cleanValue;

                            if (key === 'class') {
                                className = cleanValue;
                            }
                        }
                    }

                    tokens.push({
                        type: 'tag',
                        tag: tagName,
                        isStartTag: true,
                        attributes: Object.keys(attributes).length > 0 ? attributes : null,
                        className: className || null
                    });
                }

                i = endIndex + 1;
            } else {
                // Нашли текст
                const nextTag = html.indexOf('<', i);
                const textEnd = nextTag === -1 ? html.length : nextTag;
                const textContent = html.substring(i, textEnd);

                if (textContent.trim() !== '') {
                    tokens.push({
                        type: 'text',
                        content: textContent
                    });
                }

                i = textEnd;
            }
        }

        return tokens;
    }

    addToInventory(item) {
        this.gameState.inventory.push(item);
        this.print(`Получен предмет: <span class="command">${item}</span>`, 'success');
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    window.consoleGame = new ConsoleGame();
});

// Глобальные обработчики клавиш
document.addEventListener('keydown', (e) => {
    const game = window.consoleGame;

    if (!game) return;

    if (document.activeElement === game.commandInput) {
        return;
    }

    const keyActions = {
        'ArrowUp': 'move север',
        'ArrowDown': 'move юг',
        'ArrowLeft': 'move запад',
        'ArrowRight': 'move восток'
    };

    if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        game.processCommand('look');
    }
    else if (keyActions[e.key]) {
        e.preventDefault();
        game.processCommand(keyActions[e.key]);
    }
});