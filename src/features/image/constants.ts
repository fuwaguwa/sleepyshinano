import path from "node:path";

export const CAT_API_URL = "https://api.thecatapi.com/v1/images/search";
export const CATGIRL_API_URL = "https://nekos.best/api/v2/neko";
export const DOG_API_URL = "https://dog.ceo/api/breeds/image/random";
export const FOX_API_URL = "https://randomfox.ca/floof/";
export const HUSBANDO_API_URL = "https://nekos.best/api/v2/husbando";

export const PETPET_SIZE = 128; // canvas size (square)
export const PETPET_DELAY = 20; // frame delay ms
export const PETPET_FRAMES_PATH = path.resolve(process.cwd(), "data", "petpet");
export const PETPET_FRAME_COUNT = 10; // number of pet frames
