export interface DocChunk {
    id: number;
    text: string;
    embedding: number[];
  }
  
  export const documents: DocChunk[] = [
    {
      id: 1,
      text: "北京是中国的首都，有丰富的旅游资源。",
      embedding: [0.21, -0.11, 0.45, 0.34]
    },
    {
      id: 2,
      text: "上海拥有东方明珠和繁荣的商业氛围。",
      embedding: [0.11, -0.21, 0.58, 0.30]
    },
    {
      id: 3,
      text: "广州的美食非常丰富，尤其是早茶。",
      embedding: [0.40, -0.01, 0.25, 0.20]
    },
    {
        id: 4,
        text: "深圳是中国的经济特区，有丰富的科技资源。",
        embedding: [0.21, -0.11, 0.45, 0.34]
    },
    {
        id: 5,
        text: "成都拥有熊猫基地和丰富的文化底蕴。",
        embedding: [0.11, -0.21, 0.58, 0.30]
    },
    {
        id: 6,
        text: "重庆是中国的直辖市，有丰富的旅游资源。",
        embedding: [0.40, -0.01, 0.25, 0.20]
    },
    {
        id: 7,
        text: "北京明天的天气如何？",
        embedding: [0.21, -0.11, 0.45, 0.34]
    },
    {
        id: 8,
        text: "上海明天的天气如何？",
        embedding: [0.11, -0.21, 0.58, 0.30]
    },
    {
        id: 9,
        text: "重庆明天的天气如何？",
        embedding: [0.40, -0.01, 0.25, 0.20]
    }
  ];