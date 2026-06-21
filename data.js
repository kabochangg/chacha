(function (globalScope) {
  "use strict";

  // 診断タイプの識別子です。
  // type の値を変更する場合は、質問・結果・判定順のすべてを揃えてください。
  const TYPES = Object.freeze({
    BLOG: "blog",
    SNS: "sns",
    SKILL: "skill",
    CONTENT: "content",
  });

  const questions = [
    {
      title: "副業に使える時間は、どんな形が近いですか？",
      choices: [
        { label: "週末にまとめて作業したい", type: TYPES.BLOG },
        { label: "毎日少しずつ発信したい", type: TYPES.SNS },
        { label: "依頼がある時に集中したい", type: TYPES.SKILL },
        { label: "一度作ったものを育てたい", type: TYPES.CONTENT },
      ],
    },
    {
      title: "得意に近い作業はどれですか？",
      choices: [
        { label: "調べてわかりやすく整理する", type: TYPES.BLOG },
        { label: "短い言葉で人に伝える", type: TYPES.SNS },
        { label: "相手の困りごとを手伝う", type: TYPES.SKILL },
        { label: "手順や型にまとめる", type: TYPES.CONTENT },
      ],
    },
    {
      title: "反応があるとうれしいのはどれですか？",
      choices: [
        { label: "検索から長く読まれる", type: TYPES.BLOG },
        { label: "投稿にコメントや反応が来る", type: TYPES.SNS },
        { label: "ありがとうと直接言われる", type: TYPES.SKILL },
        { label: "作ったものが購入される", type: TYPES.CONTENT },
      ],
    },
    {
      title: "苦になりにくいことはどれですか？",
      choices: [
        { label: "長めの文章を書く", type: TYPES.BLOG },
        { label: "こまめに投稿する", type: TYPES.SNS },
        { label: "納期に合わせて作業する", type: TYPES.SKILL },
        { label: "教材やテンプレを改善する", type: TYPES.CONTENT },
      ],
    },
    {
      title: "最初に避けたいことはどれですか？",
      choices: [
        { label: "毎日SNSに張り付くこと", type: TYPES.BLOG },
        { label: "長い記事を何本も書くこと", type: TYPES.SNS },
        { label: "商品を先に作り込むこと", type: TYPES.SKILL },
        { label: "毎回ゼロから納品すること", type: TYPES.CONTENT },
      ],
    },
    {
      title: "人との関わり方はどれが楽ですか？",
      choices: [
        { label: "文章を通して静かに届けたい", type: TYPES.BLOG },
        { label: "気軽な交流から広げたい", type: TYPES.SNS },
        { label: "1対1で役に立ちたい", type: TYPES.SKILL },
        { label: "必要な人に商品を選んでほしい", type: TYPES.CONTENT },
      ],
    },
    {
      title: "成果が出るまでの待ち方として近いのは？",
      choices: [
        { label: "時間をかけて積み上げられる", type: TYPES.BLOG },
        { label: "反応を見てすぐ変えたい", type: TYPES.SNS },
        { label: "小さく受注して経験を増やしたい", type: TYPES.SKILL },
        { label: "少しずつ商品を育てたい", type: TYPES.CONTENT },
      ],
    },
    {
      title: "今ある材料として使えそうなのは？",
      choices: [
        { label: "調べた知識や体験談", type: TYPES.BLOG },
        { label: "日々の気づきや制作過程", type: TYPES.SNS },
        { label: "できる作業や得意なこと", type: TYPES.SKILL },
        { label: "人に教えられる手順", type: TYPES.CONTENT },
      ],
    },
    {
      title: "お金につながるイメージが湧くのは？",
      choices: [
        { label: "記事からサービスを紹介する", type: TYPES.BLOG },
        { label: "発信から信頼を作る", type: TYPES.SNS },
        { label: "依頼を受けて納品する", type: TYPES.SKILL },
        { label: "テンプレや教材を販売する", type: TYPES.CONTENT },
      ],
    },
    {
      title: "最初の一歩としてやれそうなのは？",
      choices: [
        { label: "得意テーマの記事構成を作る", type: TYPES.BLOG },
        { label: "プロフィールと固定投稿を整える", type: TYPES.SNS },
        { label: "小さな出品メニューを作る", type: TYPES.SKILL },
        { label: "1枚のテンプレを作って配る", type: TYPES.CONTENT },
      ],
    },
  ];

  const results = {
    [TYPES.SNS]: {
      title: "SNS発信型",
      badge: "Start light",
      summary:
        "短い発信を重ねながら、反応を見て少しずつ方向性を整えるタイプです。最初から完璧な商品を作るより、日々の気づきや制作過程を出すほうが進みやすいです。",
      reasons: [
        "小さく出して反応を見る進め方と相性が良い",
        "交流やコメントから次の改善点を見つけやすい",
        "実績が少なくても、過程の共有から信頼を作れる",
      ],
      cautions: [
        "反応の数だけで良し悪しを判断しすぎない",
        "毎日投稿を義務にすると続きにくくなる",
        "売り込みより、何を助けられる人なのかを先に伝える",
      ],
      steps: [
        "プロフィールに誰向けの発信かを1行で書く",
        "固定投稿にできること・興味・相談できる内容をまとめる",
        "1週間だけ、制作過程や学びを短く投稿する",
      ],
      links: [
        { label: "X公式ヘルプ", url: "https://help.x.com/ja" },
        { label: "Canva", url: "https://www.canva.com/ja_jp/" },
        { label: "note", url: "https://note.com/" },
      ],
      affiliateOffers: [
        {
          id: "sns-design-tool",
          name: "デザイン制作サービス",
          description: "SNS投稿用の画像やテンプレートを手軽に作りたい人向け。",
          cta: "公式サイトを見る",
          url: "",
          network: "",
          enabled: false,
        },
        {
          id: "sns-learning",
          name: "SNS運用学習サービス",
          description: "発信の基礎から継続の仕組みまで学びたい人向け。",
          cta: "サービスを見る",
          url: "",
          network: "",
          enabled: false,
        },
      ],
    },
    [TYPES.SKILL]: {
      title: "スキル販売型",
      badge: "Serve first",
      summary:
        "今できることを小さなメニューにして、困っている人を直接助けるタイプです。最初は大きな肩書きより、具体的に何をどこまで手伝えるかを見せると始めやすいです。",
      reasons: [
        "相手の困りごとに合わせて価値を出しやすい",
        "小さな実績を作りながら単価を調整できる",
        "文章、デザイン、作業代行、相談など幅広く始められる",
      ],
      cautions: [
        "できることを広げすぎると伝わりにくい",
        "安く受けすぎると疲れやすい",
        "納期や修正範囲は最初に決めておく",
      ],
      steps: [
        "できる作業を3つだけ書き出す",
        "30分から2時間で終わる小さなメニューにする",
        "作例やサンプルを1つ用意する",
      ],
      links: [
        { label: "ココナラ", url: "https://coconala.com/" },
        { label: "クラウドワークス", url: "https://crowdworks.jp/" },
        { label: "ランサーズ", url: "https://www.lancers.jp/" },
      ],
      affiliateOffers: [
        {
          id: "skill-market",
          name: "スキル販売サービス",
          description: "小さな得意をメニューにして出品したい人向け。",
          cta: "無料で始める",
          url: "",
          network: "",
          enabled: false,
        },
        {
          id: "skill-crowdsourcing",
          name: "クラウドソーシング",
          description: "募集案件から自分に合う仕事を探したい人向け。",
          cta: "案件を見てみる",
          url: "",
          network: "",
          enabled: false,
        },
      ],
    },
    [TYPES.BLOG]: {
      title: "ブログ・メディア型",
      badge: "Build assets",
      summary:
        "調べたことや経験を記事にして、長く読まれる場所を作るタイプです。成果まで時間はかかりやすいですが、積み上げた記事があとから効いてきます。",
      reasons: [
        "情報を整理して伝える力を活かしやすい",
        "検索や比較検討から読者と出会える",
        "一度書いた記事を改善しながら資産にできる",
      ],
      cautions: [
        "最初から大きなジャンルを狙うと続きにくい",
        "記事数だけを増やすより、読者の悩みを絞る",
        "成果が出るまで数か月単位で見る",
      ],
      steps: [
        "自分が実体験で書けるテーマを1つ選ぶ",
        "読者の悩みを10個メモする",
        "まず1記事だけ、結論と手順がわかる形で書く",
      ],
      links: [
        { label: "WordPress.org 日本語", url: "https://ja.wordpress.org/" },
        { label: "Google Search Central", url: "https://developers.google.com/search?hl=ja" },
        { label: "A8.net", url: "https://www.a8.net/" },
      ],
      affiliateOffers: [
        {
          id: "blog-server",
          name: "レンタルサーバー",
          description: "WordPressブログを独自ドメインで始めたい人向け。",
          cta: "公式サイトを見る",
          url: "",
          network: "",
          enabled: false,
        },
        {
          id: "blog-affiliate",
          name: "アフィリエイトサービス",
          description: "紹介できる商品やサービスを探したい人向け。",
          cta: "無料で登録する",
          url: "",
          network: "",
          enabled: false,
        },
        {
          id: "blog-learning",
          name: "ブログ・SEO学習サービス",
          description: "記事作成と検索集客の基礎を学びたい人向け。",
          cta: "内容を見る",
          url: "",
          network: "",
          enabled: false,
        },
      ],
    },
    [TYPES.CONTENT]: {
      title: "コンテンツ販売型",
      badge: "Package knowledge",
      summary:
        "自分の経験や手順を、テンプレ・教材・講座としてまとめるタイプです。最初は大きな商品より、1つの悩みを解く小さなコンテンツから作ると現実的です。",
      reasons: [
        "知識や経験を再利用できる形にしやすい",
        "納品型よりも仕組み化しやすい",
        "改善を重ねるほど商品価値を上げられる",
      ],
      cautions: [
        "作り込む前に、本当に欲しい人がいるか確認する",
        "内容を広げすぎず、1つの結果に絞る",
        "販売ページでは誰向けかをはっきり書く",
      ],
      steps: [
        "過去に人へ説明したことを1つ選ぶ",
        "チェックリストやテンプレ1枚にまとめる",
        "無料配布や小さな販売で反応を見る",
      ],
      links: [
        { label: "note", url: "https://note.com/" },
        { label: "STORES", url: "https://stores.jp/" },
        { label: "Stripe", url: "https://stripe.com/jp" },
      ],
      affiliateOffers: [
        {
          id: "content-shop",
          name: "ネットショップ作成サービス",
          description: "教材やテンプレートを自分のショップで販売したい人向け。",
          cta: "無料で始める",
          url: "",
          network: "",
          enabled: false,
        },
        {
          id: "content-learning",
          name: "コンテンツ制作学習サービス",
          description: "商品の作り方や販売ページの基礎を学びたい人向け。",
          cta: "サービスを見る",
          url: "",
          network: "",
          enabled: false,
        },
      ],
    },
  };

  const tieBreakOrder = [TYPES.SNS, TYPES.SKILL, TYPES.BLOG, TYPES.CONTENT];
  const data = { TYPES, questions, results, tieBreakOrder };

  globalScope.SideWorkFinder = {
    ...globalScope.SideWorkFinder,
    data,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = data;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
