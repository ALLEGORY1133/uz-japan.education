/** Demo tasvirlar (public/demo). Admin o'z rasmini yuklasa, u ustun turadi; yuklanmagan joyda shular chiqadi. */
export const DEMO = {
  jp: ["/demo/fuji.jpg", "/demo/kyoto.jpg", "/demo/tokyo.jpg", "/demo/torii.jpg"],
  uz: ["/demo/registan.jpg", "/demo/dome.jpg", "/demo/campus.jpg"],
  news: ["/demo/campus.jpg", "/demo/train.jpg", "/demo/desk.jpg"],
  cooperation: ["/demo/bridge.jpg", "/demo/fuji.jpg", "/demo/registan.jpg"],
  event: ["/demo/lantern.jpg", "/demo/grad.jpg", "/demo/torii.jpg"],
  platform: ["/demo/desk.jpg", "/demo/campus.jpg", "/demo/tokyo.jpg"],
  links: ["/demo/desk.jpg", "/demo/grad.jpg", "/demo/train.jpg", "/demo/campus.jpg", "/demo/kyoto.jpg", "/demo/bridge.jpg"],
  gallery: ["fuji", "registan", "torii", "campus", "tokyo", "dome", "kyoto", "grad", "bridge", "lantern", "train", "desk"].map((n) => `/demo/${n}.jpg`),
};

export function pickDemo(list: string[], i: number): string {
  return list[((i % list.length) + list.length) % list.length];
}
