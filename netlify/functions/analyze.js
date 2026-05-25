exports.handler = async (event) => {
  // POST以外は拒否
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { imageData, gender } = JSON.parse(event.body);

    if (!imageData || !gender) {
      return { statusCode: 400, body: 'Missing imageData or gender' };
    }

    const isMale = gender === 'male';
    const genderLabel = isMale ? '男性' : '女性';

    const prompt = `あなたは辛口だが的確な顔診断AIです。
ユーザーの顔写真（${genderLabel}）を分析して、以下のJSON形式で返してください。
絶対にJSONのみを返し、マークダウンや説明文は不要です。

{
  "totalScore": <50-88の整数>,
  "rank": <"S"|"A"|"B"|"C"|"D">,
  "partScores": [
    {"name": "目・二重", "score": <0-100>},
    {"name": "鼻・鼻筋", "score": <0-100>},
    {"name": "口元・唇", "score": <0-100>},
    {"name": "輪郭・フェイスライン", "score": <0-100>},
    {"name": "肌質・清潔感", "score": <0-100>},
    {"name": "全体バランス", "score": <0-100>}
  ],
  "harshComments": [
    {"part": "最も気になる部位", "comment": "辛口だが的確な指摘（30-50文字）"},
    {"part": "2番目に気になる部位", "comment": "辛口だが的確な指摘（30-50文字）"},
    {"part": "改善余地", "comment": "率直なコメント（30-50文字）"}
  ],
  "improvements": [
    {
      "tag": "${isMale ? 'メンズメイク' : 'メイク'}",
      "title": "具体的なアドバイスタイトル",
      "text": "詳細なアドバイス（50-80文字）"
    },
    {
      "tag": "スキンケア",
      "title": "具体的なアドバイスタイトル",
      "text": "詳細なアドバイス（50-80文字）"
    },
    {
      "tag": "ヘアスタイル",
      "title": "具体的なアドバイスタイトル",
      "text": "詳細なアドバイス（50-80文字）"
    }
  ],
  "moteAdvice": [
    {
      "tag": "モテトーク",
      "title": "モテるための会話術タイトル",
      "text": "具体的なモテトークアドバイス（50-80文字）"
    },
    {
      "tag": "${isMale ? 'モテ行動' : 'モテしぐさ'}",
      "title": "モテる${isMale ? '行動・仕草' : '仕草・行動'}タイトル",
      "text": "具体的なアドバイス（50-80文字）"
    }
  ]
}

採点は現実的で厳しめに（平均的な顔は60-70点程度）。
コメントは辛口だが建設的に。アドバイスは具体的で実践的に。
モテアドバイスは外見と連動させて。`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageData
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: 500, body: `Anthropic API error: ${err}` };
    }

    const data = await response.json();
    const text = data.content.filter(c => c.type === 'text').map(c => c.text).join('');
    const clean = text.replace(/```json|```/g, '').trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: clean
    };

  } catch (err) {
    return { statusCode: 500, body: `Error: ${err.message}` };
  }
};
