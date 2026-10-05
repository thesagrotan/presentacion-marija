import type { Film } from "./types";

export const films: Film[] = [
  {
    id: "enigma",
    title: "The Enigma of an Autumn Afternoon",
    description:
      'Inspired by the metaphysical paintings of Giorgio de Chirico, the film transforms an ordinary public space into a mysterious and dreamlike tableau. Like De Chirico’s silent plazas and suspended moments, "The Enigma of an Autumn Afternoon" explores stillness, ambiguity, and the subtle strangeness that can exist within familiar places, as people gather beneath a tree enchanted by an invisible orchestra of birds.',
    still: "/stills/enigma.jpg",
    theme: { bg: "#96A391", text: "#12140B" },
    credits: {
      left:
        "Director: Marija Arakelyan Lučić\nDOP: Danny Shin\nSound design/mix: Luka Barajević\nCast: Ábris Imre, Miyeon Hwang, Julien Kartheuser, Leo Zhang, Peng Liu, Santiago Gómez García, Marcos Quincke, Doruk Kaya, Luise Hogg, Camille Couavoux, Ema Dobrić",
      right:
        "With the support of  Hochschule für bildende Künste Hamburg\n\nASA Open Studios HFBK, Hamburg, Germany, 2026\nFilmkunsttage Sachsen Anhalt, Germany, 2026\n43. Kassel Documentary Film and Video Festival, Kassel, Germany, 2026",
    },
  },
  {
    id: "exercise-zero",
    title: "Exercise Zero",
    description:
      "After dreaming that he has become a donkey, a basketball coach moves away from conventional tactics and leads his team according to a new understanding of intuition and mind-body coordination.",
    still: "/stills/exercise-zero.jpg",
    theme: { bg: "#93A98F", text: "#10160D" },
    credits: {
      left:
        "Director: Marija Arakelyan Lucic\nDOP: Laurin Buitmann\nSound: Marcos Quincke\nCast: Rafael Kuhn, Daniel Mora Lopez, Miyeon Hwang, Nikoloz Mamatsashvili, Siri Hammarén, Peng Liu",
      right:
        "With the support of  Hochschule für bildende Künste Hamburg",
    },
  },
  {
    id: "a-sweet-habit",
    title: "A Sweet Habit",
    description:
      "At a train station, two friends wait. One will leave, and the other one will stay. Between waiting and parting, the complexity of their friendship surfaces, revealing the pain and tenderness of bonds.",
    still: "/stills/a-sweet-habit.jpg",
    theme: { bg: "#B08C86", text: "#1A0E0C" },
    credits: {
      left:
        "Director: Marija Arakelyan Lucic\nDOP: Rafael Kuhn\nSound: Angeles Lopez\nCast: Siri Hammarén, Marija Arakelyan Lucic",
      right:
        "With the support of  Hochschule für bildende Künste Hamburg\n\nAnnual Exhibition HFBK, Hamburg, 2025\nOne Shot 23th International Short Film Festival, Jerewan, Armenia,2025\nFILMZ Festival des deutschen Kino,Mainz,Germany, 2025",
    },
  },
  {
    id: "the-girl-and-the-sea",
    title: "The Girl and the Sea",
    description:
      "On a windy summer day, a man discovers a woman drifting in a restless sea and close to death. The waves grow larger, swallowing every spoken word.",
    still: "/stills/girl-and-the-sea.jpg",
    theme: { bg: "#8FA2A6", text: "#0C1417" },
    credits: {
      left:
        "Director: Marija Arakelyan Lučić\nDOP: Marija Arakelyan Lučić\nSound: Alma Mimica\nSound design/mix: Jochen Jezussek\nCast: Orly Nurany, Marin Tudor",
      right:
        "with the support of\nHochschule für bildende Künste Hamburg\nKino Klub Split\n\nKurzfilm Festival Hamburg (section: Industry day: Filmhochschultag) - Hamburg, Germany, 2024 \nGalichnik Film Festival - Galichnik, Nord Macedonia, 2024",
    },
  },
];
