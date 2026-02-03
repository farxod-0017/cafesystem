import { useTranslation } from "react-i18next";

export function useTsidebar() {
  const { t } = useTranslation();
  return (key) => t("sidebar." + key);
}
