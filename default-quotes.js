// ==========================================
// 默认语录库 - 用于启动页展示
// ==========================================

console.log('📚 default-quotes.js 已加载');

/**
 * 默认语录库 - 仅用于启动页随机展示
 * 不会添加到用户书库中
 */
const DEFAULT_SPLASH_QUOTES = [
    {
        text: '未经审视的人生不值得度过。',
        author: '苏格拉底'
    },
    {
        text: '我们一直寻找的，却是自己原本早已拥有的；我们总是东张西望，唯独漏了自己想要的，这就是我们至今难以如愿以偿的原因。',
        author: '柏拉图'
    },
    {
        text: '人生最终的价值在于觉醒和思考的能力，而不只在于生存。',
        author: '亚里士多德'
    },
    {
        text: '每天反复做的事情造就了我们，然后你会发现，优秀不是一种行为，而是一种习惯。',
        author: '亚里士多德'
    },
    {
        text: '我思故我在。',
        author: '笛卡尔'
    },
    {
        text: '人生而自由，却无往不在枷锁中。',
        author: '卢梭'
    },
    {
        text: '自由不是让你想做什么就做什么，自由是教你不想做什么，就可以不做什么。',
        author: '康德'
    },
    {
        text: '世界上有两件东西能震撼人们的心灵：一件是我们心中崇高的道德标准；另一件是我们头顶上灿烂的星空。',
        author: '康德'
    },
    {
        text: '存在即合理。',
        author: '黑格尔'
    },
    {
        text: '人类从历史中所得到的教训就是：人类从来不记取历史教训。',
        author: '黑格尔'
    },
    {
        text: '每一个不曾起舞的日子，都是对生命的辜负。',
        author: '尼采'
    },
    {
        text: '人当诗意地栖居。',
        author: '海德格尔'
    },
    {
        text: '活着不是目的，活着才是目的。',
        author: '亚瑟·叔本华'
    },
    {
        text: '当你凝视深渊时，深渊也在凝视着你。',
        author: '弗里德里希·尼采《善恶的彼岸》'
    },
    {
        text: '我不同意你的观点，但我誓死捍卫你说话的权利。',
        author: '伏尔泰'
    },
    {
        text: '他人即地狱。',
        author: '让-保罗·萨特'
    },
    {
        text: '存在先于本质。',
        author: '让-保罗·萨特'
    },
    {
        text: '我们走得太远，以至于忘记了为什么而出发。',
        author: '纪伯伦'
    },
    {
        text: '你真正的价值取决于你所能给予他人的，而非你所能获取的。',
        author: '阿尔伯特·爱因斯坦'
    },
    {
        text: '要容忍不同意见，因为如果意见不被容忍，真理就没有存在的机会。',
        author: '伯特兰·罗素'
    },
    {
        text: '行动是治愈恐惧的良药。',
        author: '威廉·詹姆斯'
    },
    {
        text: '吾生也有涯，而知也无涯。',
        author: '庄子'
    }
];

/**
 * 获取随机默认语录
 */
function getRandomDefaultQuote() {
    const randomIndex = Math.floor(Math.random() * DEFAULT_SPLASH_QUOTES.length);
    return DEFAULT_SPLASH_QUOTES[randomIndex];
}

console.log('✅ default-quotes.js 配置完成，共', DEFAULT_SPLASH_QUOTES.length, '条默认语录');
