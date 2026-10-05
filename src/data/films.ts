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
    description: "",
    still: "/stills/exercise-zero.jpg",
    theme: { bg: "#93A98F", text: "#10160D" },
    credits: { left: "", right: "" },
  },
  {
    id: "a-sweet-habit",
    title: "A Sweet Habit",
    description: "",
    still: "/stills/a-sweet-habit.jpg",
    theme: { bg: "#B08C86", text: "#1A0E0C" },
    credits: { left: "", right: "" },
  },
  {
    id: "the-girl-and-the-sea",
    title: "The Girl and the Sea",
    description: "",
    still: "/stills/girl-and-the-sea.jpg",
    theme: { bg: "#8FA2A6", text: "#0C1417" },
    credits: { left: "", right: "" },
  },
];
