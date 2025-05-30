"use client";

import { useState } from "react";
import { DisclaimerModal } from "./disclaimer-modal";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <footer className="py-4 text-center text-sm text-gray-600 dark:text-gray-400">
      <button
        onClick={() => setIsModalOpen(true)}
        className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
      >
        {t("disclaimer.disclaimer.title")}
      </button>
      <DisclaimerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </footer>
  );
}
