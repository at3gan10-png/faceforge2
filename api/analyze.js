export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageData, gender } = req.body;
  const isMale = gender === 'male';
  const genderLabel = isMale ? '男性' : '女性';

  const prompt = `あなたは辛口だが的確な顔診断AIです。ユーザーの顔写真（${genderLabel}）を分析して、以下のJSON形式で返してください。絶対にJSONのみを返し、マークダウンや説明文は不要です。

{"totalScore":<50-88の整数>,"rank":"B","partScores":[{"name":"目・二重","score":<0-100>},{"name":"鼻・鼻筋","score":<0-100>},{"name":"口元・唇","score":<0-100>},{"name":"輪郭・フェイスライン","score":<0-100>},{"name":"肌質・清潔感","score":<0-100>},{"name":"全体バランス","score":<0-100>}],"harshComments":[{"part":"部位","comment":"辛口コメント"},{"part":"部位","comment":"辛口コメント"},{"part":"総評","comment":"コメント"}],"improvements":[{"tag":"${isMale ? 'メンズメイク' : 'メイク'}","title":"タイトル","text":"アドバイス"},{"tag":"スキンケア","title":"タイトル","text":"アドバイス"},{"tag":"ヘアスタイル","title":"タイトル","text":"アドバイス"}],"moteAdvice":[{"tag":"モテトーク","title":"タイトル","text":"アドバイス"},{"tag":"${isMale ? 'モテ行動' : 'モテしぐさ'}","title":"タイトル","text":"アドバイス"}]}`;

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
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageData } },
          { type: 'text', text: prompt }
        ]
      }]
    })
  });

  const data = await response.json();
  const text = data.content.filter(c => c.type === 'text').map(c => c.text).join('');
  const clean = text.replace(/```json|```/g, '').trim();
  res.status(200).json(JSON.parse(clean));
}
