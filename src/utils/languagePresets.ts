// Preset text samples for different languages and domains
export interface LanguagePresets {
  podcast: string;
  education: string;
  instructions: string;
  story: string;
  ads: string;
  news: string;
  promotional: string;
  vlog: string;
  business: string;
  standup: string;
  enthusiastic: string;
  casual: string;
  hesitant: string;
}

// Podcast-only presets for languages where we only have one sample
const podcastOnlyLanguages: Record<string, string> = {
  'en-GB': "Welcome to our programme exploring the fascinating world of marine biology. From the depths of the ocean to coastal waters, we'll discover the wonders of underwater life.",
  'en-AU': "G'day and welcome to our show about the amazing world of marine biology. From the deep blue ocean to our beautiful coastlines, we'll explore the incredible underwater world.",
  'en-CA': "Welcome to our podcast about the wonderful world of marine biology. From the depths of the ocean to our coastal waters, we'll explore the amazing underwater ecosystems.",
  'en-IN': "Welcome to our programme on marine biology. We will explore the fascinating world beneath the oceans, from the deepest waters to coastal regions.",
  'hi-IN': 'समुद्री जीव विज्ञान की आकर्षक दुनिया में आपका स्वागत है। गहरे समुद्र से लेकर तटीय क्षेत्रों तक, हम पानी के नीचे की अद्भुत दुनिया के बारे में जानेंगे।',
  'es-ES': 'Bienvenidos a nuestro programa sobre el fascinante mundo de la biología marina. Desde las profundidades del océano hasta las costas, exploraremos las maravillas del mundo submarino.',
  'es-MX': 'Bienvenidos a nuestro podcast sobre el fascinante mundo de la biología marina. Desde las profundidades del mar hasta nuestras costas, exploraremos las maravillas del mundo submarino.',
  'ja-JP': '海洋生物学の魅力的な世界へようこそ。深海から沿岸まで、水中世界の驚異とそこに生息する生き物たちについて探求していきます。',
  'fr-FR': 'Bienvenue dans notre émission sur le monde fascinant de la biologie marine. Des profondeurs océaniques aux côtes, nous explorerons les merveilles du monde sous-marin.',
  'fr-CA': 'Bienvenue à notre émission sur le merveilleux monde de la biologie marine. Des profondeurs de l\'océan jusqu\'aux côtes, nous explorerons les merveilles du monde sous-marin.',
  'pt-BR': 'Bem-vindos ao nosso podcast sobre o fascinante mundo da biologia marinha. Das profundezas do oceano até as costas, vamos explorar as maravilhas do mundo submarino.',
  'pt-PT': 'Bem-vindos ao nosso programa sobre o fascinante mundo da biologia marinha. Desde as profundezas do oceano até às costas, iremos explorar as maravilhas do mundo submarino.',
  'it-IT': 'Benvenuti al nostro programma sul affascinante mondo della biologia marina. Dalle profondità dell\'oceano alle coste, esploreremo le meraviglie del mondo sottomarino.',
  'zh-TW': '歡迎來到我們關於海洋生物學奇妙世界的節目。從深海到海岸,我們將探索水下世界的奇蹟和生活在那裡的神奇生物。',
  'ko-KR': '해양 생물학의 매혹적인 세계에 오신 것을 환영합니다. 깊은 바다에서 해안까지, 우리는 수중 세계의 경이로움과 그곳에 사는 놀라운 생물들을 탐험할 것입니다.',
  'nl-NL': 'Welkom bij ons programma over de fascinerende wereld van de mariene biologie. Van de diepten van de oceaan tot de kustlijnen, we verkennen de wonderen van de onderwaterwereld.',
  'sv-SE': 'Välkommen till vårt program om den fascinerande världen av marinbiologi. Från havets djup till kusterna kommer vi att utforska undervattensvärldens under.',
  'pl-PL': 'Witamy w naszym programie o fascynującym świecie biologii morskiej. Od głębin oceanu po wybrzeża, będziemy odkrywać cuda podwodnego świata.',
  'nb-NO': 'Velkommen til vårt program om den fascinerende verden av marinbiologi. Fra havets dyp til kystene vil vi utforske undervannens underverker.',
  'da-DK': 'Velkommen til vores program om den fascinerende verden af marinbiologi. Fra havets dybder til kysterne vil vi udforske undervandensverdenens vidundere.',
  'fi-FI': 'Tervetuloa ohjelmaammme meribiologian kiehtovasta maailmasta. Valtameren syvyyksistä rannikoille tutkimme vedenalaisen maailman ihmeitä.',
  'ru-RU': 'Добро пожаловать в нашу программу об удивительном мире морской биологии. От глубин океана до побережья мы будем исследовать чудеса подводного мира.',
  'ca-ES': 'Benvinguts al nostre programa sobre el fascinant món de la biologia marina. Des de les profunditats de l\'oceà fins a les costes, explorarem les meravelles del món submarí.',
  'tr-TR': 'Deniz biyolojisinin büyüleyici dünyası hakkındaki programımıza hoş geldiniz. Okyanusun derinliklerinden kıyılara kadar, su altı dünyasının harikalarını keşfedeceğiz.',
  'ar-SA': 'مرحباً بكم في برنامجنا عن عالم الأحياء البحرية الرائع. من أعماق المحيط إلى السواحل، سنستكشف عجائب العالم تحت الماء.',
  'ar-EG': 'أهلاً بكم في برنامجنا عن عالم الأحياء البحرية المثير. من أعماق المحيط إلى الشواطئ، سوف نستكشف عجائب العالم تحت الماء.',
  'th-TH': 'ยินดีต้อนรับสู่รายการของเราเกี่ยวกับโลกอันน่าทึ่งของชีววิทยาทางทะเล จากส่วนลึกของมหาสมุทรไปจนถึงชายฝั่ง เราจะสำรวจความมหัศจรรย์ของโลกใต้น้ำ',
  'he-IL': 'ברוכים הבאים לתוכנית שלנו על העולם המרתק של הביולוגיה הימית. מעומקי האוקיינוס ועד לחופים, נחקור את הפלאים של העולם התת-ימי.',
  'cs-CZ': 'Vítejte v našem pořadu o fascinujícím světě mořské biologie. Od hlubin oceánu až po pobřeží budeme zkoumat zázraky podmořského světa.',
  'hu-HU': 'Üdvözöljük műsorunkban a tengeri biológia lenyűgöző világáról. Az óceán mélyétől a partokig felfedezzük a víz alatti világ csodáit.',
  'uk-UA': 'Ласкаво просимо до нашої програми про захоплюючий світ морської біології. Від глибин океану до узбережжя ми досліджуватимемо дива підводного світу.',
  'cy-GB': 'Croeso i\'n rhaglen am fyd hynod ddiddorol bioleg forol. O ddyfnderoedd y cefnfor i\'r arfordiroedd, byddwn yn archwilio rhyfeddodau\'r byd tanddwr.',
  'vi-VN': 'Chào mừng đến với chương trình của chúng tôi về thế giới hấp dẫn của sinh học biển. Từ độ sâu của đại dương đến bờ biển, chúng ta sẽ khám phá những kỳ quan của thế giới dưới nước.',
  'sl-SI': 'Dobrodošli v našem programu o fascinantnem svetu morske biologije. Od globin oceana do obal bomo raziskovali čudeže podvodnega sveta.',
  'id-ID': 'Selamat datang di program kami tentang dunia biologi laut yang menarik. Dari kedalaman samudra hingga garis pantai, kami akan menjelajahi keajaiban dunia bawah laut.',
  'el-GR': 'Καλώς ήρθατε στο πρόγραμμά μας για τον συναρπαστικό κόσμο της θαλάσσιας βιολογίας. Από τα βάθη του ωκεανού μέχρι τις ακτές, θα εξερευνήσουμε τα θαύματα του υποβρύχιου κόσμου.',
  'sk-SK': 'Vitajte v našom programe o fascinujúcom svete morskej biológie. Od hlbín oceánu až po pobrežia budeme skúmať zázraky podmorského sveta.',
  'hr-HR': 'Dobrodošli u naš program o fascinantnom svijetu morske biologije. Od dubina oceana do obala, istražit ćemo čuda podvodnog svijeta.',
  'ro-RO': 'Bun venit la programul nostru despre lumea fascinantă a biologiei marine. De la adâncurile oceanului până la coaste, vom explora minunile lumii subacvatice.',
  'lt-LT': 'Sveiki atvykę į mūsų programą apie žavų jūrų biologijos pasaulį. Nuo vandenyno gelmių iki krantų tyrinėsime povandeninio pasaulio stebuklus.',
  'bg-BG': 'Добре дошли в нашата програма за fascinating world на морската биология. От дълбините на океана до бреговете ще изследваме чудесата на подводния свят.',
  'lv-LV': 'Laipni lūdzam mūsu programmā par aizraujošo jūras bioloģijas pasauli. No okeāna dziļumiem līdz krastiem mēs izpētīsim zemūdens pasaules brīnumus.',
  'et-EE': 'Tere tulemast meie saatesse põnevast merebioloogia maailmast. Ookeani sügavustest kuni rannikualadeni uurime veealuse maailma imesid.',
  'sr-RS': 'Dobrodošli u naš program o fascinantnom svetu morske biologije. Od dubina okeana do obala, istražićemo čuda podvodnog sveta.',
};

export const domainPresets: Record<string, LanguagePresets> = {
  'en-US': {
    podcast: "Welcome to One Fish, Two Fish, the podcast that aims to make you laugh as you learn about the fascinating world of marine biology. From the depths of the deep blue to the shores of our coastlines, we'll explore the wonders of the underwater world and the creatures that call it home.",
    education: "Welcome to today's online math lesson! In this session, we'll delve into the fascinating world of algebra. We'll start by exploring the basics, from solving simple equations like 2x plus 5 equals 11, to understanding variables and coefficients.",
    instructions: "As you complete the inspection, take clear and comprehensive notes. Use our standardized checklist as a guide, noting any deviations or areas of concern. If possible, take photographs to visually document any hazards or non-compliance issues.",
    story: "A gentle melancholy weighed on her heart, woven from memories of a time when laughter echoed through these very meadows. She traced the delicate petals of a forgotten daisy, lost in thought until a soft voice broke the silence.",
    ads: "Introducing the all-new iPhone, setting the standard for Innovation Redefined. Boasting a sleek design and cutting-edge features, this iPhone redefines the pinnacle of technology.",
    news: "Turning to international news, NASA's recent successful mission to send a rover to explore Mars has captured the world's attention. The rover, named 'Perseverance,' touched down on the Martian surface earlier this week.",
    promotional: "Ladies, it's time for some self-pampering! Treat yourself to a moment of bliss with our exclusive Winter Spa Package. Indulge in a rejuvenating spa day like never before, and let your worries melt away.",
    vlog: "Hey, beautiful people! Welcome back to my channel. Today, we're about to spill all the tea on the latest makeup must-haves. Whether you're a makeup enthusiast or just looking to up your glam game, you're in the right place.",
    business: "Winnebago Industries is a company that manufactures motor homes, travel trailers, and other recreational vehicles. Its stock ticker symbol is WGO and it is traded on the New York Stock Exchange.",
    standup: "Oh boy, here we go. You know, I walked into this improv show, and I thought, 'Hey, this could be fun. Maybe they'll have a surprise for me.' Well, guess what? The surprise was that I got roped into doing standup for you folks.",
    enthusiastic: "Oh my gosh, that's AMAZING news! Congratulations! How are you feeling about it all? Any excitement, nerves, or a mix of both? Tell me everything!",
    casual: "Oh no, I didn't mean to disappoint! How about this: If you want something quirky and fun with lots of laughs, go for Blue Man Group. If you're looking for something awe-inspiring and magical, Cirque du Soleil is your best bet.",
    hesitant: "So, uh, I was thinking—no, I mean, I was wondering if, um, if you might want to go to the, uh, the new Italian restaurant on Friday? I've heard it's really—what's the word—oh, exquisite."
  },
  'zh-CN': {
    podcast: "欢迎来到我们关于海洋生物学奇妙世界的节目。从深海到海岸,我们将探索水下世界的奇迹和生活在那里的神奇生物。",
    education: "欢迎来到今天的在线数学课！在本课程中，我们将深入探讨代数的迷人世界。我们将从基础开始，从解决简单的方程式到理解变量和系数。",
    instructions: "在完成检查时，请做清晰全面的记录。使用我们的标准化清单作为指南，注明任何偏差或关注的领域。如果可能，请拍照以视觉方式记录任何危险或不合规问题。",
    story: "一种温柔的忧郁压在她的心头，这是由那个笑声回荡在这片草地的时光的记忆编织而成的。她轻抚着一朵被遗忘的雏菊的娇嫩花瓣，陷入沉思，直到一个温柔的声音打破了沉默。",
    ads: "隆重推出全新iPhone，树立创新重新定义的标准。拥有时尚的设计和尖端功能，这款iPhone重新定义了技术的巅峰。",
    news: "转向国际新闻，NASA最近成功向火星发送探测器的任务引起了全世界的关注。这个名为毅力号的探测器于本周早些时候降落在火星表面。",
    promotional: "女士们，是时候宠爱自己了！用我们独家的冬季水疗套餐给自己一刻的幸福。享受前所未有的焕发活力的水疗日，让您的烦恼烟消云散。",
    vlog: "嘿，美丽的人们！欢迎回到我的频道。今天，我们将分享最新的化妆必备品。无论您是化妆爱好者还是只是想提升您的魅力，您都来对地方了。",
    business: "Winnebago Industries是一家制造房车、旅行拖车和其他休闲车辆的公司。其股票代码为WGO，在纽约证券交易所交易。",
    standup: "哦天哪，又来了。你知道，我走进这个即兴表演，我想，嘿，这可能会很有趣。你猜怎么着？惊喜就是我被拉去给你们做单口相声。",
    enthusiastic: "哦天哪，这真是太棒的消息了！恭喜！你对此感觉如何？兴奋、紧张，还是两者兼有？",
    casual: "哦不，我不是要让你失望！这样如何：如果你想要一些古怪有趣、充满欢笑的东西，那就选蓝人乐队。如果你想要一些令人敬畏和神奇的东西，太阳马戏团是你最好的选择。",
    hesitant: "所以，呃，我在想——不，我的意思是，我在想，嗯，你是否想去，呃，周五去那家新的意大利餐厅？我听说它真的——怎么说呢——哦，精致。"
  },
  'de-DE': {
    podcast: "Willkommen zu unserem Podcast über die faszinierende Welt der Meeresbiologie. Von den Tiefen des Ozeans bis zu den Küsten werden wir die Wunder der Unterwasserwelt und die erstaunlichen Kreaturen erkunden.",
    education: "Willkommen zur heutigen Online-Mathematikstunde! In dieser Sitzung werden wir in die faszinierende Welt der Algebra eintauchen. Wir beginnen mit den Grundlagen, vom Lösen einfacher Gleichungen bis zum Verständnis von Variablen.",
    instructions: "Machen Sie bei der Durchführung der Inspektion klare und umfassende Notizen. Verwenden Sie unsere standardisierte Checkliste als Leitfaden und notieren Sie Abweichungen oder Problembereiche.",
    story: "Eine sanfte Melancholie lag auf ihrem Herzen, gewebt aus Erinnerungen an eine Zeit, als Lachen durch diese Wiesen hallte. Sie strich über die zarten Blütenblätter eines vergessenen Gänseblümchens.",
    ads: "Wir präsentieren das brandneue iPhone, das den Standard für neu definierte Innovation setzt. Mit elegantem Design und modernsten Funktionen definiert dieses iPhone den Gipfel der Technologie neu.",
    news: "In den internationalen Nachrichten hat die erfolgreiche Mission der NASA, einen Rover zum Mars zu schicken, weltweite Aufmerksamkeit erregt. Der Rover namens Perseverance landete diese Woche auf der Marsoberfläche.",
    promotional: "Meine Damen, es ist Zeit für etwas Selbstverwöhnung! Gönnen Sie sich einen Moment der Glückseligkeit mit unserem exklusiven Winter-Spa-Paket.",
    vlog: "Hallo, ihr Lieben! Willkommen zurück auf meinem Kanal. Heute werden wir über die neuesten Make-up-Must-haves sprechen.",
    business: "Winnebago Industries ist ein Unternehmen, das Wohnmobile, Reiseanhänger und andere Freizeitfahrzeuge herstellt. Das Börsenkürzel lautet WGO und wird an der New Yorker Börse gehandelt.",
    standup: "Oh je, jetzt geht's los. Wissen Sie, ich kam zu dieser Improv-Show und dachte: 'Hey, das könnte lustig werden.' Die Überraschung war, dass ich hier Stand-up für Sie machen muss.",
    enthusiastic: "Oh mein Gott, das sind ja fantastische Neuigkeiten! Herzlichen Glückwunsch! Wie fühlen Sie sich dabei? Aufgeregt, nervös oder beides?",
    casual: "Oh nein, das wollte ich nicht! Wie wäre es damit: Wenn Sie etwas Skurriles mit viel Lachen wollen, nehmen Sie die Blue Man Group. Für etwas Magisches ist Cirque du Soleil die beste Wahl.",
    hesitant: "Also, äh, ich habe gedacht—nein, ich meine, ich habe mich gefragt, ob, ähm, ob Sie vielleicht Freitag in das, äh, neue italienische Restaurant gehen möchten?"
  },
};

// Get language code from voice name (e.g., "en-US-JennyNeural" -> "en-US" or "de-DE-KatjaNeural" -> "de-DE")
export function getLanguageFromVoice(voiceName: string): string {
  // Match pattern like "en-US", "de-DE", etc. (case insensitive for the locale part)
  const match = voiceName.match(/^([a-z]{2}-[A-Z]{2})/i);
  if (match) {
    // Normalize to lowercase-UPPERCASE format (e.g., "de-DE")
    const parts = match[1].split('-');
    return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
  }
  return 'en-US';
}

// Get presets for a specific language with fallback
export function getPresetsForLanguage(langCode: string): LanguagePresets {
  // If we have full domain presets for this language, return them
  if (domainPresets[langCode]) {
    return domainPresets[langCode];
  }

  // If we have a podcast-only preset, use it for all domains
  if (podcastOnlyLanguages[langCode]) {
    const podcastText = podcastOnlyLanguages[langCode];
    return {
      podcast: podcastText,
      education: podcastText,
      instructions: podcastText,
      story: podcastText,
      ads: podcastText,
      news: podcastText,
      promotional: podcastText,
      vlog: podcastText,
      business: podcastText,
      standup: podcastText,
      enthusiastic: podcastText,
      casual: podcastText,
      hesitant: podcastText,
    };
  }

  // Ultimate fallback to en-US
  return domainPresets['en-US'];
}
