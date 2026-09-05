// ─── ICARUS — Translation Dictionary ────────────────────────────────────────
// Languages: kk (Қазақша), ru (Русский), en (English), ro (Română)

const translations = {
  // ── Navigation tabs ──────────────────────────────────────────────────────
  'nav.journey': {
    kk: 'ЖОРЫҚ',
    ru: 'ПУТЬ',
    en: 'THE JOURNEY',
    ro: 'CĂLĂTORIA',
  },
  'nav.news': {
    kk: 'ЖАҢАЛЫҚТАР',
    ru: 'НОВОСТИ',
    en: 'NEWS',
    ro: 'ȘTIRI',
  },
  'nav.training': {
    kk: 'ЖАТТЫҒУ',
    ru: 'ОБУЧЕНИЕ',
    en: 'TRAINING',
    ro: 'ANTRENAMENT',
  },
  'nav.ranking': {
    kk: 'ЖАҺАНДЫҚ РЕЙТИНГ',
    ru: 'МИРОВОЙ РЕЙТИНГ',
    en: 'GLOBAL RANKING',
    ro: 'CLASAMENT GLOBAL',
  },
  'nav.contact': {
    kk: 'БІЗ ТУРАЛЫ',
    ru: 'О НАС',
    en: 'ABOUT US',
    ro: 'DESPRE NOI',
  },

  // ── Header ───────────────────────────────────────────────────────────────
  'header.signIn': {
    kk: 'Кіру',
    ru: 'Войти',
    en: 'Sign In',
    ro: 'Autentificare',
  },
  'header.registered': {
    kk: 'Тіркелді',
    ru: 'Зарегистрирован',
    en: 'Registered',
    ro: 'Înregistrat',
  },
  'header.joinCompetition': {
    kk: 'Қосылу',
    ru: 'Вступить',
    en: 'Join',
    ro: 'Alătură-te',
  },
  'header.motto': {
    kk: 'болу — жаңалық жасау',
    ru: 'существовать — значит новаторствовать',
    en: 'to be is to innovate',
    ro: 'a fi înseamnă a inova',
  },

  // ── Profile Dropdown ──────────────────────────────────────────────────────
  'profile.signedInAs': {
    kk: 'Кірген:',
    ru: 'Вошли как',
    en: 'Signed in as',
    ro: 'Autentificat ca',
  },
  'profile.yourProfile': {
    kk: 'Профиліңіз',
    ru: 'Ваш профиль',
    en: 'Your Profile',
    ro: 'Profilul tău',
  },
  'profile.teamDashboard': {
    kk: 'Команда',
    ru: 'Команда',
    en: 'Team Dashboard',
    ro: 'Tabloul echipei',
  },
  'profile.settings': {
    kk: 'Баптаулар',
    ru: 'Настройки',
    en: 'Settings',
    ro: 'Setări',
  },
  'profile.adminPanel': {
    kk: 'Басқару панелі',
    ru: 'Панель администратора',
    en: 'Admin Panel',
    ro: 'Panou Admin',
  },
  'profile.signOut': {
    kk: 'Шығу',
    ru: 'Выйти',
    en: 'Sign Out',
    ro: 'Deconectare',
  },

  // ── Auth Modal ────────────────────────────────────────────────────────────
  'auth.accessIcarus': {
    kk: 'ICARUS-ҚА ЕНУ',
    ru: 'ДОСТУП К ICARUS',
    en: 'ACCESS ICARUS',
    ro: 'ACCES ICARUS',
  },
  'auth.authenticate': {
    kk: 'Жалғастыру үшін аутентификацияланыңыз',
    ru: 'Аутентифицируйтесь для продолжения',
    en: 'Authenticate to continue',
    ro: 'Autentifică-te pentru a continua',
  },
  'auth.welcomeBack': {
    kk: 'Қайта келдіңіз',
    ru: 'С возвращением',
    en: 'Welcome back',
    ro: 'Bun revenit',
  },
  'auth.signIn': {
    kk: 'Кіру',
    ru: 'Войти',
    en: 'Sign In',
    ro: 'Autentificare',
  },
  'auth.register': {
    kk: 'Тіркелу',
    ru: 'Регистрация',
    en: 'Register',
    ro: 'Înregistrare',
  },
  'auth.email': {
    kk: 'Электрондық пошта',
    ru: 'Электронная почта',
    en: 'Email',
    ro: 'Email',
  },
  'auth.password': {
    kk: 'Құпиясөз',
    ru: 'Пароль',
    en: 'Password',
    ro: 'Parolă',
  },
  'auth.fullName': {
    kk: 'Толық аты-жөні',
    ru: 'Полное имя',
    en: 'Full Name',
    ro: 'Nume complet',
  },
  'auth.signingIn': {
    kk: 'КІРУ...',
    ru: 'ВХОД...',
    en: 'AUTHENTICATING...',
    ro: 'SE AUTENTIFICĂ...',
  },
  'auth.signInBtn': {
    kk: 'КІРУ',
    ru: 'ВОЙТИ',
    en: 'SIGN IN',
    ro: 'AUTENTIFICARE',
  },
  'auth.creatingAccount': {
    kk: 'ТІРКЕЛУ...',
    ru: 'СОЗДАНИЕ АККАУНТА...',
    en: 'CREATING ACCOUNT...',
    ro: 'SE CREEAZĂ CONTUL...',
  },
  'auth.createAccount': {
    kk: 'ТІРКЕЛУ',
    ru: 'СОЗДАТЬ АККАУНТ',
    en: 'CREATE ACCOUNT',
    ro: 'CREARE CONT',
  },
  'auth.forgotPassword': {
    kk: 'Құпиясөзді ұмыттыңыз ба?',
    ru: 'Забыли пароль?',
    en: 'Forgot Password?',
    ro: 'Ai uitat parola?',
  },
  'auth.sendResetLink': {
    kk: 'СІЛТЕМЕ ЖІБЕРУ',
    ru: 'ОТПРАВИТЬ ССЫЛКУ',
    en: 'SEND RESET LINK',
    ro: 'TRIMITE LINK RESETARE',
  },
  'auth.sendingLink': {
    kk: 'ЖІБЕРУ...',
    ru: 'ОТПРАВКА...',
    en: 'SENDING LINK...',
    ro: 'SE TRIMITE...',
  },
  'auth.backToSignIn': {
    kk: 'КІРУГЕ ОРАЛУ',
    ru: 'НАЗАД К ВХОДУ',
    en: 'BACK TO SIGN IN',
    ro: 'ÎNAPOI LA AUTENTIFICARE',
  },
  'auth.verifyAccess': {
    kk: 'РАСТАУ ЖӘНЕ ЕНУ',
    ru: 'ПОДТВЕРДИТЬ И ВОЙТИ',
    en: 'VERIFY & ACCESS',
    ro: 'VERIFICARE & ACCES',
  },
  'auth.verifying': {
    kk: 'РАСТАЛУДА...',
    ru: 'ПРОВЕРКА...',
    en: 'VERIFYING...',
    ro: 'SE VERIFICĂ...',
  },
  'auth.passwordMinChars': {
    kk: 'Кем дегенде 6 таңба',
    ru: 'Мин. 6 символов',
    en: 'Min. 6 characters',
    ro: 'Min. 6 caractere',
  },
  'auth.protocol': {
    kk: 'Жалғастыру арқылы сіз ICARUS бәсеке хаттамасымен келісесіз',
    ru: 'Продолжая, вы соглашаетесь с протоколом соревнования ICARUS',
    en: 'By continuing you agree to the ICARUS competition protocol',
    ro: 'Prin continuare ești de acord cu protocolul competiției ICARUS',
  },
  'auth.forgotPasswordHint': {
    kk: 'Электрондық пошта мекенжайыңызды енгізіңіз, біз сізге қауіпсіз пароль қалпына келтіру сілтемесін жібереміз.',
    ru: 'Введите адрес электронной почты, и мы отправим вам ссылку для сброса пароля.',
    en: "Enter your email address and we'll send you a link to securely reset your password.",
    ro: 'Introduceți adresa de email și vă vom trimite un link pentru a vă reseta parola.',
  },
  'auth.codeSentTo': {
    kk: 'адресіне 6 таңбалы код жібердік.',
    ru: 'мы отправили 6-значный код на',
    en: 'We sent a 6-digit code to',
    ro: 'Am trimis un cod de 6 cifre la',
  },

  // ── Team ──────────────────────────────────────────────────────────────────
  'team.joinCompetition': {
    kk: 'ҚОСЫЛУ',
    ru: 'ВСТУПИТЬ',
    en: 'JOIN',
    ro: 'ALĂTURĂ-TE',
  },
  'team.assignmentComplete': {
    kk: 'ТАПСЫРМА ОРЫНДАЛДЫ',
    ru: 'ЗАДАНИЕ ВЫПОЛНЕНО',
    en: 'ASSIGNMENT COMPLETE',
    ro: 'MISIUNE COMPLETĂ',
  },
  'team.createTeam': {
    kk: 'Команда құру',
    ru: 'Создать команду',
    en: 'Create Team',
    ro: 'Creare Echipă',
  },
  'team.joinWithCode': {
    kk: 'Кодпен қосылу',
    ru: 'Вступить по коду',
    en: 'Join With Code',
    ro: 'Alătură-te cu Cod',
  },
  'team.teamName': {
    kk: 'Команда атауы',
    ru: 'Название команды',
    en: 'Team Name',
    ro: 'Numele echipei',
  },
  'team.inviteCode': {
    kk: 'Шақыру коды',
    ru: 'Код приглашения',
    en: 'Invite Code',
    ro: 'Cod de invitație',
  },
  'team.creating': {
    kk: 'ЖАСАЛУДА...',
    ru: 'СОЗДАНИЕ...',
    en: 'CREATING...',
    ro: 'SE CREEAZĂ...',
  },
  'team.joining': {
    kk: 'ҚОСЫЛУДА...',
    ru: 'ВСТУПЛЕНИЕ...',
    en: 'JOINING...',
    ro: 'SE ALĂTURĂ...',
  },

  // ── Journey Tab ───────────────────────────────────────────────────────────
  'journey.welcome': {
    kk: 'ICARUS-ҚА ҚОШ КЕЛДІҢІЗ',
    ru: 'Добро пожаловать в ICARUS',
    en: 'Welcome to ICARUS',
    ro: 'Bun venit la ICARUS',
  },
  'journey.title1': {
    kk: 'Аэроғарыш',
    ru: 'Аэрокосмическая',
    en: 'Aerospace',
    ro: 'Inginerie',
  },
  'journey.title2': {
    kk: 'Инженерия',
    ru: 'Инженерия',
    en: 'Engineering',
    ro: 'Aerospațială',
  },
  'journey.title3': {
    kk: 'Бәсеке платформасы',
    ru: 'Соревновательная платформа',
    en: 'Competition Platform',
    ro: 'Platformă de Competiție',
  },
  'journey.subtitle': {
    kk: 'Топ құрыңыз, жолды бастаңыз.',
    ru: 'Создайте команду, начните путь.',
    en: 'Build team, start journey.',
    ro: 'Formați echipa, începeți călătoria.',
  },

  // ── News page ─────────────────────────────────────────────────────────────
  'news.title': {
    kk: 'СОҢҒЫ ЖАҢАЛЫҚТАР',
    ru: 'ПОСЛЕДНИЕ НОВОСТИ',
    en: 'LATEST NEWS',
    ro: 'ULTIMELE ȘTIRI',
  },
  'news.subtitle': {
    kk: 'Платформа жаңартулары',
    ru: 'Обновления платформы',
    en: 'Platform Updates',
    ro: 'Actualizări platformă',
  },
  'news.empty': {
    kk: 'Әзірше жаңалық жоқ',
    ru: 'Новостей пока нет',
    en: 'No news yet',
    ro: 'Nicio știre deocamdată',
  },
  'news.emptyHint': {
    kk: 'Платформа жаңартулары мен хабарландыруларын кейінірек тексеріңіз.',
    ru: 'Загляните позже для обновлений и объявлений платформы.',
    en: 'Check back later for platform updates and announcements.',
    ro: 'Reveniți mai târziu pentru actualizări și anunțuri.',
  },
  'news.readMore': {
    kk: 'Толығырақ оқу',
    ru: 'Читать далее',
    en: 'Read Full Article',
    ro: 'Citește articolul',
  },
  'news.backToNews': {
    kk: 'Жаңалықтарға оралу',
    ru: 'К новостям',
    en: 'Back to News',
    ro: 'Înapoi la știri',
  },

  // ── Training Tab ──────────────────────────────────────────────────────────
  'training.comingSoon': {
    kk: 'Жақында',
    ru: 'Скоро',
    en: 'Coming Soon',
    ro: 'În curând',
  },
  'training.comingSoonHint': {
    kk: 'Оқу модульдері жасалуда',
    ru: 'Учебные модули в разработке',
    en: 'Training modules are in development',
    ro: 'Modulele de antrenament sunt în curs de dezvoltare',
  },
  
  // ── Contact Tab ──────────────────────────────────────────────────────────
  'contact.title': {
    kk: 'БІЗ ТУРАЛЫ',
    ru: 'О НАС',
    en: 'ABOUT US',
    ro: 'DESPRE NOI',
  },

  // ── Ranking Tab ───────────────────────────────────────────────────────────
  'ranking.title': {
    kk: 'ЖАҺАНДЫҚ РЕЙТИНГ',
    ru: 'МИРОВОЙ РЕЙТИНГ',
    en: 'GLOBAL RANKING',
    ro: 'CLASAMENT GLOBAL',
  },
  'ranking.joinToView': {
    kk: 'Рейтингті көру үшін қосылыңыз',
    ru: 'Вступите, чтобы увидеть рейтинг',
    en: 'Join to view the ranking',
    ro: 'Alătură-te pentru a vedea clasamentul',
  },

  // ── Settings page ─────────────────────────────────────────────────────────
  'settings.title': {
    kk: 'Баптаулар',
    ru: 'Настройки',
    en: 'Settings',
    ro: 'Setări',
  },
  'settings.profile': {
    kk: 'Профиль',
    ru: 'Профиль',
    en: 'Profile',
    ro: 'Profil',
  },
  'settings.displayName': {
    kk: 'Көрсетілетін есім',
    ru: 'Отображаемое имя',
    en: 'Display Name',
    ro: 'Nume afișat',
  },
  'settings.email': {
    kk: 'Электрондық пошта',
    ru: 'Электронная почта',
    en: 'Email',
    ro: 'Email',
  },
  'settings.emailReadOnly': {
    kk: '— тек оқуға арналған',
    ru: '— только для чтения',
    en: '— read only',
    ro: '— doar citire',
  },
  'settings.saveChanges': {
    kk: 'Сақтау',
    ru: 'Сохранить изменения',
    en: 'Save Changes',
    ro: 'Salvează modificările',
  },
  'settings.saving': {
    kk: 'Сақталуда...',
    ru: 'Сохранение…',
    en: 'Saving…',
    ro: 'Se salvează…',
  },
  'settings.profileUpdated': {
    kk: 'Профиль сәтті жаңартылды.',
    ru: 'Профиль успешно обновлён.',
    en: 'Profile updated successfully.',
    ro: 'Profilul a fost actualizat.',
  },
  'settings.uploadPhoto': {
    kk: 'Фотосурет жүктеу',
    ru: 'Загрузить фото',
    en: 'Click to upload a photo',
    ro: 'Click pentru a încărca o fotografie',
  },
  'settings.removePhoto': {
    kk: 'Фотосуретті жою',
    ru: 'Удалить фото',
    en: 'Remove photo',
    ro: 'Șterge fotografia',
  },
  'settings.pasteHint': {
    kk: 'немесе қою үшін Ctrl+V басыңыз · JPG, PNG, WEBP',
    ru: 'или нажмите Ctrl+V для вставки · JPG, PNG, WEBP',
    en: 'or press Ctrl+V to paste · JPG, PNG, WEBP',
    ro: 'sau apasă Ctrl+V pentru lipire · JPG, PNG, WEBP',
  },
  'settings.language': {
    kk: 'Интерфейс тілі',
    ru: 'Язык интерфейса',
    en: 'Interface Language',
    ro: 'Limba interfeței',
  },
  'settings.languageHint': {
    kk: 'Тіл таңдауы браузерде сақталады',
    ru: 'Настройка языка сохраняется в браузере',
    en: 'Language preference is saved in your browser',
    ro: 'Preferința de limbă este salvată în browser',
  },
  'settings.dangerZone': {
    kk: 'Қауіпті аймақ',
    ru: 'Опасная зона',
    en: 'Danger Zone',
    ro: 'Zonă periculoasă',
  },
  'settings.dangerHint': {
    kk: 'Аккаунтты және барлық деректерді біржола жою.',
    ru: 'Навсегда удалить аккаунт и все данные.',
    en: 'Permanently delete your account and all data.',
    ro: 'Șterge permanent contul și toate datele.',
  },
  'settings.deleteAccount': {
    kk: 'Жою',
    ru: 'Удалить',
    en: 'Delete',
    ro: 'Șterge',
  },
  'settings.deleteTitle': {
    kk: 'Аккаунтты жою керек пе?',
    ru: 'Удалить аккаунт?',
    en: 'Delete Account?',
    ro: 'Ștergi contul?',
  },
  'settings.deleteWarning': {
    kk: 'Бұл әрекет қайтымсыз және барлық прогрессіңіз, XP және команда мүшелігіңіз жойылады.',
    ru: 'Это действие необратимо. Весь ваш прогресс, XP и членство в команде будут удалены.',
    en: 'This action is permanent and cannot be undone. All your progress, XP, and team affiliations will be lost entirely.',
    ro: 'Această acțiune este permanentă și nu poate fi anulată. Tot progresul, XP și afilierile tale vor fi pierdute.',
  },
  'settings.cancel': {
    kk: 'Бас тарту',
    ru: 'Отмена',
    en: 'Cancel',
    ro: 'Anulare',
  },
  'settings.deleting': {
    kk: 'Жойылуда...',
    ru: 'Удаление...',
    en: 'Deleting...',
    ro: 'Se șterge...',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  'footer.rights': {
    kk: 'Барлық құқықтар қорғалған',
    ru: 'Все права защищены',
    en: 'All rights reserved',
    ro: 'Toate drepturile rezervate',
  },

  // ── Auth Modal – Team phase aliases ─────────────────────────────────────
  'auth.joinCompetition': {
    kk: 'ҚОСЫЛУ',
    ru: 'ВСТУПИТЬ',
    en: 'JOIN',
    ro: 'ALĂTURĂ-TE',
  },
  'auth.assignmentComplete': {
    kk: 'ТАПСЫРМА ОРЫНДАЛДЫ',
    ru: 'ЗАДАНИЕ ВЫПОЛНЕНО',
    en: 'ASSIGNMENT COMPLETE',
    ro: 'MISIUNE COMPLETĂ',
  },
  'auth.createTeam': {
    kk: 'Команда құру',
    ru: 'Создать команду',
    en: 'Create Team',
    ro: 'Creare Echipă',
  },
  'auth.joinWithCode': {
    kk: 'Кодпен қосылу',
    ru: 'Вступить по коду',
    en: 'Join With Code',
    ro: 'Alătură-te cu Cod',
  },
  'auth.teamName': {
    kk: 'Команда атауы',
    ru: 'Название команды',
    en: 'Team Name',
    ro: 'Numele echipei',
  },
  'auth.enterTeamName': {
    kk: 'Команда атауын енгізіңіз',
    ru: 'Введите название команды',
    en: 'Enter Team Name',
    ro: 'Introduceți numele echipei',
  },
  'auth.inviteCode': {
    kk: 'Шақыру коды',
    ru: 'Код приглашения',
    en: 'Invite Code',
    ro: 'Cod de invitație',
  },
  'auth.enter6digitCode': {
    kk: '6 таңбалы кодты енгізіңіз',
    ru: 'Введите 6-значный код',
    en: 'Enter 6-digit Invite Code',
    ro: 'Introduceți codul de 6 cifre',
  },
  'auth.creating': {
    kk: 'ЖАСАЛУДА...',
    ru: 'СОЗДАНИЕ...',
    en: 'CREATING...',
    ro: 'SE CREEAZĂ...',
  },
  'auth.joining': {
    kk: 'ҚОСЫЛУДА...',
    ru: 'ВСТУПЛЕНИЕ...',
    en: 'JOINING...',
    ro: 'SE ALĂTURĂ...',
  },
  'auth.joinTeam': {
    kk: 'КОМАНДАҒА ҚОСЫЛУ',
    ru: 'ВСТУПИТЬ В КОМАНДУ',
    en: 'JOIN TEAM',
    ro: 'ALĂTURĂ-TE ECHIPEI',
  },
  'auth.minPassword': {
    kk: 'Кем дегенде 6 таңба',
    ru: 'Мин. 6 символов',
    en: 'Min. 6 characters',
    ro: 'Min. 6 caractere',
  },

  // ── Journey Tab – fixes ───────────────────────────────────────────────────
  'journey.welcomeTo': {
    kk: 'ICARUS-ҚА ҚОШ КЕЛДІҢІЗ',
    ru: 'Добро пожаловать в ICARUS',
    en: 'Welcome to ICARUS',
    ro: 'Bun venit la ICARUS',
  },
  'journey.navigate': {
    kk: 'Платформаны зерттеңіз, командаңызды құрыңыз және саяхатыңызды бастаңыз.',
    ru: 'Исследуйте платформу, создайте команду и начните свой путь.',
    en: 'Navigate the platform, build your team, and launch your journey.',
    ro: 'Explorați platforma, formați-vă echipa și lansați-vă călătoria.',
  },
  'journey.titleLine': {
    kk: 'Аэроғарыш инженерия бәсеке платформасы',
    ru: 'Аэрокосмическая инженерия соревновательная платформа',
    en: 'Aerospace Engineering Competition Platform',
    ro: 'Platformă de Competiție Inginerie Aerospațială',
  },

  // ── Settings – missing keys ───────────────────────────────────────────────
  'settings.uploadDesc': {
    kk: 'немесе қою үшін Ctrl+V · JPG, PNG, WEBP',
    ru: 'или Ctrl+V для вставки · JPG, PNG, WEBP',
    en: 'or press Ctrl+V to paste · JPG, PNG, WEBP',
    ro: 'sau Ctrl+V · JPG, PNG, WEBP',
  },
  'settings.displayNamePlaceholder': {
    kk: 'Есіміңізді енгізіңіз',
    ru: 'Введите ваше имя',
    en: 'Enter your name',
    ro: 'Introduceți numele dvs.',
  },
  'settings.languageDesc': {
    kk: 'Тіл таңдауы браузерде сақталады',
    ru: 'Настройка сохраняется в браузере',
    en: 'Language preference is saved in your browser',
    ro: 'Preferința este salvată în browser',
  },
  'settings.dangerZoneHint': {
    kk: 'Аккаунтты және барлық деректерді біржола жою.',
    ru: 'Навсегда удалить аккаунт и все данные.',
    en: 'Permanently delete your account and all data.',
    ro: 'Șterge permanent contul și toate datele.',
  },

  // ── TeamDashboard / TeamDetails ───────────────────────────────────────────
  'team.dashboardTitle': {
    kk: 'Топ Басқару Тақтасы',
    ru: 'Панель Команды',
    en: 'Team Dashboard',
    ro: 'Panoul Echipei',
  },
  'team.loading': {
    kk: 'Топ деректері жүктелуде...',
    ru: 'Загрузка данных команды...',
    en: 'Loading team data...',
    ro: 'Se încarcă datele echipei...',
  },
  'team.joinFirst': {
    kk: 'АЛДЫМЕН ТОПҚА ҚОСЫЛЫҢЫЗ',
    ru: 'СНАЧАЛА ПРИСОЕДИНИТЕСЬ К КОМАНДЕ',
    en: 'JOIN A TEAM FIRST',
    ro: 'ALĂTURAȚI-VĂ UNEI ECHIPE',
  },
  'team.joinFirstDesc': {
    kk: 'Жарысқа қатысу үшін сіз топтың мүшесі болуыңыз керек. Жаңа топ құрыңыз немесе бар топқа қосылыңыз.',
    ru: 'Для участия в соревновании вам нужно быть частью команды. Создайте новую команду или присоединитесь к существующей.',
    en: 'You need to be part of a team before you can enter a competition. Create a new team or join an existing one.',
    ro: 'Trebuie să faceți parte dintr-o echipă înainte de a intra într-o competiție. Creați o echipă nouă sau alăturați-vă uneia existente.',
  },
  'team.createNew': {
    kk: 'Жаңа Топ Құру',
    ru: 'Создать Новую Команду',
    en: 'Create New Team',
    ro: 'Creați Echipă Nouă',
  },
  'team.joinWithCode': {
    kk: 'Код Арқылы Қосылу',
    ru: 'Присоединиться по Коду',
    en: 'Join With Code',
    ro: 'Alăturați-vă cu Cod',
  },
  'team.nameLabel': {
    kk: 'Топ Аты',
    ru: 'Название Команды',
    en: 'Team Name',
    ro: 'Nume Echipă',
  },
  'team.namePlaceholder': {
    kk: 'Топ атын енгізіңіз',
    ru: 'Введите название команды',
    en: 'Enter Team Name',
    ro: 'Introduceți Numele Echipei',
  },
  'team.back': {
    kk: 'Артқа',
    ru: 'Назад',
    en: 'Back',
    ro: 'Înapoi',
  },
  'team.creating': {
    kk: 'Құрылуда...',
    ru: 'Создание...',
    en: 'Creating...',
    ro: 'Creare...',
  },
  'team.createBtn': {
    kk: 'Топ Құру',
    ru: 'Создать Команду',
    en: 'Create Team',
    ro: 'Creați Echipa',
  },
  'team.inviteCode': {
    kk: 'Шақыру Коды',
    ru: 'Код Приглашения',
    en: 'Invite Code',
    ro: 'Cod Invitație',
  },
  'team.codePlaceholder': {
    kk: '6 таңбалы код',
    ru: '6-значный код',
    en: '6-digit code',
    ro: 'Cod din 6 cifre',
  },
  'team.joining': {
    kk: 'Қосылуда...',
    ru: 'Присоединение...',
    en: 'Joining...',
    ro: 'Alăturare...',
  },
  'team.joinBtn': {
    kk: 'Топқа Қосылу',
    ru: 'Присоединиться к Команде',
    en: 'Join Team',
    ro: 'Alăturați-vă Echipei',
  },
  'team.statusLabel': {
    kk: 'Топ Мәртебесі: ',
    ru: 'Статус Команды: ',
    en: 'Team Status: ',
    ro: 'Status Echipă: ',
  },
  'team.active': {
    kk: 'БЕЛСЕНДІ',
    ru: 'АКТИВНА',
    en: 'ACTIVE',
    ro: 'ACTIV',
  },
  'team.captain': {
    kk: 'Капитан: ',
    ru: 'Капитан: ',
    en: 'Captain: ',
    ro: 'Căpitan: ',
  },
  'team.regForComp': {
    kk: 'Жарысқа Тіркелген',
    ru: 'Зарегистрированы на Соревнование',
    en: 'Registered For Competition',
    ro: 'Înregistrat Pentru Competiție',
  },
  'team.pendingReg': {
    kk: 'Тіркелу Күтілуде',
    ru: 'Ожидание Регистрации',
    en: 'Pending Registration',
    ro: 'Înregistrare în Așteptare',
  },
  'team.dontForgetReg': {
    kk: '* Жарысқа қосылу түймесі арқылы тіркелуді ұмытпаңыз!',
    ru: '* Не забудьте зарегистрироваться через кнопку Присоединиться к Соревнованию!',
    en: "* Don't forget to register via the Join Competition button!",
    ro: '* Nu uitați să vă înregistrați prin butonul Alăturați-vă Competiției!',
  },
  'team.shareCode': {
    kk: 'Бұл кодты топ мүшелерімен бөлісіңіз.',
    ru: 'Поделитесь этим кодом с членами команды.',
    en: 'Share this code with your team members.',
    ro: 'Partajați acest cod cu membrii echipei.',
  },
  'team.membersTitle': {
    kk: 'Топ Мүшелері',
    ru: 'Члены Команды',
    en: 'Team Members',
    ro: 'Membrii Echipei',
  },
  'team.membersCount': {
    kk: ' мүше',
    ru: ' участников',
    en: ' members',
    ro: ' membri',
  },
  'team.you': {
    kk: 'Сіз',
    ru: 'Вы',
    en: 'You',
    ro: 'Tu',
  },
  'team.streak': {
    kk: 'Серия',
    ru: 'Стрик',
    en: 'Streak',
    ro: 'Serie',
  },
  'team.xp': {
    kk: 'XP',
    ru: 'XP',
    en: 'XP',
    ro: 'XP',
  },
  'team.leaveBtn': {
    kk: 'Топтан Шығу',
    ru: 'Покинуть Команду',
    en: 'Leave Team',
    ro: 'Părăsește Echipa',
  },
  'team.leaveConfirm': {
    kk: 'Топтан Шығу?',
    ru: 'Покинуть Команду?',
    en: 'Leave Team?',
    ro: 'Părăsiți Echipa?',
  },
  'team.leaveSure': {
    kk: 'Шынымен шыққыңыз келе ме ',
    ru: 'Вы уверены, что хотите покинуть ',
    en: 'Are you sure you want to leave ',
    ro: 'Sigur doriți să părăsiți ',
  },
  'team.leaveCaptain': {
    kk: 'Сіз капитансыз. Басшылық ең көп XP жинаған мүшеге өтеді.',
    ru: 'Вы капитан. Лидерство перейдет к участнику с наибольшим количеством XP.',
    en: 'You are the captain. Leadership will transfer to the next highest-XP member.',
    ro: 'Sunteți căpitanul. Conducerea va fi transferată membrului cu cel mai mare XP.',
  },
  'team.cancel': {
    kk: 'Бас тарту',
    ru: 'Отмена',
    en: 'Cancel',
    ro: 'Anulare',
  },
  'team.leaving': {
    kk: 'Шығуда...',
    ru: 'Выход...',
    en: 'Leaving...',
    ro: 'Părăsire...',
  },
  'team.leaveSubmit': {
    kk: 'Шығу',
    ru: 'Покинуть',
    en: 'Leave',
    ro: 'Părăsește',
  },
  'team.leaveFailed': {
    kk: 'Топтан шығу мүмкін болмады.',
    ru: 'Не удалось покинуть команду.',
    en: 'Failed to leave team.',
    ro: 'Eșec la părăsirea echipei.',
  },
  'team.loadFailed': {
    kk: 'Топ мәліметтерін жүктеу мүмкін болмады',
    ru: 'Не удалось загрузить данные команды',
    en: 'Failed to load team details',
    ro: 'Eșec la încărcarea detaliilor echipei',
  },
  'team.roster': {
    kk: 'Топ құрамы',
    ru: 'Состав команды',
    en: 'Team Roster',
    ro: 'Lista echipei',
  },

  // ── CompetitionJoinModal ──────────────────────────────────────────────────
  'comp.checkingStatus': {
    kk: 'Мәртебесі тексерілуде…',
    ru: 'Проверка статуса…',
    en: 'Checking status…',
    ro: 'Verificare status…',
  },
  'comp.noActive': {
    kk: 'Белсенді жарыстар жоқ',
    ru: 'Нет активных соревнований',
    en: 'No Active Competition',
    ro: 'Nicio competiție activă',
  },
  'comp.noActiveDesc': {
    kk: 'Қазіргі уақытта ашық жарыстар жоқ. Кейінірек тексеріңіз — келесі миссия жақында жарияланады.',
    ru: 'На данный момент нет открытых соревнований. Загляните позже — следующая миссия будет объявлена скоро.',
    en: 'There are no open competitions at the moment. Check back later — the next mission will be announced soon.',
    ro: 'În acest moment nu există competiții deschise. Reveniți mai târziu — următoarea misiune va fi anunțată curând.',
  },
  'comp.understood': {
    kk: 'Түсіндім',
    ru: 'Понятно',
    en: 'Understood',
    ro: 'Am înțeles',
  },
  'comp.regClosed': {
    kk: 'Тіркелу жабық',
    ru: 'Регистрация закрыта',
    en: 'Registration Closed',
    ro: 'Înregistrare închisă',
  },
  'comp.regClosedDesc': {
    kk: 'Бұл жарысқа тіркелу аяқталды. Сіз енді тіркеле алмайсыз.',
    ru: 'Регистрация на это соревнование завершена. Вы больше не можете зарегистрироваться.',
    en: 'Registration for this competition has ended. You cannot register anymore.',
    ro: 'Înregistrarea pentru această competiție s-a încheiat. Nu vă mai puteți înregistra.',
  },
  'comp.close': {
    kk: 'Жабу',
    ru: 'Закрыть',
    en: 'Close',
    ro: 'Închide',
  },
  'comp.joinTeamFirst': {
    kk: 'Алдымен топқа қосылыңыз',
    ru: 'Сначала присоединитесь к команде',
    en: 'Join a Team First',
    ro: 'Alăturați-vă unei echipe mai întâi',
  },
  'comp.joinTeamFirstDesc': {
    kk: 'Жарысқа қатысу үшін сіз топтың мүшесі болуыңыз керек. Топты бақылау тақтасы арқылы жасаңыз немесе оған қосылыңыз.',
    ru: 'Вам нужно быть частью команды, чтобы участвовать в соревновании. Создайте или присоединитесь к ней через Панель команды.',
    en: 'You need to be part of a team before you can enter a competition. Create or join one through Team Dashboard.',
    ro: 'Trebuie să faceți parte dintr-o echipă înainte de a intra într-o competiție. Creați sau alăturați-vă uneia prin Dashboard-ul echipei.',
  },
  'comp.gotIt': {
    kk: 'Түсінікті',
    ru: 'Понял',
    en: 'Got it',
    ro: 'Am înțeles',
  },
  'comp.captainOnly': {
    kk: 'Тек капитан үшін',
    ru: 'Только для капитана',
    en: 'Captain Only',
    ro: 'Doar pentru Căpitan',
  },
  'comp.captainOnlyDesc1': {
    kk: 'Тек ',
    ru: 'Только ',
    en: 'Only the ',
    ro: 'Doar ',
  },
  'comp.captainOnlyDesc2': {
    kk: 'Топ капитаны',
    ru: 'Капитан команды',
    en: 'Team Captain',
    ro: 'Căpitanul echipei',
  },
  'comp.captainOnlyDesc3': {
    kk: ' топты жарысқа ресми түрде тіркей алады.',
    ru: ' может официально зарегистрировать команду на соревнование.',
    en: ' can officially register the team for a competition.',
    ro: ' poate înregistra oficial echipa pentru o competiție.',
  },
  'comp.closes': {
    kk: 'Жабылады: ',
    ru: 'Закрывается: ',
    en: 'Closes: ',
    ro: 'Se închide: ',
  },
  'comp.askCaptain': {
    kk: 'Капитаныңыздан Жарысқа қосылу түймесін басуын сұраңыз.',
    ru: 'Попросите вашего капитана нажать кнопку присоединения к соревнованию.',
    en: 'Ask your captain to click the Join Competition button.',
    ro: 'Cereți căpitanului să facă clic pe butonul Alătură-te Competiției.',
  },
  'comp.joinWorkshop': {
    kk: 'Шеберлік сыныбына қосылу',
    ru: 'Присоединиться к мастер-классу',
    en: 'Join Workshop',
    ro: 'Alătură-te Atelierului',
  },
  'comp.regTeam': {
    kk: 'Топыңызды тіркеңіз',
    ru: 'Зарегистрируйте команду',
    en: 'Register Your Team',
    ro: 'Înregistrați echipa',
  },
  'comp.activeWorkshop': {
    kk: 'Белсенді шеберлік сыныбы',
    ru: 'Активный мастер-класс',
    en: 'Active Workshop',
    ro: 'Atelier activ',
  },
  'comp.activeComp': {
    kk: 'Белсенді жарыс',
    ru: 'Активное соревнование',
    en: 'Active Competition',
    ro: 'Competiție activă',
  },
  'comp.workshopDesc': {
    kk: 'Сіз осы жеке шеберлік сыныбына тіркелгелі жатырсыз. Миссияға дайындалыңыз.',
    ru: 'Вы собираетесь зарегистрироваться на этот индивидуальный мастер-класс. Подготовьтесь к миссии.',
    en: 'You are about to register for this individual workshop event. Prepare yourself for the mission.',
    ro: 'Sunteți pe cale să vă înregistrați pentru acest eveniment de atelier individual. Pregătiți-vă pentru misiune.',
  },
  'comp.teamDesc1': {
    kk: 'Ретінде ',
    ru: 'Как ',
    en: 'As the ',
    ro: 'Ca ',
  },
  'comp.teamDesc2': {
    kk: ', сіз тобыңызды ресми түрде тіркегелі жатырсыз. Барлық мүшелердің дайын екеніне көз жеткізіңіз.',
    ru: ', вы собираетесь официально зарегистрировать свою команду. Убедитесь, что все участники готовы.',
    en: ', you are about to officially enter your team. Make sure all members are ready.',
    ro: ', sunteți pe cale să înscrieți oficial echipa. Asigurați-vă că toți membrii sunt pregătiți.',
  },
  'comp.cancel': {
    kk: 'Бас тарту',
    ru: 'Отмена',
    en: 'Cancel',
    ro: 'Anulare',
  },
  'comp.confirmReg': {
    kk: 'Тіркеуді растау',
    ru: 'Подтвердить регистрацию',
    en: 'Confirm Registration',
    ro: 'Confirmă Înregistrarea',
  },
  'comp.registering': {
    kk: 'Тіркелуде…',
    ru: 'Регистрация…',
    en: 'Registering…',
    ro: 'Se înregistrează…',
  },
  'comp.registeredIndiv': {
    kk: 'Тіркелді!',
    ru: 'Зарегистрировано!',
    en: 'Registered!',
    ro: 'Înregistrat!',
  },
  'comp.registeredTeam': {
    kk: 'Топ тіркелді!',
    ru: 'Команда зарегистрирована!',
    en: 'Team Registered!',
    ro: 'Echipă Înregistrată!',
  },
  'comp.registeredIndivDesc': {
    kk: 'Сіз осы іс-шараға ресми түрде тіркелдіңіз. Жұлдыздарға ұмтыла беріңіз!',
    ru: 'Вы официально зарегистрированы на это мероприятие. Продолжайте стремиться к звездам!',
    en: 'You have been officially enrolled in this event. Keep pushing for the stars!',
    ro: 'Ați fost înscris oficial la acest eveniment. Continuați să țintiți spre stele!',
  },
  'comp.registeredTeamDesc': {
    kk: 'Сіздің тобыңыз жарысқа ресми түрде тіркелді. Жұлдыздарға ұмтыла беріңіз!',
    ru: 'Ваша команда официально зарегистрирована на соревнование. Продолжайте стремиться к звездам!',
    en: 'Your team has been officially entered into the competition. Keep pushing for the stars!',
    ro: 'Echipa dumneavoastră a fost înscrisă oficial în competiție. Continuați să țintiți spre stele!',
  },
  'comp.continue': {
    kk: 'Жалғастыру',
    ru: 'Продолжить',
    en: 'Continue',
    ro: 'Continuare',
  },
  'comp.regFailed': {
    kk: 'Тіркелу сәтсіз аяқталды',
    ru: 'Ошибка регистрации',
    en: 'Registration Failed',
    ro: 'Înregistrare Eșuată',
  },

  // ── ResetPasswordPage ─────────────────────────────────────────────────────
  'reset.title': {
    kk: 'Құпиясөзді қалпына келтіру',
    ru: 'Сброс пароля',
    en: 'Reset Password',
    ro: 'Resetare parolă',
  },
  'reset.subtitle': {
    kk: 'Жаңа құпиясөзді қауіпсіз орнатыңыз',
    ru: 'Надежно установите новый пароль',
    en: 'Securely set a new password',
    ro: 'Setați în siguranță o nouă parolă',
  },
  'reset.success': {
    kk: 'Құпиясөз жаңартылды!',
    ru: 'Пароль обновлен!',
    en: 'Password Updated!',
    ro: 'Parolă Actualizată!',
  },
  'reset.successDesc': {
    kk: 'Сіздің тіркелгіңіз қауіпсіз қалпына келтірілді. Енді жаңа деректермен ICARUS-қа кіре аласыз.',
    ru: 'Ваш аккаунт был безопасно восстановлен. Теперь вы можете войти в ICARUS с новыми учетными данными.',
    en: 'Your account has been securely recovered out of orbit. You can now access ICARUS with your new credentials.',
    ro: 'Contul dvs. a fost recuperat în siguranță. Acum puteți accesa ICARUS cu noile acreditări.',
  },
  'reset.returnToOrbit': {
    kk: 'Орбитаға оралу',
    ru: 'Вернуться на орбиту',
    en: 'Return to Orbit',
    ro: 'Revenire pe Orbită',
  },
  'reset.newPassword': {
    kk: 'Жаңа құпиясөз',
    ru: 'Новый пароль',
    en: 'New Password',
    ro: 'Parolă Nouă',
  },
  'reset.confirmPassword': {
    kk: 'Жаңа құпиясөзді растаңыз',
    ru: 'Подтвердите новый пароль',
    en: 'Confirm New Password',
    ro: 'Confirmare Parolă Nouă',
  },
  'reset.repeatPassword': {
    kk: 'Құпиясөзді қайталаңыз',
    ru: 'Повторите пароль',
    en: 'Repeat password',
    ro: 'Repetați parola',
  },
  'reset.updating': {
    kk: 'ЖАҢАРТЫЛУДА...',
    ru: 'ОБНОВЛЕНИЕ...',
    en: 'UPDATING...',
    ro: 'ACTUALIZARE...',
  },
  'reset.resetButton': {
    kk: 'ҚҰПИЯСӨЗДІ ҚАЛПЫНА КЕЛТІРУ',
    ru: 'СБРОСИТЬ ПАРОЛЬ',
    en: 'RESET PASSWORD',
    ro: 'RESETARE PAROLĂ',
  },
  'reset.cancel': {
    kk: 'Бас тарту және Басты бетке оралу',
    ru: 'Отмена и возврат на главную',
    en: 'Cancel & Return Home',
    ro: 'Anulare și Revenire Acasă',
  },
  'reset.invalidToken': {
    kk: 'Қалпына келтіру токені жарамсыз немесе жоқ. Жаңа құпиясөзді қалпына келтіру сілтемесін сұраңыз.',
    ru: 'Недействительный или отсутствующий токен сброса. Пожалуйста, запросите новую ссылку для сброса пароля.',
    en: 'Invalid or missing reset token. Please request a new password reset link.',
    ro: 'Token de resetare invalid sau lipsă. Vă rugăm să solicitați un nou link de resetare a parolei.',
  },
  'reset.missingToken': {
    kk: 'Қалпына келтіру токені жоқ.',
    ru: 'Отсутствует токен сброса.',
    en: 'Missing reset token.',
    ro: 'Token de resetare lipsă.',
  },
  'reset.passwordsMismatch': {
    kk: 'Құпиясөздер сәйкес келмейді.',
    ru: 'Пароли не совпадают.',
    en: 'Passwords do not match.',
    ro: 'Parolele nu se potrivesc.',
  },
  'reset.failed': {
    kk: 'Құпиясөзді қалпына келтіру мүмкін болмады. Сілтеменің мерзімі өткен болуы мүмкін.',
    ru: 'Не удалось сбросить пароль. Возможно, срок действия ссылки истек.',
    en: 'Failed to reset password. The link might be expired.',
    ro: 'Eșec la resetarea parolei. Link-ul ar putea fi expirat.',
  },
  'reset.minChars': {
    kk: 'Құпиясөз кемінде 6 таңбадан тұруы керек.',
    ru: 'Пароль должен содержать не менее 6 символов.',
    en: 'Password must be at least 6 characters.',
    ro: 'Parola trebuie să aibă cel puțin 6 caractere.',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  'footer.motto': {
    kk: 'болу - бұл инновация',
    ru: 'быть значит создавать инновации',
    en: 'to be is to innovate',
    ro: 'a fi înseamnă a inova',
  },
  'footer.copyright': {
    kk: '© 2026 ICARUS. Барлық құқықтар қорғалған.',
    ru: '© 2026 ICARUS. Все права защищены.',
    en: '© 2026 ICARUS. All rights reserved.',
    ro: '© 2026 ICARUS. Toate drepturile rezervate.',
  },

  // ── Generic ───────────────────────────────────────────────────────────────
  'generic.guest': {
    kk: 'Қонақ',
    ru: 'Гость',
    en: 'Guest',
    ro: 'Oaspete',
  },
  'generic.back': {
    kk: 'Артқа',
    ru: 'Назад',
    en: 'Back',
    ro: 'Înapoi',
  },
  'generic.loading': {
    kk: 'Жүктелуде...',
    ru: 'Загрузка...',
    en: 'Loading...',
    ro: 'Se încarcă...',
  },
  'generic.leaving': {
    kk: 'Шығу...',
    ru: 'Выход...',
    en: 'Leaving...',
    ro: 'Se iese...',
  },
  'generic.leave': {
    kk: 'Шығу',
    ru: 'Выйти',
    en: 'Leave',
    ro: 'Ieșire',
  },

  // ── NewsPage specific ─────────────────────────────────────────────────────
  'news.platformUpdates': {
    kk: 'Платформа жаңартулары',
    ru: 'Обновления платформы',
    en: 'Platform Updates',
    ro: 'Actualizări platformă',
  },
  'news.latestNews': {
    kk: 'СОҢҒЫ ЖАҢАЛЫҚТАР',
    ru: 'ПОСЛЕДНИЕ НОВОСТИ',
    en: 'LATEST NEWS',
    ro: 'ULTIMELE ȘTIRI',
  },
  'news.noNews': {
    kk: 'Әзірше жаңалық жоқ',
    ru: 'Новостей пока нет',
    en: 'No news yet',
    ro: 'Nicio știre deocamdată',
  },
  'news.checkBack': {
    kk: 'Платформа жаңартулары мен хабарландыруларын кейінірек тексеріңіз.',
    ru: 'Загляните позже для обновлений и объявлений.',
    en: 'Check back later for platform updates and announcements.',
    ro: 'Reveniți mai târziu pentru actualizări și anunțuri.',
  },
  'news.clickToRead': {
    kk: 'Толығырақ оқу үшін басыңыз',
    ru: 'Нажмите для чтения',
    en: 'Click to read more',
    ro: 'Click pentru mai mult',
  },
  'news.readArticle': {
    kk: 'Мақаланы оқу',
    ru: 'Читать статью',
    en: 'Read Article',
    ro: 'Citește articolul',
  },

  // ── LatestNewsBlock specific ──────────────────────────────────────────────
  'news.loadingFeed': {
    kk: 'Жүктелуде...',
    ru: 'Загрузка...',
    en: 'Loading feed...',
    ro: 'Se încarcă...',
  },
  'news.noNewsYet': {
    kk: 'Әзірше жаңалық жоқ',
    ru: 'Новостей пока нет',
    en: 'No news yet',
    ro: 'Nicio știre deocamdată',
  },
  'news.checkLater': {
    kk: 'Кейінірек тексеріңіз',
    ru: 'Загляните позже',
    en: 'Check back later',
    ro: 'Reveniți mai târziu',
  },
  'news.readFullArticle': {
    kk: 'Толығырақ оқу',
    ru: 'Читать полностью',
    en: 'Read Full Article',
    ro: 'Citește articolul complet',
  },

  // ── NewsPostPage specific ─────────────────────────────────────────────────
  'post.backToNews': {
    kk: 'Жаңалықтарға оралу',
    ru: 'К новостям',
    en: 'Back to News',
    ro: 'Înapoi la știri',
  },
  'post.loading': {
    kk: 'Жүктелуде...',
    ru: 'Загрузка...',
    en: 'Loading...',
    ro: 'Se încarcă...',
  },

  // ── ContactUs page ────────────────────────────────────────────────────────
  'contact.getInTouch': {
    kk: 'Бізбен байланысыңыз',
    ru: 'Свяжитесь с нами',
    en: 'Get in touch',
    ro: 'Contactați-ne',
  },
  'contact.title': {
    kk: 'БІЗ ТУРАЛЫ',
    ru: 'О НАС',
    en: 'ABOUT US',
    ro: 'DESPRE NOI',
  },
  'contact.subtitle': {
    kk: 'Бізбен Instagram немесе Telegram арқылы хабарласыңыз.',
    ru: 'Свяжитесь с нами через Instagram или Telegram.',
    en: 'Reach out to us via Instagram or Telegram.',
    ro: 'Contactați-ne prin Instagram sau Telegram.',
  },
  'contact.instagramDesc': {
    kk: 'Жобаның соңғы жаңалықтарын Instagram-да қараңыз',
    ru: 'Следите за последними новостями проекта в Instagram',
    en: 'Follow the latest project updates on Instagram',
    ro: 'Urmărește ultimele actualizări ale proiectului pe Instagram',
  },
  'contact.telegramDesc': {
    kk: 'Telegram-да бізбен жедел байланысыңыз',
    ru: 'Оперативно свяжитесь с нами в Telegram',
    en: 'Reach us quickly through our Telegram channel',
    ro: 'Contactați-ne rapid prin canalul nostru de Telegram',
  },

  // ── Training & Ranking Placeholders ──────────────────────────────────────────
  'training.modules': {
    kk: 'ОҚУ МОДУЛЬДЕРІ',
    ru: 'ОБУЧАЮЩИЕ МОДУЛИ',
    en: 'TRAINING MODULES',
    ro: 'MODULE DE INSTRUIRE',
  },
  'training.comingSoon': {
    kk: 'Жақында',
    ru: 'Скоро',
    en: 'Coming Soon',
    ro: 'În Curând',
  },
  'training.description': {
    kk: 'Интерактивті модульдер арқылы аэроғарыш инженериясының негіздерін меңгеріңіз. Платформаның бұл бөлімі әзірленуде.',
    ru: 'Освойте концепции аэрокосмической инженерии с помощью интерактивных модулей. Этот раздел платформы находится в разработке.',
    en: 'Master aerospace engineering concepts with interactive modules. This section of the platform is currently under development.',
    ro: 'Stăpâniți conceptele ingineriei aerospațiale cu module interactive. Această secțiune a platformei este în curs de dezvoltare.',
  },
  'ranking.system': {
    kk: 'ГЛОБАЛДЫҚ РЕЙТИНГ',
    ru: 'ГЛОБАЛЬНЫЙ РЕЙТИНГ',
    en: 'GLOBAL RANKING',
    ro: 'CLASAMENT GLOBAL',
  },
  'ranking.description': {
    kk: 'Әлемнің түкпір-түкпірінен келген командалармен бақ сынасып, XP жинап, көшбасшылар тақтасында жоғарылаңыз. Көп ұзамай қолжетімді болады.',
    ru: 'Соревнуйтесь с командами со всего мира, зарабатывайте XP и поднимайтесь в таблице лидеров. Раздел будет доступен совсем скоро.',
    en: 'Compete with teams globally, earn XP, and climb the leaderboard. Will be available very soon.',
    ro: 'Concurați cu echipe la nivel global, câștigați XP și urcați în clasament. Va fi disponibil foarte curând.',
  }
}

export default translations
