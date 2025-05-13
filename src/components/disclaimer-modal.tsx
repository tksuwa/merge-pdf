import { useTranslations } from "next-intl";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  const t = useTranslations("disclaimer");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-right text-sm text-gray-500 mb-4">
          {t("lastUpdated")}
        </div>
        <div className="space-y-6 text-left">
          <section>
            <h2 className="text-xl font-bold mb-3">{t("about.title")}</h2>
            <p className="mb-2">{t("about.description1")}</p>
            <p>{t("about.description2")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{t("privacy.title")}</h2>
            <p className="mb-2">{t("privacy.description1")}</p>
            <p>{t("privacy.description2")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{t("disclaimer.title")}</h2>
            <p className="mb-2">{t("disclaimer.description1")}</p>
            <p>{t("disclaimer.description2")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{t("damages.title")}</h2>
            <p>{t("damages.description")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{t("updates.title")}</h2>
            <p>{t("updates.description")}</p>
          </section>
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
}
