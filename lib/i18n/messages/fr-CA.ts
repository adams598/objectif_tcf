import type { CoreMessages } from "../types";
import { frFR } from "./fr-FR";

export const frCA: CoreMessages = {
  ...frFR,
  settings: {
    ...frFR.settings,
    email: "Adresse courriel",
    langFrCa: "Français (Canada)",
  },
};
