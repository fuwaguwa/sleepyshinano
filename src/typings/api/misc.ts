export interface NekosBestResponse {
  results: { url: string }[];
}

export interface TriviaApiItem {
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  difficulty: string;
  category: string;
}

export interface TriviaFetchedQuestion {
  question: string;
  difficulty: string;
  category: string;
  answers: string[]; // first item is the correct answer (pre-shuffle)
}

export interface TriviaQuestion {
  question: string;
  difficulty: string;
  category: string;
  correctAnswer: string;
  answers: string[];
}

export interface DadJokeResponse {
  id?: string;
  joke: string;
}

export interface JokeResponse {
  joke: string;
}

export interface OwoifyResponse {
  owo: string;
}

export interface UrbanDictionaryResponse {
  list: {
    word: string;
    definition: string;
    author: string;
    thumbs_up: number;
    thumbs_down: number;
  }[];
}

// Discord API user object subset used by banner command
export interface DiscordUserResponse {
  banner?: string;
}
