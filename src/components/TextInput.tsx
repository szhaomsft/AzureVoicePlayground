import React, { useRef, useEffect, useState } from 'react';
import { WordBoundary, SynthesisState } from '../types/azure';

interface TextInputProps {
  text: string;
  onTextChange: (text: string) => void;
  wordBoundaries: WordBoundary[];
  currentWordIndex: number;
  selectedVoice: string;
  state: SynthesisState;
}

export function TextInput({
  text,
  onTextChange,
  wordBoundaries,
  currentWordIndex,
  selectedVoice,
  state,
}: TextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [showSSML, setShowSSML] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  // Preset texts for different domains and languages
  const presets = {
    'en-US': {
      podcast: "Welcome to One Fish, Two Fish, the podcast that aims to make you laugh as you learn about the fascinating world of marine biology. From the depths of the deep blue to the shores of our coastlines, we'll explore the wonders of the underwater world and the creatures that call it home. Join us each week as we dive into the latest research, meet the experts in the field, and, discover the stories of the people dedicated to protecting our oceans along with the incredible species that inhabit them.",
      education: "Welcome to today's online math lesson! In this session, we'll delve into the fascinating world of algebra. We'll start by exploring the basics, from solving simple equations like 2x plus 5 equals 11, to understanding variables and coefficients. As we progress, we'll tackle more complex concepts, but for now let's start by solving for x.",
      instructions: "As you complete the inspection, take clear and comprehensive notes. Use our standardized checklist as a guide, noting any deviations or areas of concern. If possible, take photographs to visually document any hazards or non-compliance issues. These notes and visuals will serve as evidence of your inspection findings. When you compile your report, include these details along with recommendations for corrective actions.",
      story: "A gentle melancholy weighed on her heart, woven from memories of a time when laughter echoed through these very meadows. She traced the delicate petals of a forgotten daisy, lost in thought until a soft voice broke the silence. \"Lily,\" her grandmother's voice, warm and comforting, carried across the distance. \"Do you remember the stories of this place?\" Lily turned, meeting the eyes that had seen decades of life's ups and downs. \"I do, Grandma,\" she replied, a bittersweet smile tugging at her lips. \"But it feels like those days are long gone.\"",
      ads: "Introducing the all-new iPhone, setting the standard for Innovation Redefined. Boasting a sleek design and cutting-edge features, this iPhone redefines the pinnacle of technology. From its captivating Super Retina XDR display to the formidable A15 Bionic chip, every aspect has been meticulously designed to elevate your smartphone experience.",
      news: "Turning to international news, NASA's recent successful mission to send a rover to explore Mars has captured the world's attention. The rover, named 'Perseverance,' touched down on the Martian surface earlier this week, marking a historic achievement in space exploration. It's equipped with cutting-edge technology and instruments to search for signs of past microbial life and gather data about the planet's geology.",
      promotional: "Ladies, it's time for some self-pampering! Treat yourself to a moment of bliss with our exclusive Winter Spa Package. Indulge in a rejuvenating spa day like never before, and let your worries melt away. We're excited to offer you a limited-time sale, making self-care more affordable than ever. Elevate your well-being, embrace relaxation, and step into a world of tranquility with us this Winter.",
      vlog: "Hey, beautiful people! Welcome back to my channel. Today, we're about to spill all the tea on the latest makeup must-haves. Whether you're a makeup enthusiast or just looking to up your glam game, you're in the right place. Don't forget to hit that subscribe button, give us a thumbs up, and let's get started with today's fabulous makeup review!",
      business: "Winnebago Industries is a company that manufactures motor homes, travel trailers, and other recreational vehicles. Its stock ticker symbol is WGO and it is traded on the New York Stock Exchange (NYSE). I hope this helps! Let me know if you have any other questions.",
      standup: "Oh boy, here we go. You know, I walked into this improv show, and I thought, \"Hey, this could be fun. Maybe they'll have a surprise for me.\" Well, guess what? The surprise was that I got roped into doing standup for you folks. The last time I got roped into something, I ended up at a cousin's wedding in Ohio. Yeah, Ohio. Can you imagine? But enough about my tragic family reunions.",
      enthusiastic: "Oh my gosh, that's AMAZING news! Congratulations! How are you feeling about it all? Any excitement, nerves, or a mix of both? Tell me everything!",
      casual: "Oh no, I didn't mean to disappoint! How about this: If you want something quirky and fun with lots of laughs, go for Blue Man Group. If you're looking for something awe-inspiring and magical, Cirque du Soleil is your best bet. Both will make for a memorable first date, so you can't go wrong.",
      hesitant: "So, uh, I was thinking—no, I mean, I was wondering if, um, if you might want to go to the, uh, the new Italian restaurant on Friday? I've heard it's really—what's the word—oh, exquisite, and they, ah, they have the best, uh, seafood in town."
    },
    'zh-CN': {
      podcast: "欢迎来到《一条鱼，两条鱼》播客节目，我们的目标是让您在了解迷人的海洋生物学世界的同时开怀大笑。从深蓝海洋的深处到海岸线，我们将探索水下世界的奇观以及那里的生物。每周加入我们，深入了解最新研究，会见该领域的专家，发现那些致力于保护海洋及其栖息的不可思议物种的人们的故事。",
      education: "欢迎来到今天的在线数学课！在本课程中，我们将深入探讨代数的迷人世界。我们将从基础开始，从解决简单的方程式（如2x加5等于11）到理解变量和系数。随着课程的进展，我们将处理更复杂的概念，但现在让我们先从求解x开始。",
      instructions: "在完成检查时，请做清晰全面的记录。使用我们的标准化清单作为指南，注明任何偏差或关注的领域。如果可能，请拍照以视觉方式记录任何危险或不合规问题。这些笔记和视觉资料将作为您检查结果的证据。当您编写报告时，请包含这些详细信息以及纠正措施的建议。",
      story: "一种温柔的忧郁压在她的心头，这是由那个笑声回荡在这片草地的时光的记忆编织而成的。她轻抚着一朵被遗忘的雏菊的娇嫩花瓣，陷入沉思，直到一个温柔的声音打破了沉默。莉莉，她祖母温暖而安慰的声音从远处传来。你还记得这个地方的故事吗？莉莉转过身，与那双见证了几十年人生起伏的眼睛相遇。我记得，奶奶，她回答道，嘴角扬起一丝苦涩的微笑。但感觉那些日子早已远去。",
      ads: "隆重推出全新iPhone，树立创新重新定义的标准。拥有时尚的设计和尖端功能，这款iPhone重新定义了技术的巅峰。从令人着迷的Super Retina XDR显示屏到强大的A15仿生芯片，每个方面都经过精心设计，以提升您的智能手机体验。",
      news: "转向国际新闻，NASA最近成功向火星发送探测器的任务引起了全世界的关注。这个名为毅力号的探测器于本周早些时候降落在火星表面，标志着太空探索的历史性成就。它配备了尖端技术和仪器，用于寻找过去微生物生命的迹象并收集有关该星球地质的数据。",
      promotional: "女士们，是时候宠爱自己了！用我们独家的冬季水疗套餐给自己一刻的幸福。享受前所未有的焕发活力的水疗日，让您的烦恼烟消云散。我们很高兴为您提供限时优惠，让自我护理变得更加实惠。提升您的幸福感，拥抱放松，与我们一起步入这个冬季的宁静世界。",
      vlog: "嘿，美丽的人们！欢迎回到我的频道。今天，我们将分享最新的化妆必备品。无论您是化妆爱好者还是只是想提升您的魅力，您都来对地方了。别忘了点击订阅按钮，给我们点个赞，让我们开始今天精彩的化妆评测吧！",
      business: "Winnebago Industries是一家制造房车、旅行拖车和其他休闲车辆的公司。其股票代码为WGO，在纽约证券交易所(NYSE)交易。希望这能帮到您！如果您有任何其他问题，请告诉我。",
      standup: "哦天哪，又来了。你知道，我走进这个即兴表演，我想，嘿，这可能会很有趣。也许他们会给我一个惊喜。你猜怎么着？惊喜就是我被拉去给你们做单口相声。上次我被拉去做什么事，结果去了俄亥俄州参加表亲的婚礼。是的，俄亥俄州。你能想象吗？但说够了我悲惨的家庭聚会。",
      enthusiastic: "哦天哪，这真是太棒的消息了！恭喜！你对此感觉如何？兴奋、紧张，还是两者兼有？跟我说说一切！",
      casual: "哦不，我不是要让你失望！这样如何：如果你想要一些古怪有趣、充满欢笑的东西，那就选蓝人乐队。如果你想要一些令人敬畏和神奇的东西，太阳马戏团是你最好的选择。两者都会让第一次约会难忘，所以你不会出错的。",
      hesitant: "所以，呃，我在想——不，我的意思是，我在想，嗯，你是否想去，呃，周五去那家新的意大利餐厅？我听说它真的——怎么说呢——哦，精致，而且他们，啊，他们有最好的，呃，镇上的海鲜。"
    }
  };

  // Determine language based on selected voice
  const getLanguage = (): 'en-US' | 'zh-CN' => {
    if (selectedVoice.toLowerCase().includes('zh-cn')) {
      return 'zh-CN';
    }
    return 'en-US';
  };

  const currentLanguage = getLanguage();
  const currentPresets = presets[currentLanguage];

  // Auto-update text when voice language changes and text matches a preset
  useEffect(() => {
    // Check if current text matches any preset in either language
    const enPresets = Object.values(presets['en-US']);
    const cnPresets = Object.values(presets['zh-CN']);

    // Find which preset the current text matches
    let matchedPresetKey: string | null = null;

    if (enPresets.includes(text)) {
      // Text is an English preset, find which one
      matchedPresetKey = Object.keys(presets['en-US']).find(
        key => presets['en-US'][key as keyof typeof presets['en-US']] === text
      ) || null;
    } else if (cnPresets.includes(text)) {
      // Text is a Chinese preset, find which one
      matchedPresetKey = Object.keys(presets['zh-CN']).find(
        key => presets['zh-CN'][key as keyof typeof presets['zh-CN']] === text
      ) || null;
    }

    // If a preset is matched and language changed, update to new language
    if (matchedPresetKey && currentPresets[matchedPresetKey as keyof typeof currentPresets]) {
      const newText = currentPresets[matchedPresetKey as keyof typeof currentPresets];
      if (newText !== text) {
        console.log(`Language changed to ${currentLanguage}, updating preset: ${matchedPresetKey}`);
        onTextChange(newText);
      }
    }
  }, [selectedVoice]); // Only trigger when voice changes

  const handlePresetSelect = (presetKey: string) => {
    if (presetKey && currentPresets[presetKey as keyof typeof currentPresets]) {
      onTextChange(currentPresets[presetKey as keyof typeof currentPresets]);
      setShowSSML(false); // Reset to plain text view when loading preset
    }
  };

  const isPlaying = state === 'synthesizing' || state === 'playing';

  // Auto-scroll to keep current word visible
  useEffect(() => {
    if (currentWordIndex >= 0 && currentWordIndex < wordBoundaries.length) {
      const boundary = wordBoundaries[currentWordIndex];
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const textBeforeBoundary = text.substring(0, boundary.offset);
        const lines = textBeforeBoundary.split('\n').length;
        const lineHeight = 24; // Approximate line height
        const scrollPosition = (lines - 1) * lineHeight;

        // Scroll to make current word visible
        textarea.scrollTop = Math.max(0, scrollPosition - textarea.clientHeight / 2);
      }
    }
  }, [currentWordIndex, wordBoundaries, text]);

  // Create highlighted text
  const getHighlightedText = () => {
    if (currentWordIndex < 0 || currentWordIndex >= wordBoundaries.length) {
      return text;
    }

    const boundary = wordBoundaries[currentWordIndex];
    const before = text.substring(0, boundary.offset);
    const highlighted = text.substring(boundary.offset, boundary.offset + boundary.length);
    const after = text.substring(boundary.offset + boundary.length);

    return (
      <>
        {before}
        <span className="bg-yellow-300 font-semibold">{highlighted}</span>
        {after}
      </>
    );
  };

  // Generate SSML from plain text
  const generateSSML = () => {
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="${selectedVoice}">
    ${text}
  </voice>
</speak>`;
  };

  const displayText = showSSML ? generateSSML() : text;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Text to Synthesize</h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>
            {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          <span>
            {charCount} char{charCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Preset selector */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Load Preset Text
        </label>
        <select
          onChange={(e) => handlePresetSelect(e.target.value)}
          disabled={isPlaying}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          defaultValue=""
        >
          <option value="">-- Select a preset --</option>
          <option value="podcast">Podcast</option>
          <option value="education">Education/Learning</option>
          <option value="instructions">Instructions/Guidance</option>
          <option value="story">Story/Narrative</option>
          <option value="ads">Advertisement</option>
          <option value="news">News Report</option>
          <option value="promotional">Promotional/Marketing</option>
          <option value="vlog">Vlog/Social Media</option>
          <option value="business">Business/Professional</option>
          <option value="standup">Stand-up Comedy</option>
          <option value="enthusiastic">Enthusiastic/Excited</option>
          <option value="casual">Casual Conversation</option>
          <option value="hesitant">Hesitant/Uncertain</option>
        </select>
      </div>

      <div className="flex-1 relative">
        {/* Highlighted overlay */}
        {currentWordIndex >= 0 && (
          <div
            ref={highlightRef}
            className="absolute inset-0 px-3 py-2 pointer-events-none overflow-hidden whitespace-pre-wrap break-words font-mono text-base leading-6 text-transparent"
            style={{ zIndex: 1 }}
          >
            {getHighlightedText()}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={displayText}
          onChange={(e) => !showSSML && onTextChange(e.target.value)}
          placeholder="Enter text here to convert to speech..."
          readOnly={showSSML}
          className="w-full h-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-base leading-6"
          style={{ position: 'relative', zIndex: 2, background: showSSML ? '#f9fafb' : 'transparent' }}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setShowSSML(!showSSML)}
          disabled={!text}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showSSML ? 'Show Plain Text' : 'Show SSML'}
        </button>
        <button
          onClick={() => onTextChange('')}
          disabled={!text}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Text
        </button>
      </div>
    </div>
  );
}
