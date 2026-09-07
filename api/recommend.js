export default async function handler(req, res) {
  // Разрешаем запросы с твоего сайта
  res.setHeader("Access-Control-Allow-Origin", "https://bbnos-t.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешён" });
  }

  try {
    const { category, duration, budget, companions } = req.body || {};

    const prompt = `
Ты — SAFAR AI, туристический помощник по Кызылординской области Казахстана.

Параметры пользователя:
- Интересы: ${category || "не указаны"}
- Продолжительность: ${duration || "не указана"}
- Бюджет: ${budget || "не указан"}
- Компания: ${companions || "не указана"}

Твоя задача:
1. Найди подходящие туристические места ТОЛЬКО в Кызылординской области.
2. Используй веб-поиск.
3. В первую очередь используй официальные источники:
   - gov.kz
   - kazakhstan.travel
   - официальные сайты музеев, заповедников, туристических объектов.
4. Не придумывай цены, расписания, адреса или другие факты.
5. Если актуальная информация не найдена — прямо напиши об этом.
6. Выбери 3 наиболее подходящих варианта.
7. Для каждого укажи:
   - название;
   - почему подходит;
   - краткое описание;
   - примерную длительность;
   - бюджет, только если он подтверждён источником;
   - ссылку на источник.

Ответ дай на русском языке.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        tools: [
          {
            type: "web_search",
            filters: {
              allowed_domains: [
                "gov.kz",
                "kazakhstan.travel"
              ]
            }
          }
        ],
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(response.status).json({
        error: "Ошибка OpenAI",
        details: data
      });
    }

    return res.status(200).json({
      answer: data.output_text || "Не удалось получить ответ."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Ошибка сервера"
    });
  }
}
