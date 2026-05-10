// One-time script to import price data into the SQLite database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const prices = [
    // 🔌 Прокладка кабеля и монтаж проводки / Kabelių tiesimas ir instaliacija
    { category_ru: '🔌 Прокладка кабеля и монтаж проводки', category_lt: '🔌 Kabelių tiesimas ir instaliacija', name_ru: 'Штробление канала в кирпиче / блоках', name_lt: 'Kanalo frezavimas plytose / blokuose', unit_ru: 'м.п.', unit_lt: 'm.p.', price: '3 – 5' },
    { category_ru: '🔌 Прокладка кабеля и монтаж проводки', category_lt: '🔌 Kabelių tiesimas ir instaliacija', name_ru: 'Штробление канала в бетоне', name_lt: 'Kanalo frezavimas betone', unit_ru: 'м.п.', unit_lt: 'm.p.', price: '5 – 10' },
    { category_ru: '🔌 Прокладка кабеля и монтаж проводки', category_lt: '🔌 Kabelių tiesimas ir instaliacija', name_ru: 'Штробление канала в гипсокартоне', name_lt: 'Kanalo frezavimas gipso kartone', unit_ru: 'м.п.', unit_lt: 'm.p.', price: '1,20 – 3' },
    { category_ru: '🔌 Прокладка кабеля и монтаж проводки', category_lt: '🔌 Kabelių tiesimas ir instaliacija', name_ru: 'Прокладка кабеля по поверхности (открытая)', name_lt: 'Kabelio tiesimas paviršiumi (atviras)', unit_ru: 'м.п.', unit_lt: 'm.p.', price: '1 – 1,50' },
    { category_ru: '🔌 Прокладка кабеля и монтаж проводки', category_lt: '🔌 Kabelių tiesimas ir instaliacija', name_ru: 'Прокладка кабеля в гофре / кабель-канале', name_lt: 'Kabelio tiesimas gofre / kanale', unit_ru: 'м.п.', unit_lt: 'm.p.', price: '1 – 2' },
    { category_ru: '🔌 Прокладка кабеля и монтаж проводки', category_lt: '🔌 Kabelių tiesimas ir instaliacija', name_ru: 'Прокладка кабеля в штробе (скрытая)', name_lt: 'Kabelio tiesimas frezuotame kanale (paslėptas)', unit_ru: 'м.п.', unit_lt: 'm.p.', price: '2 – 4' },
    { category_ru: '🔌 Прокладка кабеля и монтаж проводки', category_lt: '🔌 Kabelių tiesimas ir instaliacija', name_ru: 'Высверливание отверстия под подрозетник (блок/кирпич)', name_lt: 'Skylės gręžimas dėžutei (blokas/plyta)', unit_ru: 'шт.', unit_lt: 'vnt.', price: '2 – 4' },
    { category_ru: '🔌 Прокладка кабеля и монтаж проводки', category_lt: '🔌 Kabelių tiesimas ir instaliacija', name_ru: 'Установка подрозетника / монтажной коробки', name_lt: 'Dėžutės / montažinės dėžutės įrengimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '3' },

    // ⚡ Электрические точки / Elektros taškai
    { category_ru: '⚡ Электрические точки (розетки, выключатели)', category_lt: '⚡ Elektros taškai (rozetės, jungikliai)', name_ru: 'Монтаж электрической точки (розетка / выключатель) — черновой', name_lt: 'Elektros taško montavimas (rozetė / jungiklis) — juodraštinis', unit_ru: 'шт.', unit_lt: 'vnt.', price: '6 – 15' },
    { category_ru: '⚡ Электрические точки (розетки, выключатели)', category_lt: '⚡ Elektros taškai (rozetės, jungikliai)', name_ru: 'Монтаж электрической точки — чистовой (после отделки)', name_lt: 'Elektros taško montavimas — švarus (po apdailos)', unit_ru: 'шт.', unit_lt: 'vnt.', price: '10 – 25' },
    { category_ru: '⚡ Электрические точки (розетки, выключатели)', category_lt: '⚡ Elektros taškai (rozetės, jungikliai)', name_ru: 'Полный монтаж точки «под ключ» (штроба + кабель + подключение)', name_lt: 'Pilnas taško montavimas (frezavimas + kabelis + pajungimas)', unit_ru: 'шт.', unit_lt: 'vnt.', price: '25 – 35' },
    { category_ru: '⚡ Электрические точки (розетки, выключатели)', category_lt: '⚡ Elektros taškai (rozetės, jungikliai)', name_ru: 'Установка скрытого выключателя с подключением', name_lt: 'Paslėpto jungiklio su pajungimu įrengimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '4 – 8' },
    { category_ru: '⚡ Электрические точки (розетки, выключатели)', category_lt: '⚡ Elektros taškai (rozetės, jungikliai)', name_ru: 'Установка розетки для электроплиты (силовая)', name_lt: 'Rozetės elektrinei viryklei (galios) įrengimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '15 – 30' },
    { category_ru: '⚡ Электрические точки (розетки, выключатели)', category_lt: '⚡ Elektros taškai (rozetės, jungikliai)', name_ru: 'Перенос существующей точки', name_lt: 'Esamo taško perkėlimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '20 – 40' },

    // ⚙️ Электрощиты / Elektros skydai
    { category_ru: '⚙️ Электрощиты и защитное оборудование', category_lt: '⚙️ Elektros skydai ir apsaugos įranga', name_ru: 'Монтаж распределительного щита (до 12 модулей)', name_lt: 'Paskirstymo skydo montavimas (iki 12 modulių)', unit_ru: 'шт.', unit_lt: 'vnt.', price: '70 – 120' },
    { category_ru: '⚙️ Электрощиты и защитное оборудование', category_lt: '⚙️ Elektros skydai ir apsaugos įranga', name_ru: 'Монтаж распределительного щита (12–36 модулей)', name_lt: 'Paskirstymo skydo montavimas (12–36 moduliai)', unit_ru: 'шт.', unit_lt: 'vnt.', price: '120 – 250' },
    { category_ru: '⚙️ Электрощиты и защитное оборудование', category_lt: '⚙️ Elektros skydai ir apsaugos įranga', name_ru: 'Сборка и коммутация щита (комплексная)', name_lt: 'Skydo surinkimas ir komutavimas (kompleksinis)', unit_ru: 'шт.', unit_lt: 'vnt.', price: '150 – 400' },
    { category_ru: '⚙️ Электрощиты и защитное оборудование', category_lt: '⚙️ Elektros skydai ir apsaugos įranga', name_ru: 'Установка автоматического выключателя', name_lt: 'Automatinio jungiklio įrengimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '6 – 12' },
    { category_ru: '⚙️ Электрощиты и защитное оборудование', category_lt: '⚙️ Elektros skydai ir apsaugos įranga', name_ru: 'Установка УЗО / дифавтомата', name_lt: 'Nuotėkio relės / dif. automato įrengimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '8 – 20' },
    { category_ru: '⚙️ Электрощиты и защитное оборудование', category_lt: '⚙️ Elektros skydai ir apsaugos įranga', name_ru: 'Установка реле контроля напряжения', name_lt: 'Įtampos kontrolės relės įrengimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '10 – 20' },
    { category_ru: '⚙️ Электрощиты и защитное оборудование', category_lt: '⚙️ Elektros skydai ir apsaugos įranga', name_ru: 'Перенос / реконструкция существующего щита', name_lt: 'Esamo skydo perkėlimas / rekonstrukcija', unit_ru: 'шт.', unit_lt: 'vnt.', price: '120+' },

    // 💡 Освещение / Apšvietimas
    { category_ru: '💡 Освещение', category_lt: '💡 Apšvietimas', name_ru: 'Подключение потолочного светильника', name_lt: 'Lubų šviestuvo pajungimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '15 – 25' },
    { category_ru: '💡 Освещение', category_lt: '💡 Apšvietimas', name_ru: 'Монтаж встраиваемого (точечного) светильника', name_lt: 'Įleidžiamo (taškinio) šviestuvo montavimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '8 – 15' },
    { category_ru: '💡 Освещение', category_lt: '💡 Apšvietimas', name_ru: 'Монтаж настенного светильника (бра)', name_lt: 'Sieninio šviestuvo montavimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '15 – 25' },
    { category_ru: '💡 Освещение', category_lt: '💡 Apšvietimas', name_ru: 'Монтаж LED-ленты', name_lt: 'LED juostos montavimas', unit_ru: 'м.п.', unit_lt: 'm.p.', price: '5 – 12' },
    { category_ru: '💡 Освещение', category_lt: '💡 Apšvietimas', name_ru: 'Установка диммера (регулятора яркости)', name_lt: 'Šviesos reguliatoriaus (dimerio) įrengimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '10 – 20' },
    { category_ru: '💡 Освещение', category_lt: '💡 Apšvietimas', name_ru: 'Проектирование схемы освещения', name_lt: 'Apšvietimo schemos projektavimas', unit_ru: 'объект', unit_lt: 'objektas', price: '50 – 200' },

    // 📐 Проектирование / Projektavimas
    { category_ru: '📐 Проектирование электросетей', category_lt: '📐 Elektros tinklų projektavimas', name_ru: 'Электрический план квартиры (до 80 м²)', name_lt: 'Buto elektros planas (iki 80 m²)', unit_ru: 'проект', unit_lt: 'projektas', price: '50 – 150' },
    { category_ru: '📐 Проектирование электросетей', category_lt: '📐 Elektros tinklų projektavimas', name_ru: 'Электрический проект дома (80–200 м²)', name_lt: 'Namo elektros projektas (80–200 m²)', unit_ru: 'проект', unit_lt: 'projektas', price: '150 – 300' },
    { category_ru: '📐 Проектирование электросетей', category_lt: '📐 Elektros tinklų projektavimas', name_ru: 'Полный инженерный проект дома (200+ м²)', name_lt: 'Pilnas inžinerinis namo projektas (200+ m²)', unit_ru: 'проект', unit_lt: 'projektas', price: '300 – 800+' },
    { category_ru: '📐 Проектирование электросетей', category_lt: '📐 Elektros tinklų projektavimas', name_ru: 'Проект коммерческого / промышленного объекта', name_lt: 'Komercinio / pramoninio objekto projektas', unit_ru: 'проект', unit_lt: 'projektas', price: 'от 500' },
    { category_ru: '📐 Проектирование электросетей', category_lt: '📐 Elektros tinklų projektavimas', name_ru: 'Замер сопротивления изоляции (протокол)', name_lt: 'Izoliacijos varžos matavimas (protokolas)', unit_ru: 'объект', unit_lt: 'objektas', price: '50 – 100' },

    // 🏠 Умный дом / Išmanieji namai
    { category_ru: '🏠 Умный дом и автоматизация', category_lt: '🏠 Išmanieji namai ir automatizacija', name_ru: 'Установка умного выключателя (беспроводной)', name_lt: 'Išmaniojo jungiklio (belaidžio) įrengimas', unit_ru: 'шт.', unit_lt: 'vnt.', price: '15 – 30' },
    { category_ru: '🏠 Умный дом и автоматизация', category_lt: '🏠 Išmanieji namai ir automatizacija', name_ru: 'Настройка системы умного освещения (до 10 точек)', name_lt: 'Išmaniojo apšvietimo sistemos nustatymas (iki 10 taškų)', unit_ru: 'комплект', unit_lt: 'kompl.', price: '100 – 250' },
    { category_ru: '🏠 Умный дом и автоматизация', category_lt: '🏠 Išmanieji namai ir automatizacija', name_ru: 'Базовая автоматизация (свет + розетки, беспроводная)', name_lt: 'Bazinė automatizacija (šviesa + rozetės, belaidė)', unit_ru: 'объект', unit_lt: 'objektas', price: '300 – 800' },
    { category_ru: '🏠 Умный дом и автоматизация', category_lt: '🏠 Išmanieji namai ir automatizacija', name_ru: 'Профессиональная система (KNX / Loxone) — проводная', name_lt: 'Profesionali sistema (KNX / Loxone) — laidinė', unit_ru: 'объект', unit_lt: 'objektas', price: '2 000 – 8 000+' },
    { category_ru: '🏠 Умный дом и автоматизация', category_lt: '🏠 Išmanieji namai ir automatizacija', name_ru: 'Интеграция видеонаблюдения + сигнализации', name_lt: 'Vaizdo stebėjimo + signalizacijos integracija', unit_ru: 'объект', unit_lt: 'objektas', price: '500 – 2 000' },

    // ☀️ Солнечные электростанции / Saulės elektrinės
    { category_ru: '☀️ Солнечные электростанции', category_lt: '☀️ Saulės elektrinės', name_ru: 'Солнечная электростанция 3 кВт', name_lt: 'Saulės elektrinė 3 kW', unit_ru: 'комплект', unit_lt: 'kompl.', price: '1 000 – 2 500' },
    { category_ru: '☀️ Солнечные электростанции', category_lt: '☀️ Saulės elektrinės', name_ru: 'Солнечная электростанция 5 кВт', name_lt: 'Saulės elektrinė 5 kW', unit_ru: 'комплект', unit_lt: 'kompl.', price: '2 500 – 4 000' },
    { category_ru: '☀️ Солнечные электростанции', category_lt: '☀️ Saulės elektrinės', name_ru: 'Солнечная электростанция 10 кВт', name_lt: 'Saulės elektrinė 10 kW', unit_ru: 'комплект', unit_lt: 'kompl.', price: '4 000 – 6 000' },
    { category_ru: '☀️ Солнечные электростанции', category_lt: '☀️ Saulės elektrinės', name_ru: 'Гибридный инвертер + накопитель энергии', name_lt: 'Hibridinis keitiklis + energijos kaupiklis', unit_ru: 'комплект', unit_lt: 'kompl.', price: 'от 3 000' },

    // 🚨 Аварийный выезд / Avarinis iškvietimas
    { category_ru: '🚨 Аварийный выезд и диагностика', category_lt: '🚨 Avarinis iškvietimas ir diagnostika', name_ru: 'Выезд электрика (рабочее время Пн–Пт)', name_lt: 'Elektriko iškvietimas (darbo laiku Pr–Pn)', unit_ru: 'час', unit_lt: 'val.', price: '25 – 30' },
    { category_ru: '🚨 Аварийный выезд и диагностика', category_lt: '🚨 Avarinis iškvietimas ir diagnostika', name_ru: 'Выезд электрика (вечер / выходные)', name_lt: 'Elektriko iškvietimas (vakare / savaitgaliais)', unit_ru: 'час', unit_lt: 'val.', price: '35 – 50' },
    { category_ru: '🚨 Аварийный выезд и диагностика', category_lt: '🚨 Avarinis iškvietimas ir diagnostika', name_ru: 'Диагностика неисправности', name_lt: 'Gedimo diagnostika', unit_ru: 'объект', unit_lt: 'objektas', price: '30 – 60' },
    { category_ru: '🚨 Аварийный выезд и диагностика', category_lt: '🚨 Avarinis iškvietimas ir diagnostika', name_ru: 'Замена автомата / УЗО (срочная)', name_lt: 'Automato / nuotėkio relės keitimas (skubus)', unit_ru: 'шт.', unit_lt: 'vnt.', price: '20 – 40' },
];

console.log('🔄 Starting price import...');

// First clear existing prices to avoid duplicates
db.run('DELETE FROM prices', (err) => {
    if (err) {
        console.error('❌ Error clearing prices table:', err.message);
        db.close();
        return;
    }
    console.log('✅ Cleared existing prices');

    const stmt = db.prepare(
        `INSERT INTO prices (category_lt, category_ru, name_lt, name_ru, unit_lt, unit_ru, price) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    let count = 0;
    prices.forEach((p, i) => {
        stmt.run(
            [p.category_lt, p.category_ru, p.name_lt, p.name_ru, p.unit_lt, p.unit_ru, p.price],
            (err) => {
                if (err) {
                    console.error(`❌ Error inserting row ${i + 1}:`, err.message);
                } else {
                    count++;
                }

                if (i === prices.length - 1) {
                    stmt.finalize(() => {
                        console.log(`✅ Successfully imported ${count} / ${prices.length} prices`);
                        db.close();
                    });
                }
            }
        );
    });
});
