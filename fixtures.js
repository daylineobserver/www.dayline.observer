const fixtures = {
    weather: {
        id: "weather",
        title: "Good Afternoon! It's 17°C outside with 24% relative humidity.",
        body: "Today's weather warning:\\n- Cold Weather Warning\\n- Red\\n\\nTomorrow: \\n12 - 19°C\\n30 - 65%\\nFine. Cold in the morning. Very dry during the day.\\nChance of rain: Low\\n",
        body1: "The winter monsoon is bringing fine, dry weather to Guangdong's coast, with relative humidity below 30% at noon. Tomorrow and tonight are expected to be fine and very dry, with temperatures still cold in the morning. Over the weekend, temperatures will rise slightly, but remain cool in the morning. A windy easterly airstream is predicted for early next week, followed by a dry northeast monsoon from mid-week.",
        updated_at: "2026-01-12T10:00:53Z"
    },
    edb: {
        id: "edb",
        title: "EDB Special Announcement as of Thursday, November 27, 2025 01:10",
        body: "As affected by the fire at Wang Fuk Court and obstructed traffic due to nearby road blockages, the following schools are suspended today (Nov 27): CCC Fung Leung Kit Memorial Secondary School, Tai Po Baptist Public School, S.K.H. Yuen Chen Maun Chen Primary School, Ling Liang Church M H Lau Secondary School, H.K. & Kowloon Kaifong Women's Association Sun Fong Chung College, Po Leung Kuk Tin Ka Ping Millennium Primary School, St Hilary's Primary School, Tai Kwong Hilary College, ⁠Norwegian International School (Kindergarten Section), ⁠Valtorta College, Wong Shiu Chi Secondary School, Po Leung Kuk Lau Chun Kindergarten and Anchors International Nursery (Constellation Cove Campus) For the relevant press release, please visit: https://www.info.gov.hk/gia/general/202511/26/P2025112600923.htm",
        body1: "",
        updated_at: "2026-01-12T10:00:53Z"
    },
    airQuality: {
        id: "aqi",
        title: "Air Quality Warning (Value > 80)",
        body: "- Tuen Mun, HongKong (屯門): 91\\n- North Point, Hong Kong (北角): 83",
        body1: "- Mong Kok, HongKong (旺角): 117\\n- Causeway Bay, HongKong (銅鑼 灣): 128\\n- Tuen Mun, HongKong (屯門): -\\n- Sham Shui Po, HongKong (深水埗): 103\\n- Kwun Tong, HongKong (觀塘): 87\\n- Southern, HongKong (南區): 95\\n- Tai Po, HongKong (大埔): 108\\n- North Point, Hong Kong (北角): 121\\n- Tap Mun, HongKong (塔門): 90\\n- Tsuen Wan, HongKong (荃灣): 96\\n- HongKong (香港): 115\\n- North, HongKong (北區): 102\\n- Yuen Long, HongKong (元朗): 113\\n- Central/Western, HongKong (中西區): 96\\n- Tseung Kwan O, HongKong (將軍澳): 76\\n- Sha Tin, HongKong (沙田): 94\\n- Central, HongKong (中環): 115\\n- Tung Chung, HongKong (東涌): 93\\n- Kwai Chung, HongKong (葵涌): 96\\n- Eastern, HongKong (東區): 82",
        updated_at: "2026-01-12T10:00:53Z"
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = fixtures;
}
