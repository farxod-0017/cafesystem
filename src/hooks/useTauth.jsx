import { useTranslation } from "react-i18next";

export function useTauth() {
  const { t } = useTranslation();
  return (key) => t("auth." + key);
}
