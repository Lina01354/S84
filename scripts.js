// Основной скрипт для S84.TODO

// Функция для загрузки данных пользователя
function loadUserData() {
    const currentUser = JSON.parse(sessionStorage.getItem('s84_current_user'));
    return currentUser || null;
}

// Функция для сохранения данных пользователя
function saveUserData(userData) {
    const users = JSON.parse(localStorage.getItem('s84_users')) || [];
    const userIndex = users.findIndex(u => u.username === userData.username);
    
    if (userIndex !== -1) {
        users[userIndex] = userData;
        localStorage.setItem('s84_users', JSON.stringify(users));
        sessionStorage.setItem('s84_current_user', JSON.stringify(userData));
    }
}

// Функция для получения всех пользователей
function getAllUsers() {
    return JSON.parse(localStorage.getItem('s84_users')) || [];
}

// Функция для регистрации нового пользователя
function registerUser(username, password, email) {
    const users = getAllUsers();
    
    // Проверяем, не занят ли логин
    if (users.some(u => u.username === username)) {
        return { success: false, message: 'Этот логин уже занят' };
    }
    
    // Создаем нового пользователя
    const newUser = {
        username: username,
        password: password,
        email: email || `${username}@s84.todo`,
        createdAt: new Date().toISOString(),
        disciplines: [
            {
                id: 1,
                name: 'Математика',
                difficulty: 'hard',
                progress: 80,
                tasks: [
                    { date: '15.01.2026', description: 'Выучить теоремы №2,3', progress: 80 },
                    { date: '21.01.2026', description: 'Выполнить задания №120,123,140', progress: 0 }
                ]
            },
            {
                id: 2,
                name: 'Физика',
                difficulty: 'medium',
                progress: 45,
                tasks: [
                    { date: '18.01.2026', description: 'Лабораторная работа №3', progress: 45 }
                ]
            },
            {
                id: 3,
                name: 'Программирование',
                difficulty: 'easy',
                progress: 90,
                tasks: [
                    { date: '20.01.2026', description: 'Проект "Калькулятор"', progress: 90 }
                ]
            }
        ],
        tasks: []
    };
    
    users.push(newUser);
    localStorage.setItem('s84_users', JSON.stringify(users));
    
    return { success: true, user: newUser };
}

// Функция для входа пользователя
function loginUser(username, password) {
    const users = getAllUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        sessionStorage.setItem('s84_current_user', JSON.stringify(user));
        return { success: true, user: user };
    } else {
        return { success: false, message: 'Неверный логин или пароль' };
    }
}

// Функция для выхода пользователя
function logoutUser() {
    sessionStorage.removeItem('s84_current_user');
    return true;
}

// Функция для добавления новой дисциплины
function addDiscipline(user, disciplineName, difficulty) {
    const newDiscipline = {
        id: Date.now(),
        name: disciplineName,
        difficulty: difficulty,
        progress: 0,
        tasks: []
    };
    
    if (!user.disciplines) {
        user.disciplines = [];
    }
    
    user.disciplines.push(newDiscipline);
    saveUserData(user);
    
    return newDiscipline;
}

// Функция для добавления задания к дисциплине
function addTaskToDiscipline(user, disciplineId, taskDate, taskDescription) {
    if (!user.disciplines) return null;
    
    const disciplineIndex = user.disciplines.findIndex(d => d.id == disciplineId);
    if (disciplineIndex === -1) return null;
    
    const formattedDate = new Date(taskDate).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    const newTask = {
        date: formattedDate,
        description: taskDescription,
        progress: 0
    };
    
    if (!user.disciplines[disciplineIndex].tasks) {
        user.disciplines[disciplineIndex].tasks = [];
    }
    
    user.disciplines[disciplineIndex].tasks.push(newTask);
    
    // Пересчитываем прогресс дисциплины
    const tasks = user.disciplines[disciplineIndex].tasks;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const averageProgress = tasks.length > 0 ? Math.round(totalProgress / tasks.length) : 0;
    
    user.disciplines[disciplineIndex].progress = averageProgress;
    
    saveUserData(user);
    
    return newTask;
}

// Функция для удаления задания
function deleteTask(user, disciplineId, taskIndex) {
    if (!user.disciplines) return false;
    
    const disciplineIndex = user.disciplines.findIndex(d => d.id == disciplineId);
    if (disciplineIndex === -1) return false;
    
    user.disciplines[disciplineIndex].tasks.splice(taskIndex, 1);
    
    // Пересчитываем прогресс
    const tasks = user.disciplines[disciplineIndex].tasks;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const averageProgress = tasks.length > 0 ? Math.round(totalProgress / tasks.length) : 0;
    
    user.disciplines[disciplineIndex].progress = averageProgress;
    
    saveUserData(user);
    
    return true;
}

// Функция для сортировки дисциплин
function sortDisciplines(disciplines, sortBy) {
    if (!disciplines) return [];
    
    const sorted = [...disciplines];
    
    switch (sortBy) {
        case 'date':
            // Сортировка по ID (как пример даты добавления)
            sorted.sort((a, b) => a.id - b.id);
            break;
        case 'priority':
            // Сортировка по прогрессу (приоритету)
            sorted.sort((a, b) => b.progress - a.progress);
            break;
        case 'difficulty':
            // Сортировка по сложности
            const difficultyOrder = { 'hard': 3, 'medium': 2, 'easy': 1 };
            sorted.sort((a, b) => difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty]);
            break;
    }
    
    return sorted;
}

// Функция для обновления статистики пользователя
function calculateUserStats(user) {
    if (!user || !user.disciplines) {
        return {
            disciplinesCount: 0,
            tasksCount: 0,
            completedCount: 0,
            progressPercent: 0
        };
    }
    
    let disciplinesCount = user.disciplines.length;
    let tasksCount = 0;
    let completedCount = 0;
    let totalProgress = 0;
    
    user.disciplines.forEach(discipline => {
        if (discipline.tasks) {
            tasksCount += discipline.tasks.length;
            
            discipline.tasks.forEach(task => {
                if (task.progress === 100) {
                    completedCount++;
                }
            });
        }
        
        totalProgress += discipline.progress || 0;
    });
    
    const progressPercent = disciplinesCount > 0 ? 
        Math.round(totalProgress / disciplinesCount) : 0;
    
    return {
        disciplinesCount,
        tasksCount,
        completedCount,
        progressPercent
    };
}

// Функция для обновления email
function updateUserEmail(user, newEmail) {
    if (!user) return false;
    
    user.email = newEmail;
    saveUserData(user);
    
    return true;
}

// Функция для смены пароля
function changeUserPassword(user, currentPassword, newPassword) {
    if (!user) return { success: false, message: 'Пользователь не найден' };
    
    if (user.password !== currentPassword) {
        return { success: false, message: 'Текущий пароль введен неверно' };
    }
    
    user.password = newPassword;
    saveUserData(user);
    
    return { success: true, message: 'Пароль успешно изменен' };
}

// Экспорт функций для использования в HTML файлах
window.S84 = {
    loadUserData,
    saveUserData,
    getAllUsers,
    registerUser,
    loginUser,
    logoutUser,
    addDiscipline,
    addTaskToDiscipline,
    deleteTask,
    sortDisciplines,
    calculateUserStats,
    updateUserEmail,
    changeUserPassword
};