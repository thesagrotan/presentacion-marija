export type Theme = {
  bg: string;
  text: string;
};

export type Credits = {
  left: string;
  right: string;
};

export type Film = {
  id: string;
  title: string;
  description: string;
  still: string;
  theme: Theme;
  credits: Credits;
};
