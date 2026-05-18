import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge<"typo">({
  extend: {
    classGroups: {
      typo: [
        {
          typo: [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "bold12",
            "bold11",
            "bold10",
            "body1",
            "body2",
            "body3",
            "body4",
            "body5",
            "body6",
            "caption2",
            "caption3",
            "caption4",
            "caption5",
            "caption6",
          ],
        },
      ],
    },
    conflictingClassGroups: {
      typo: ["font-size", "font-weight", "leading"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
