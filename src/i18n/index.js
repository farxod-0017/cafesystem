import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// === 1) MODULLAR TARJIMALARI ===

// AUTH
import authUZ from "./modules/auth/uz.json";
import authRU from "./modules/auth/ru.json";
import authEN from "./modules/auth/en.json";

// SIDEBAR
import sidebarUZ from "./modules/sidebar/uz.json";
import sidebarRU from "./modules/sidebar/ru.json";
import sidebarEN from "./modules/sidebar/en.json";


// === 2) HAMMASINI BIRLASHTIRAMIZ ===
const resources = {
    uz: {
        translation: {
            auth: authUZ,
            sidebar: sidebarUZ,
        }
    },
    ru: {
        translation: {
            auth: authRU,
            sidebar: sidebarRU,
        }
    },
    en: {
        translation: {
            auth: authEN,
            sidebar: sidebarEN,
        }
    }
};


// === 3) i18n INIT ===
i18n
    .use(initReactI18next)
    .init({
        lng: localStorage.getItem("lang") || "uz",
        fallbackLng: "uz",
        interpolation: {
            escapeValue: false,
        },
        resources
    });

export default i18n;
